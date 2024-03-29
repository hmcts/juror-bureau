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

  function isTeamLeader(req, res, next) {
    if (
      isBureauUser(req, res) &&
      req.session.authentication.hasOwnProperty('roles') === true &&
      req.session.authentication.roles.includes('TEAM_LEADER')
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

  function isManager(req, res, next) {
    if (
      req.session.authentication.hasOwnProperty('roles') === true &&
      req.session.authentication.roles.includes('MANAGER') ||
      req.session.authentication.roles.includes('TEAM_LEADER')
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

  function isBureauManager(req, res, next) {
    if (isBureauUser(req, res) && isManager(req, res)) {
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
    if (isCourtUser(req, res) && isManager(req, res)) {
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
      req.session.authentication.hasOwnProperty('userType') === true &&
      req.session.authentication.userType === 'ADMINISTRATOR'
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
  module.exports.isManager = isManager;
  module.exports.isBureauManager = isBureauManager;
  module.exports.isCourtManager = isCourtManager;
  module.exports.isSystemAdministrator = isSystemAdministrator;

})();
