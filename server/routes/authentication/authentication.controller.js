/* eslint-disable strict */
const _ = require('lodash');
const secretsConfig = require('config');
const jwt = require('jsonwebtoken');
const { authCourtsDAO, jwtAuthDAO } = require('../../objects');
const { makeManualError } = require('../../lib/mod-utils');

module.exports.postDevEmailAuth = function(app) {
  return async function(req, res) {
    if (!req.body.email) {
      req.session.errors = makeManualError('email', 'Email is required for dev email auth');

      return res.redirect(app.namedRoutes.build('login.get'));
    }

    const loginRedirect = app.namedRoutes.build('login.get');

    const signingKey = secretsConfig.get('secrets.juror.bureau-jwtNoAuthKey');
    const expiresIn = secretsConfig.get('secrets.juror.bureau-jwtTTL');

    const authToken = jwt.sign({}, signingKey, { expiresIn });

    // this is the auth token for transporting the email payload only
    req.session.authToken = authToken;

    const payload = { email: req.body.email };
    let courtsList = [];

    try {
      const courtsResponse = await authCourtsDAO.post(req, payload);

      // delete headers if they exist
      delete courtsResponse._headers;

      courtsList = Object.values(courtsResponse);

      if (!courtsList.length) {
        req.session.errors = makeManualError('email', 'No courts found for this email');

        return res.redirect(loginRedirect);
      }

    } catch (err) {
      req.session.errors = makeManualError('email', 'Something went wrong with dev email auth');

      return res.redirect(loginRedirect);
    }

    try {
      if (courtsList.length === 1) {
        const locCode = courtsList[0].loc_code;

        await doLogin(req)(app, locCode, payload);

        const { userType } = jwt.decode(req.session.authToken);

        if (userType === 'ADMINISTRATOR') {
          return res.redirect(app.namedRoutes.build('administration.get'));
        }

        return res.redirect(app.namedRoutes.build('homepage.get'));
      }

      req.session.courtsList = courtsList;
      req.session.email = req.body.email;

      return res.redirect(app.namedRoutes.build('authentication.courts-list.get'));
    } catch (err) {
      req.session.errors = makeManualError('email', 'Something went wrong with dev email auth');

      return res.redirect(loginRedirect);
    }
  };
};

module.exports.getCourtsList = function() {
  return function(req, res) {
    const tmpErrors = _.clone(req.session.errors);

    delete req.session.errors;

    res.render('authentication/courts-list.njk', {
      courtsList: req.session.courtsList,
      email: req.session.email,
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
    const payload = { email: req.body.email };

    if (!locCode) {
      req.session.errors = makeManualError('select-court', 'Select the court you want to manage');

      return res.redirect(app.namedRoutes.build('authentication.courts-list.get'));
    }

    try {
      await doLogin(req)(app, locCode, payload);

      return res.redirect(app.namedRoutes.build('homepage.get'));
    } catch (err) {
      req.session.errors = makeManualError('select-court', 'Something went wrong when selecting a court');

      return res.redirect(app.namedRoutes.build('authentication.courts-list.get'));
    }
  };
};

function doLogin(req) {
  return async function(app, locCode, payload) {
    const jwtResponse = await jwtAuthDAO.post(req, locCode, payload);

    // delete headers if they exist
    delete jwtResponse._headers;

    req.session.authKey = secretsConfig.get('secrets.juror.bureau-jwtKey');
    req.session.authToken = jwtResponse.jwt;
  };
};
