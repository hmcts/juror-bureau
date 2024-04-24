/* eslint-disable strict */
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

        const jwtResponse = await jwtAuthDAO.post(req, locCode, payload);

        // delete headers if they exist
        delete jwtResponse._headers;

        req.session.authKey = secretsConfig.get('secrets.juror.bureau-jwtKey');
        req.session.authToken = jwtResponse.jwt;

        return res.redirect(app.namedRoutes.build('homepage.get'));
      }

      console.log(courtsList);
    } catch (err) {
      req.session.errors = makeManualError('email', 'Something went wrong with dev email auth');

      return res.redirect(loginRedirect);
    }
  };
};
