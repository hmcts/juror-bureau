(function() {
  'use strict';

  const _ = require('lodash'),
    validate = require('validate.js'),
    processApprovalValidator = require('../../../config/validation/approve-create-juror'),
    jurorsForApproval  = require('../../../objects/approve-jurors').jurorList,
    processPendingJuror = require('../../../objects/approve-jurors').processPendingJuror;

  module.exports.getInWaiting = function(app) {
    return function(req, res) {

      let bannerMessage;

      if (typeof req.session.bannerMessage !== 'undefined') {
        bannerMessage = req.session.bannerMessage;
      }

      delete req.session.bannerMessage;
      delete req.session.newJuror;
      delete req.session.poolCreateFormFields;
      delete req.session.dismissJurors;

      return res.render('juror-management/manage-jurors.njk', {
        nav: 'jurors',
        jurorApprovalCount: req.session.jurorApprovalCount,
        currentTab: 'in-waiting',
        bannerMessage,
        jurors:[
          {
            jurorNumber: '645200045',
            firstName: 'Iqbal',
            lastName: 'Hussain',
            poolNumber: '415220904',
            status: 'responded',
          },
        ],
      });
    };
  };

  module.exports.getOnTrials = function(app) {
    return function(req, res) {

      delete req.session.bannerMessage;
      delete req.session.newJuror;

      return res.render('juror-management/manage-jurors.njk', {
        nav: 'jurors',
        jurorApprovalCount: req.session.jurorApprovalCount,
        currentTab: 'on-trials',
      });
    };
  };

  module.exports.getOnCall = function(app) {
    return function(req, res) {

      delete req.session.bannerMessage;
      delete req.session.newJuror;

      return res.render('juror-management/manage-jurors.njk', {
        nav: 'jurors',
        jurorApprovalCount: req.session.jurorApprovalCount,
        currentTab: 'on-call',
      });
    };
  };

  module.exports.getPendingApproval = function(app) {
    return function(req, res) {
      let bannerMessage;

      if (typeof req.session.bannerMessage !== 'undefined') {
        bannerMessage = req.session.bannerMessage;
      }

      delete req.session.bannerMessage;
      delete req.session.newJuror;
      delete req.session.poolCreateFormFields;

      jurorsForApproval.get(
        require('request-promise'),
        app,
        req.session.authToken,
        req.session.authentication.owner,
        'QUEUED'
      )
        .then((data) => {
          const jurors = data.pending_jurors_response_data;

          return res.render('juror-management/manage-jurors.njk', {
            nav: 'jurors',
            jurorApprovalCount: req.session.jurorApprovalCount,
            currentTab: 'pending-approval',
            bannerMessage,
            jurors,
          });
        })
        .catch((err) => {
          app.logger.crit('Unable to fetch pending juror list', {
            auth: req.session.authentication,
            token: req.session.authToken,
            data: {
              locationCode: req.session.authentication.owner,
              status: 'QUEUED',
            },
            error: typeof err.error !== 'undefined' ? err.error : err.toString(),
          });
          return res.render('_errors/generic.njk');
        });
    };
  };

  module.exports.getApprove = function(app) {
    return function(req, res) {
      let bannerMessage;
      const status = req.query.status || 'pending';

      if (typeof req.session.bannerMessage !== 'undefined') {
        bannerMessage = req.session.bannerMessage;
      }

      delete req.session.bannerMessage;
      delete req.session.approveReject;

      jurorsForApproval.get(
        require('request-promise'),
        app,
        req.session.authToken,
        req.session.authentication.owner,
        status === 'pending' ? 'QUEUED' : ''
      )
        .then((data) => {
          const jurors = data.pending_jurors_response_data;

          req.session.jurorApprovalCount = jurors.filter(
            (juror) => juror.pending_juror_status.description === 'Queued'
          ).length;

          return res.render('juror-management/manage-jurors/approve-jurors.njk', {
            nav: 'approve',
            jurorApprovalCount: req.session.jurorApprovalCount,
            bannerMessage,
            status,
            jurors,
            pendingLink: '/juror-management/manage-jurors/approve/',
          });
        })
        .catch((err) => {
          app.logger.crit('Unable to fetch pending juror list', {
            auth: req.session.authentication,
            token: req.session.authToken,
            data: {
              locationCode: req.session.authentication.owner,
              status: status === 'pending' ? 'QUEUED' : '',
            },
            error: typeof err.error !== 'undefined' ? err.error : err.toString(),
          });
          return res.render('_errors/generic.njk');
        });
    };
  };

  module.exports.getApproveReject = function(app) {
    return function(req, res) {
      let tmpErrors;

      if (req.session.errors) {
        tmpErrors = req.session.errors;
      }

      delete req.session.errors;

      return res.render('juror-management/manage-jurors/approve-or-reject.njk', {
        submitUrl: app.namedRoutes.build('juror-management.manage-jurors.approve.juror.post', {
          jurorNumber: req.params.jurorNumber,
        }),
        cancelUrl: app.namedRoutes.build('juror-management.manage-jurors.approve.get', {
          jurorNumber: req.params.jurorNumber,
        }),
        pendingLink: '/juror-management/manage-jurors/approve/',
        formFields: req.session.approveReject,
        errors: {
          message: '',
          count:
            typeof tmpErrors !== 'undefined'
              ? Object.keys(tmpErrors).length
              : 0,
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postApproveReject = function(app) {
    return function(req, res) {
      const validatorResult = validate(req.body, processApprovalValidator());

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.approveReject = req.body.approveReject;

        return res.redirect(app.namedRoutes.build('juror-management.manage-jurors.approve.juror.get', {
          jurorNumber: req.params['jurorNumber'],
        }));
      }

      processPendingJuror.post(
        require('request-promise'),
        app,
        req.session.authToken,
        req.params.jurorNumber,
        req.body.approveReject,
        req.body.approveReject === 'REJECT' ? req.body.rejectComments : ''
      )
        .then(() => {
          req.session.bannerMessage = `Pending juror ${req.body.approveReject === 'APPROVE' ? 'approved' : 'rejected'}`;

          return res.redirect(app.namedRoutes.build('juror-management.manage-jurors.approve.get', {
            jurorNumber: req.params.jurorNumber,
          }));
        })
        .catch((err) => {
          app.logger.crit('Unable to process pending juror', {
            auth: req.session.authentication,
            token: req.session.authToken,
            data: {
              jurorNumber: req.params.jurorNumber,
              decision: req.body.approveReject,
              comments: req.body.rejectComments,
            },
            error: typeof err.error !== 'undefined' ? err.error : err.toString(),
          });
          return res.render('_errors/generic.njk');
        });
    };
  };

})();
