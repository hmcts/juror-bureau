;(function() {
  'use strict';

  var errors = require('../errors');

  function isBureauUser(req, res, next) {
    if (
      req.session.hasOwnProperty('authentication') === true &&
      req.session.authentication.hasOwnProperty('userType') === true &&
      req.session.authentication.activeUserType === 'BUREAU'
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
      req.session.hasOwnProperty('authentication') === true &&
      req.session.authentication.hasOwnProperty('userType') === true &&
      req.session.authentication.activeUserType === 'COURT'
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
    return req.session.authentication.staff.rank > 0 || isManager(req);
  };


  // TODO: revise this
  function isSJOUser(req, res, next) {
    if (
      isCourtUser(req, res) &&
      (
        req.session.authentication.hasOwnProperty('roles') === true &&
        req.session.authentication.roles.includes('SENIOR_JUROR_OFFICER')
      )
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
      req.session.authentication.roles.includes('MANAGER')
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
      req.session.authentication.hasOwnProperty('activeUserType') === true &&
      req.session.authentication.activeUserType === 'ADMINISTRATOR'
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

  function canCreateBureauJuror(req, res, next) {
    if (
      isBureauManager(req, res) &&
      req.session.authentication.hasOwnProperty('permissions') === true &&
      req.session.authentication.permissions.includes('CREATE_JUROR')
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

  function isSuperUser(req, res, next) {
    if (
      req.session.hasOwnProperty('authentication') === true &&
      req.session.authentication.hasOwnProperty('permissions') === true &&
      req.session.authentication.permissions.includes('SUPER_USER')
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
  module.exports.canCreateBureauJuror = canCreateBureauJuror;
  module.exports.isSuperUser = isSuperUser;

})();
