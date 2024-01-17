(function() {
  'use strict';

  var _ = require('lodash')
    , validate = require('validate.js')
    , postponeObj = require('../../../objects/postpone')
    , availablePoolsObj = require('../../../objects/pool-management').deferralMaintenance.availablePools
    , postponeValidator = require('../../../config/validation/postpone')
    , moment = require('moment');

  module.exports.getPostponeDate = function(app) {
    return function(req, res) {
      var tmpErrors = _.clone(req.session.errors);

      delete req.session.formFields;
      delete req.session.errors;

      const originalDate = new Date(req.session.jurorCommonDetails.startDate);

      originalDate.setDate(originalDate.getDate() + 1);

      return res.render('juror-management/postpone/select-date.njk', {
        jurorNumber: req.params['jurorNumber'],
        originalDate: originalDate,
        postponeToDate: req.session.postponeToDate,
        backLinkUrl : {
          built: true,
          url: app.namedRoutes.build('juror.update.get', {
            jurorNumber: req.params['jurorNumber'],
          }),
        },
        errors: {
          message: '',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postPostponeDate = function(app) {
    return function(req, res) {
      var validatorResult
        , originalDate = new Date(req.session.jurorCommonDetails.startDate);

      validatorResult = validate(req.body, postponeValidator.postponeDate(originalDate));
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('juror.update.postpone-date.get', {
          jurorNumber: req.params.jurorNumber,
        }));
      }

      req.session.postponeToDate = req.body.postponeTo;

      return res.redirect(app.namedRoutes.build('juror.update.available-pools.get', {
        jurorNumber: req.params.jurorNumber,
      }));
    };
  };

  module.exports.getAvailablePools = function(app) {
    return function(req, res) {
      var tmpErrors = _.clone(req.session.errors)
        , successCB = function(poolOptions) {
          app.logger.info('Fetch pool options:  ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: poolOptions,
          });

          delete req.session.errors;
          delete req.session.formFields;

          const backLinkUrl = {
              built: true,
              url: app.namedRoutes.build('juror.update.postpone-date.get', {
                jurorNumber: req.params['jurorNumber'],
              }),
            },
            processUrl = app.namedRoutes.build('juror.update.available-pools.post', {
              jurorNumber: req.params['jurorNumber'],
            }),
            cancelUrl = app.namedRoutes.build('juror-record.overview.get', {
              jurorNumber: req.params['jurorNumber'],
            });

          // eslint-disable-next-line one-var
          const filteredPools = {
            ...poolOptions.deferralPoolsSummary[0],
            deferralOptions: poolOptions.deferralPoolsSummary[0].deferralOptions.filter(pool => {
              return moment(pool.serviceStartDate).isAfter(moment(req.session.jurorCommonDetails.startDate.join('-')));
            }),
          };

          if (!filteredPools.deferralOptions.length) {
            return res.render('juror-management/postpone/no-pools.njk', {
              processUrl,
              cancelUrl,
              selectedDeferralDate: req.session.postponeToDate.split('/').reverse().join('-'),
            });
          }

          return res.render('juror-management/postpone/pools.njk', {
            jurorNumber: req.params['jurorNumber'],
            backLinkUrl,
            processUrl,
            cancelUrl,
            deferralPoolsSummary: filteredPools,
            errors: {
              title: 'Please check the form',
              count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
              items: tmpErrors,
            },
          });
        }
        , errorCB = function(err) {

          app.logger.crit('Failed to fetch pool options: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('_errors/generic');
        };

      availablePoolsObj.post(
        require('request-promise'),
        app,
        req.session.authToken,
        req.params['jurorNumber'],
        [req.session.postponeToDate.split('/').reverse().join('-')]
      )
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.postAvailablePools = function(app) {
    return function(req, res) {
      var validatorResult
        , payload

        , successCB = function() {
          app.logger.info('Juror succesfully transferred: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params.jurorNumber,
              ...payload,
            },
          });

          req.session.bannerMessage = 'Postponed';

          return res.redirect(app.namedRoutes.build('juror-record.overview.get', {
            jurorNumber: req.params.jurorNumber,
          }));
        }

        , errorCB = function(err) {
          app.logger.crit('Failed to transfer juror: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params.jurorNumber,
              ...payload,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('_errors/generic');
        };

      if (typeof req.body.sendToDeferralMaintence === 'undefined') {
        validatorResult = validate(req.body, postponeValidator.postponePool());
        if (typeof validatorResult !== 'undefined') {
          req.session.errors = validatorResult;
          req.session.formFields = req.body;

          return res.redirect(app.namedRoutes.build('juror.update.available-pools.get', {
            jurorNumber: req.params.jurorNumber,
          }));
        }
      }

      payload = buildPayload(req.body);

      postponeObj.post(
        require('request-promise'),
        app,
        req.session.authToken,
        req.params.jurorNumber,
        payload)
        .then(successCB)
        .catch(errorCB);
    };
  };

  function buildPayload(body) {
    const payload = _.clone(body);

    payload.excusalReasonCode = 'P';
    payload.replyMethod = 'DIGITAL'; // TODO: verify if this has any effect in the outcome of postponing?

    if (payload.deferralDateAndPool) {
      const [dd, pn] = payload.deferralDateAndPool.split('_');

      payload.deferralDate = dd;
      payload.poolNumber = pn;
    }

    delete payload._csrf;
    delete payload.deferralPoolSelect;

    return payload;
  }

})();
