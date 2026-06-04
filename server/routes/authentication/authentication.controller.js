/* eslint-disable strict */
const _ = require('lodash');
const secretsConfig = require('config');
const jwt = require('jsonwebtoken');
const { axiosClient } = require('../../objects/axios-instance');
const { makeManualError, replaceAllObjKeys } = require('../../lib/mod-utils');
const { isSuperUser, isSystemAdministrator } = require('../../components/auth/user-type');
const { transformCourtName } = require('../../components/filters');

// this is dev only...
module.exports.postDevEmailAuth = function(app) {
  return async function(req, res) {
    if (!req.body.email) {
      req.session.errors = makeManualError('email', 'Email is required for dev email auth');

      return res.redirect(app.namedRoutes.build('login.get'));
    }

    req.session.email = req.body.email;

    return res.redirect(app.namedRoutes.build('authentication.courts-list.get'));
  };
};

module.exports.getCourtsList = function(app) {
  return async function(req, res) {
    const signingKey = secretsConfig.get('secrets.juror.bureau-jwtNoAuthKey');
    const expiresIn = secretsConfig.get('secrets.juror.bureau-jwtTTL');

    const authToken = jwt.sign({}, signingKey, { expiresIn });
    const body = { email: req.session.email || req.session.authentication?.email };
    let courtsList;

    if (!body) {
      req.session.errors = makeManualError('email', 'Email is required for courts list');
      
      return res.redirect(app.namedRoutes.build('login.get'));
    }

    try {
      courtsList = await fetchAuthCourtsList(authToken, body);

      // keep it only during this request lifetime
      req.session.authCourtsList = courtsList;
      req.session.noKeyAuthToken = authToken;

      req.session.changeCourtAvailable = courtsList.length > 1;
    } catch (err) {
      app.logger.crit('Failed to get courts list', {
        data: { body },
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      if (err.error?.message) {
        req.session.errors = makeManualError('email', err.error?.message);
      }

      return res.redirect(app.namedRoutes.build('login.get'));
    }

    if (courtsList.length === 1) {
      return loginSingleCourt(req, res, { app, courtsList, body });
    }

    const tmpErrors = _.clone(req.session.errors);

    delete req.session.errors;

    res.render('authentication/courts-list.njk', {
      courtsList,
      email: req.session.email,
      selectedCourt: req.session.selectedCourt, // this only gets set if the user is authenticated
      cancelUrl: resolveCancelUrl(app, req),
      errors: {
        title: 'Please check the form',
        count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
        items: tmpErrors,
      },
    });
  };
};

module.exports.postCourtsList = function(app) {
  return async function(req, res) {
    const locCode = req.body.court;
    const body = { email: req.session.email || req.session.authentication.email };

    if (!locCode) {
      req.session.errors = makeManualError('select-court', 'Select the court you want to manage');

      return res.redirect(app.namedRoutes.build('authentication.courts-list.get'));
    }

    try {
      await doLogin(req)(app, locCode, body);

      return res.redirect(app.namedRoutes.build('homepage.get'));
    } catch (err) {
      req.session.errors = makeManualError('select-court', 'Something went wrong when selecting a court');

      app.logger.crit('Failed to login when selecting a court', {
        data: { body, locCode },
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      return res.render('_errors/generic', { err });
    }
  };
};

module.exports.getSelectCourt = function(app) {
  return async function(req, res) {
    const { locCode } = req.params;
    const body = { email: req.session.authentication.email };

    const signingKey = secretsConfig.get('secrets.juror.bureau-jwtNoAuthKey');
    const expiresIn = secretsConfig.get('secrets.juror.bureau-jwtTTL');

    req.session.noKeyAuthToken = jwt.sign({}, signingKey, { expiresIn });

    try {
      await doLogin(req)(app, locCode, body);
    } catch (err) {
      const errorMessage = isSystemAdministrator(req) 
        ? 'Failed to authenticate a system administrator as a court user'
        : 'Failed to change court as a court user';

      app.logger.crit(errorMessage, {
        data: { body, locCode },
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      return res.redirect(
        isSystemAdministrator(req) 
          ? app.namedRoutes.build('administration.get')
          : app.namedRoutes.build('homepage.get')
      );
    }

    return res.redirect(app.namedRoutes.build('homepage.get'));
  };
};

module.exports.getChangeCourt = (app) => async (req, res) => {
  const signingKey = secretsConfig.get('secrets.juror.bureau-jwtNoAuthKey');
  const expiresIn = secretsConfig.get('secrets.juror.bureau-jwtTTL');

  const authToken = jwt.sign({}, signingKey, { expiresIn });
  const body = { email: req.session.email || req.session.authentication?.email };
  let courtsList;
  let { filter } = req.query;

  if (!body) {
    req.session.errors = makeManualError('email', 'Email is required for courts list');
    
    return res.redirect(app.namedRoutes.build('login.get'));
  }

  try {
    courtsList = await fetchAuthCourtsList(authToken, body);
    
    // keep it only during this request lifetime
    req.session.authCourtsList = courtsList;
    req.session.noKeyAuthToken = authToken;

    res.locals.changeCourtAvailable = courtsList.length > 1;
    req.session.changeCourtAvailable = courtsList.length > 1;
  } catch (err) {
    app.logger.crit('Failed to get courts list', {
      data: { body },
      error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
    });

    if (err.error?.message) {
      req.session.errors = makeManualError('email', err.error?.message);
    }

    return res.redirect(app.namedRoutes.build('login.get'));
  }

  if (courtsList.length === 1) {
    return loginSingleCourt(req, res, { app, courtsList, body });
  }

  if (filter) {
    courtsList = courtsList.filter((court) =>{
      const courtName = transformCourtName(court, true).toLowerCase();

      return courtName.includes(filter.toLowerCase());
    });
  }

  delete req.session.errors;

  return res.render('authentication/change-court.njk', {
    courts: courtsList,
    filter: filter || '',
    filterUrl: app.namedRoutes.build('authentication.change-court.filter'),
    clearFilterUrl: app.namedRoutes.build('authentication.change-court.get'),
    selectedCourt: req.session.selectedCourt, // this only gets set if the user is authenticated
  });
};

module.exports.postFilterChangeCourts = function(app) {
  return async function(req, res) {
    if (req.body.courtSearch === '') {
      return res.redirect(app.namedRoutes.build('authentication.change-court.get'));
    }
    return res.redirect(app.namedRoutes.build('authentication.change-court.get') + '?filter=' + req.body.courtSearch);
  };
};

function doLogin(req) {
  return async function(app, locCode, body) {
    const jwtResponse = await axiosClient('post', `/auth/moj/jwt/${locCode}`, req.session.noKeyAuthToken, { body });

    // delete headers if they exist
    delete jwtResponse._headers;

    req.session.authKey = secretsConfig.get('secrets.juror.bureau-jwtKey');
    req.session.authToken = jwtResponse.jwt;
    req.session.hasModAccess = true; // legacy purposes

    if (req.session.authentication && req.session.authentication.activeUserType === 'ADMINISTRATOR') {
      const courtsResponse = await axiosClient('get', `/moj/administration/courts/${locCode}`, req.session.authToken);
      replaceAllObjKeys(courtsResponse, _.camelCase);

      req.session.selectedCourt = {
        name: courtsResponse.englishCourtName,
        locCode: courtsResponse.courtCode,
      };
    } else {
      if (!req.session.authCourtsList || !Array.isArray(req.session.authCourtsList)) {
        app.logger.info('No courts list in session when trying to login, fetching from API', {
          data: { body, locCode },
        });
        req.session.authCourtsList = await fetchAuthCourtsList(req.session.noKeyAuthToken, body);
      }

      req.session.selectedCourt = req.session.authCourtsList.find(court => court.locCode === locCode);
    }

    req.session.authentication = jwt.decode(req.session.authToken);

    // delete unwanted cached on successful login
    delete req.session.authCourtsList;
    delete req.session.email;
    delete req.session.noKeyAuthToken;

    app.logger.info('User logged in', {
      auth: req.session.authentication,
      data: { body, locCode },
    });

    if (isSuperUser(req)) {
      app.logger.info('Logged in as super user', {
        auth: req.session.authentication,
      });
    }
  };
};

async function loginSingleCourt(req, res, { app, courtsList, body }) {
  const locCode = courtsList[0].locCode;

  try {
    await doLogin(req)(app, locCode, body);
  } catch (err) {
    app.logger.crit('Failed to login straight through on a single court', {
      data: { body, courtsList, locCode },
      error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
    });

    return res.render('_errors/generic', { err });
  }

  if (req.session.authentication.userType === 'ADMINISTRATOR') {
    if (req.query.redirect_to && req.query.redirect_to === 'courts-and-bureau') {
      return res.redirect(app.namedRoutes.build('administration.courts-and-bureau.get'));
    }

    return res.redirect(app.namedRoutes.build('administration.get'));
  }

  return res.redirect(app.namedRoutes.build('homepage.get'));
}

function resolveCancelUrl(app, req) {
  return req.session.authentication ? app.namedRoutes.build('homepage.get') : app.namedRoutes.build('login.get');
}

async function fetchAuthCourtsList (authToken, body) {
  const courtsResponse = await axiosClient('post', '/auth/moj/courts', authToken, { body });

  delete courtsResponse._headers;

  return Object.values(replaceAllObjKeys(courtsResponse, _.camelCase));
}
