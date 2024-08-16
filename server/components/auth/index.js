/* eslint-disable strict */
const jwt = require('jsonwebtoken');
const errors = require('../errors');
const {
  isBureauUser,
  isCourtUser,
  isSJOUser,
  isBureauManager,
  isCourtManager,
  isSystemAdministrator,
  isManager,
  isTeamLeader,
} = require('./user-type');

module.exports.logout = function(req, res) {
  delete req.session.authToken;
  delete req.session.authKey;
  delete req.session.authentication;
  delete res.locals.authentication;
};

module.exports.verify = function(req, res, next) {
  // check header or url parameters or post parameters for token
  const token = req.session.authToken;

  // decode token
  if (token) {
    // verifies secret and checks expiry
    jwt.verify(token, req.session.authKey, function(err, decoded) {
      if (err) {
        return errors(req, res, 403, '/');
      }

      // if no errors, then decode and verify the token body
      req.decoded = decoded;

      // if we do not have a userLevel property then we should assume this
      // token is not for a logged in user.
      if (!decoded.hasOwnProperty('email')) {
        return errors(req, res, 403, '/');
      }

      // If all is well then we check for a data tag in the response
      // and strip it out.
      if (decoded.hasOwnProperty('data')) {
        req.session.authentication = decoded.data;
      } else {
        req.session.authentication = decoded;
      }

      req.session.authentication.multipleTabs = req.session.multipleTabs || false;
      // Send login status to templates
      res.locals.authentication = req.session.authentication;
      res.locals.isSJO = isSJOUser(req, res);
      res.locals.isCourtUser = isCourtUser(req, res);
      res.locals.isBureauUser = isBureauUser(req, res);
      res.locals.isManager = isManager(req, res);
      res.locals.isBureauManager = isBureauManager(req, res);
      res.locals.isCourtManager = isCourtManager(req, res);
      res.locals.isSystemAdministrator = isSystemAdministrator(req, res);
      res.locals.isTeamLeader = isTeamLeader(req, res);
      res.locals.selectedCourt = req.session.selectedCourt;

      return next();
    });

  } else {
    // Without a authentication token, we show an error page
    return errors(req, res, 403, '/');
  }
};

module.exports.isSupervisor = function(req, res, next) {
  if (
    Object.prototype.hasOwnProperty.call(req.session, 'authentication') === false ||
    Object.prototype.hasOwnProperty.call(req.session.authentication, 'staff') === false ||
    Object.prototype.hasOwnProperty.call(req.session.authentication.staff, 'rank') === false ||
    req.session.authentication.staff.rank === 0
  ) {
    // If not a supervisor, then redirect back to homepage with forbidden http code
    return errors(req, res, 403, '/inbox');
  }

  return next();
};

module.exports.isSJO = function(req, res, next) {
  if (!isSJOUser(req, res)) {
    return errors(req, res, 403, '/inbox');
  }

  return next();
};
