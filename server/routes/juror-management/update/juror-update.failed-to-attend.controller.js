/* eslint-disable strict */
'use strict';

const _ = require('lodash');
const { failedToAttendObject } = require('../../../objects/juror-record');
const { isSJOUser } = require('../../../components/auth/user-type');

// TODO: we need to revisit this when the attendances are implemented as the juror cannot be marked
// as failed to attend if they have attendances to their name

module.exports.getFailedToAttend = function() {
  return function(req, res) {
    const { jurorNumber } = req.params;
    const tmpErrors = _.clone(req.session.errors);
    const jurorName = resolveJurorName(req.session.jurorCommonDetails);

    delete req.session.errors;

    return res.render('juror-management/attendance/failed-to-attend', {
      jurorNumber,
      jurorName,
      errors: {
        title: 'Please check the form',
        count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
        items: tmpErrors,
      },
    });
  };
};

module.exports.postFailedToAttend = function(app) {
  return async function(req, res) {
    const { jurorNumber } = req.params;
    const { poolNumber } = req.session.jurorCommonDetails;

    // Start by clearing any failedToAttend state
    delete req.session.failedToAttend;

    if (typeof req.body['failed-to-attend'] === 'undefined') {
      return hasFormErrors(app, req, res, 'failed-to-attend');
    }

    try {
      await failedToAttendObject.patch(
        require('request-promise'),
        app,
        req.session.authToken,
        jurorNumber,
        poolNumber,
      );

      req.session.failedToAttend = {
        jurorNumber,
        status: 'failed-to-attend',
      };
    } catch (err) {
      return jurorStatusUpdateFailed(app, req, res, err, 'failed-to-attend');
    }

    return res.redirect(app.namedRoutes.build('juror-record.attendance.get', {
      jurorNumber,
    }));
  };
};

module.exports.getUndoFailedToAttend = function() {
  return function(req, res) {
    const { jurorNumber } = req.params;
    const jurorName = resolveJurorName(req.session.jurorCommonDetails);
    const tmpErrors = _.clone(req.session.errors);

    delete req.session.errors;

    return res.render('juror-management/attendance/undo-failed-to-attend', {
      jurorNumber,
      jurorName,
      errors: {
        title: 'Please check the form',
        count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
        items: tmpErrors,
      },
    });
  };
};

module.exports.postUndoFailedToAttend = function(app) {
  return async function(req, res) {
    const { jurorNumber } = req.params;
    const { poolNumber } = req.session.jurorCommonDetails;

    if (typeof req.body['failed-to-attend'] === 'undefined') {
      return hasFormErrors(app, req, res, 'undo-failed-to-attend');
    }

    try {
      await failedToAttendObject.patch(
        require('request-promise'),
        app,
        req.session.authToken,
        jurorNumber,
        poolNumber,
        'undo'
      );

      req.session.failedToAttend = {
        jurorNumber,
        status: 'undo-failed-to-attend',
      };

      return res.redirect(app.namedRoutes.build('juror-record.attendance.get', {
        jurorNumber,
      }));
    } catch (err) {
      return jurorStatusUpdateFailed(app, req, res, err, 'undo-failed-to-attend');
    }
  };
};

function resolveJurorName(jurorDetails) {
  return [jurorDetails.title, jurorDetails.firstName, jurorDetails.lastName].join(' ');
}

function redirectTo(req, res) {
  return function(action) {
    return isSJOUser(req, res) && action === 'undo-failed-to-attend'
      ? 'juror.update.failed-to-attend.undo.get'
      : 'juror.update.failed-to-attend.get';
  };
}

function hasFormErrors(app, req, res, action) {
  const { jurorNumber } = req.params;
  const { jurorStatus } = req.session.jurorCommonDetails;
  const errorMessages = {
    Responded: 'You must tick the box if you want to change this juror’s status to  ‘Failed to attend’',
    'Failed attend': 'You must tick the box if you want to revert this juror’s status to ‘Responded’',
  };

  req.session.errors = {
    'failed-to-attend': [{
      details: errorMessages[jurorStatus],
    }],
  };

  return res.redirect(app.namedRoutes.build(redirectTo(req, res)(action), {
    jurorNumber,
  }));
}

function jurorStatusUpdateFailed(app, req, res, err, action) {
  const { jurorNumber } = req.params;
  const status = {
    'failed-to-attend': 'Failed to attend',
    'undo-failed-to-attend': 'Responded',
  };

  req.session.errors = {
    'failed-to-attend': [{
      details: `Unable to change this juror’s status to ‘${status[action]}’`,
    }],
  };

  app.logger.crit(`Failed to change the juror status to ‘${status[action]}’: `, {
    auth: req.session.authentication,
    jwt: req.session.authToken,
    data: { jurorNumber },
    error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
  });

  return res.redirect(app.namedRoutes.build(redirectTo(req, res)(action), {
    jurorNumber,
  }));
}
