;(function() {
  'use strict';

  var errors = require('../errors');

  function isBureauUser(req, res, next) {
    if (
      !isSystemAdministrator(req, res) &&
      req.session.hasOwnProperty('authentication') === true &&
      req.session.authentication.hasOwnProperty('owner') === true &&
      req.session.authentication.owner === '400'
    ) {
      if (typeof next !== 'undefined') {
        return next();
      }

      return true;
    }


    if (typeof next !== 'undefined') {
      return errors(req, res, 403);
    }

    return false;
  };

  function isCourtUser(req, res, next) {
    if (
      !isSystemAdministrator(req, res) &&
      req.session.hasOwnProperty('authentication') === true &&
      req.session.authentication.hasOwnProperty('owner') === true &&
      req.session.authentication.owner !== '400'
    ) {
      if (typeof next !== 'undefined') {
        return next();
      }

      return true;
    }


    if (typeof next !== 'undefined') {
      return errors(req, res, 403);
    }

    return false;
  };

  // TODO: update this in the future to be used as middleware if needed
  function isTeamLeader(req) {
    return req.session.authentication.staff.rank > 0;
  };

  function isSJOUser(req, res, next) {
    if (
      isCourtUser(req, res) &&
      req.session.authentication.hasOwnProperty('userLevel') === true &&
      req.session.authentication.userLevel === '9'
    ) {
      if (typeof next !== 'undefined') {
        return next();
      }

      return true;
    }


    if (typeof next !== 'undefined') {
      return errors(req, res, 403);
    }

    return false;
  };

  function isBureauManager(req, res, next) {
    if (
      isBureauUser(req, res) &&
      req.session.authentication.hasOwnProperty('staff') === true &&
      req.session.authentication.staff.hasOwnProperty('roles') === true &&
      req.session.authentication.staff.roles.includes('MANAGER')
    ) {
      if (typeof next !== 'undefined') {
        return next();
      }

      return true;
    }

    if (typeof next !== 'undefined') {
      return errors(req, res, 403);
    }

    return false;
  }

  function isCourtManager(req, res, next) {
    if (
      isCourtUser(req, res) &&
      req.session.authentication.hasOwnProperty('staff') === true &&
      req.session.authentication.staff.hasOwnProperty('roles') === true &&
      req.session.authentication.staff.roles.includes('MANAGER')
    ) {
      if (typeof next !== 'undefined') {
        return next();
      }

      return true;
    }

    if (typeof next !== 'undefined') {
      return errors(req, res, 403);
    }

    return false;
  }

  function isSystemAdministrator(req, res, next) {
    if (
      req.session.hasOwnProperty('authentication') === true &&
      req.session.authentication.hasOwnProperty('staff') === true &&
      req.session.authentication.staff.hasOwnProperty('userType') === true &&
      req.session.authentication.staff.userType === 'ADMINISTRATOR'
    ) {
      if (typeof next !== 'undefined') {
        return next();
      }

      return true;
    }

    if (typeof next !== 'undefined') {
      return errors(req, res, 403);
    }

    return false;
  }

  module.exports.isBureauUser = isBureauUser;
  module.exports.isCourtUser = isCourtUser;
  module.exports.isSJOUser = isSJOUser;
  module.exports.isTeamLeader = isTeamLeader;
  module.exports.isBureauManager = isBureauManager;
  module.exports.isCourtManager = isCourtManager;
  module.exports.isSystemAdministrator = isSystemAdministrator;

})();
