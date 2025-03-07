(function() {
  'use strict';

  const _ = require('lodash'),
    validate = require('validate.js'),
    processApprovalValidator = require('../../../config/validation/approve-create-juror'),
    { fetchPoolsAtCourt } = require('../../../objects/request-pool'),
    jurorsForApproval  = require('../../../objects/approve-jurors').jurorList,
    processPendingJuror = require('../../../objects/approve-jurors').processPendingJuror;

  module.exports.getInWaiting = function(app) {
    return async function(req, res) {

      let bannerMessage;

      if (typeof req.session.bannerMessage !== 'undefined') {
        bannerMessage = req.session.bannerMessage;
      }

      delete req.session.bannerMessage;
      delete req.session.newJuror;
      delete req.session.poolCreateFormFields;
      delete req.session.dismissJurors;
      delete req.session.courtChange;

      try {
        const pools = await fetchPoolsAtCourt.get(
          req,
          req.session.authentication.locCode,
        );

        app.logger.info('Fetched pools at court location: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: pools,
        });

        try {
          const forApproval = await jurorsForApproval.get(
            req,
            req.session.authentication.locCode,
            'QUEUED'
          );

          app.logger.info('Fetched jurors pending approval: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: forApproval,
          });

          return res.render('juror-management/manage-jurors.njk', {
            nav: 'jurors',
            pendingApprovalCount: forApproval.pending_jurors_response_data.length,
            currentTab: 'pools',
            bannerMessage,
            pools: pools.pools_at_court_location,
          });

        } catch (error) {
          app.logger.crit('Unable to fetch pending juror list', {
            auth: req.session.authentication,
            token: req.session.authToken,
            data: {
              locationCode: req.session.authentication.locCode,
              status: 'QUEUED',
            },
            error: typeof error.error !== 'undefined' ? error.error : error.toString(),
          });
          return res.render('_errors/generic', { err: error });
        }

      } catch (err) {
        app.logger.crit('Failed to fetch pools at court location: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            locationCode: req.session.authentication.locCode,
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic', { err });
      }

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
        req,
        req.session.authentication.locCode,
        'QUEUED'
      )
        .then((data) => {
          const jurors = data.pending_jurors_response_data;

          return res.render('juror-management/manage-jurors.njk', {
            nav: 'jurors',
            pendingApprovalCount: jurors.length,
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
              locationCode: req.session.authentication.locCode,
              status: 'QUEUED',
            },
            error: typeof err.error !== 'undefined' ? err.error : err.toString(),
          });
          return res.render('_errors/generic', { err });
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
        req,
        req.session.authentication.locCode,
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
              locationCode: req.session.authentication.locCode,
              status: status === 'pending' ? 'QUEUED' : '',
            },
            error: typeof err.error !== 'undefined' ? err.error : err.toString(),
          });
          return res.render('_errors/generic', { err });
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
        req,
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
          return res.render('_errors/generic', { err });
        });
    };
  };

})();
