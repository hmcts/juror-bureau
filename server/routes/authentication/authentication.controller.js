/* eslint-disable strict */
const _ = require('lodash');
const secretsConfig = require('config');
const jwt = require('jsonwebtoken');
const { axiosClient } = require('../../objects/axios-instance');
const { makeManualError } = require('../../lib/mod-utils');

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
    const body = { email: req.session.email || req.session.authentication.email };
    let courtsList;

    try {
      const courtsResponse = await axiosClient('post', '/auth/moj/courts', authToken, { body });

      // delete headers if they exist
      delete courtsResponse._headers;

      courtsList = Object.values(courtsResponse);

      // keep it only during this request lifetime
      req.session.courtsList = courtsList;
      req.session.noKeyAuthToken = authToken;

      if (courtsList.length === 1) {
        await doLogin(req)(app, courtsList[0].loc_code, body);

        if (req.session.authentication.userType === 'ADMINISTRATOR') {
          return res.redirect(app.namedRoutes.build('administration.get'));
        }

        return res.redirect(app.namedRoutes.build('homepage.get'));
      }

    } catch (err) {
      app.logger.crit('Failed to get courts list', {
        data: { body },
        error: err,
      });

      return res.render('_errors/generic.njk');
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
        error: err,
      });

      // return res.redirect(app.namedRoutes.build('authentication.courts-list.get'));
      return res.render('_errors/generic.njk');
    }
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

    // there will always be a court selected here
    req.session.selectedCourt = req.session.courtsList.find(court => court.loc_code === locCode);
    req.session.authentication = jwt.decode(req.session.authToken);

    // delete unwanted cached on successful login
    delete req.session.courtsList;
    delete req.session.email;
    delete req.session.noKeyAuthToken;

    app.logger.info('User logged in', {
      auth: req.session.authentication,
      data: { body, locCode },
    });
  };
};

function resolveCancelUrl(app, req) {
  return req.session.authentication ? app.namedRoutes.build('homepage.get') : app.namedRoutes.build('login.get');
}
