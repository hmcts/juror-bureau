;(function() {
  'use strict';

  const _ = require('lodash')
  const fetchCourtDeferrals = require('../../../objects/request-pool').fetchCourtDeferrals
  const dateFilter = require('../../../components/filters').dateFilter
  const validate = require('validate.js')
  const nilPoolConvertObj = require('../../../objects/nil-pool').nilPoolConvert;
  const { poolSummaryObject } = require('../../../objects/pool-summary');

  module.exports.index = function(app) {
    return async function(req, res) {
      var selectedPool
        , selectedCourt
        , transformedDate

        , successCB = function(data) {
          var tmpErrors;

          tmpErrors = _.clone(req.session.errors);
          delete req.session.errors;
          delete req.session.formFields;

          // we save some referrence for the available deferrals just in case
          // the user decides to change this value
          req.session.poolDetails.courtDeferralsAvailable = data;

          app.logger.info('Fetched the number of court deferrals when converting a nil pool: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              locationCode: req.session.poolDetails.courtCode,
              attendanceDate: req.session.poolDetails.attendanceDate,
              numberOfCourtDeferrals: data,
            },
          });

          res.render('pool-management/convert-nil-pool/form', {
            poolDetails: req.session.poolDetails,
            courtDeferrals: (typeof req.session.poolDetails.numberOfCourtDeferrals === 'undefined')
              ? data : req.session.poolDetails.numberOfCourtDeferrals,
            numberOfJurorsRequired: req.session.poolDetails.numberOfJurorsRequired,
            errors: {
              title: 'Please check the form',
              count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
              items: tmpErrors,
            }
          });
        }
        , errorCB = function(err) {

          app.logger.crit('Failed to fetch the number of court deferrals when converting a nil pool: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              locationCode: req.session.poolDetails.courtCode,
              attendanceDate: req.session.poolDetails.attendanceDate,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.redirect(app.namedRoutes.build('pool-overview.get', {
            poolNumber: req.params['poolNumber'],
          }));
        };

      if (!req.session.hasOwnProperty('poolDetails') || req.params['poolNumber'] !== req.session.poolDetails.poolDetails.poolNumber) {
        try {
          req.session.poolDetails = await poolSummaryObject.get(req, req.params['poolNumber']);
        } catch (err) {
          app.logger.crit('Failed to fetch the pool details when converting a nil pool: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              poolNumber: req.params.poolNumber,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });       
        }
      }

      if (!req.session.hasOwnProperty('poolDetails') ||
        !req.session.poolDetails.poolDetails.hasOwnProperty('is_nil_pool') ||
        !req.session.poolDetails.poolDetails.is_nil_pool) {
        app.logger.crit('Failed to convert pool to active pool as the pool is not a nil pool: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            poolNumber: req.params.poolNumber,
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });  
        req.session.deletePoolError = {
          message: 'Unable to convert nil pool to active pool',
          type: 'pool-delete-error',
        };
        return res.redirect(app.namedRoutes.build('pool-overview.get', {
          poolNumber: req.params['poolNumber'],
        }));
      }

      selectedPool = _.clone(req.session.poolDetails.poolDetails);
      if (typeof req.session.poolDetails.locCode === 'undefined'
        || typeof selectedCourt === 'undefined') {
        selectedCourt = req.session.courtsList.find(function(court) {
          return court.locationCode === selectedPool.locCode;
        });
      }

      transformedDate = dateFilter(new Date(selectedPool.courtStartDate), null, 'YYYY-MM-DD');
      req.session.poolDetails.attendanceDate = transformedDate;
      req.session.poolDetails.attendanceTime = selectedCourt.attendanceTime;
      req.session.poolDetails.poolNumber = selectedPool.poolNumber;
      req.session.poolDetails.courtCode = selectedCourt.locationCode;
      req.session.poolDetails.courtName = selectedCourt.locationName;

      return fetchCourtDeferrals.get(
        require('request-promise'),
        app,
        req.session.authToken,
        selectedCourt.locationCode,
        transformedDate
      )
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.post = function(app) {
    return function(req, res) {
      var validatorResult
        , tmpPoolDetails;

      tmpPoolDetails = _.clone(req.body);
      req.session.poolDetails.poolType = tmpPoolDetails.poolType;
      req.session.poolDetails.additionalRequirements = tmpPoolDetails.additionalRequirements;
      req.session.poolDetails.numberOfJurorsRequired = tmpPoolDetails.numberOfJurorsRequired;
      req.session.poolDetails.numberOfCourtDeferrals = tmpPoolDetails.numberOfCourtDeferrals;

      validatorResult = validate(req.body, require('../../../config/validation/request-pool').poolDetails(req));
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('nil-pool.convert.form.get', {
          poolNumber: req.params['poolNumber']
        }));
      }

      delete req.session.errors;
      delete req.session.formFields;

      return res.redirect(app.namedRoutes.build('nil-pool.convert.check-details.get', {
        poolNumber: req.params['poolNumber'],
      }));
    };
  };

  module.exports.getChangeCourtDeferrals = function(app) {
    return function(req, res) {
      var tmpErrors;

      tmpErrors = _.clone(req.session.errors);
      delete req.session.errors;
      delete req.session.formFields;

      return res.render('pool-management/_common/change-deferrals', {
        courtDeferrals: req.session.poolDetails.courtDeferralsAvailable,
        submitUrl: app.namedRoutes.build('nil-pool.convert.change-deferrals.post', {
          poolNumber: req.params['poolNumber'],
        }),
        cancelUrl: app.namedRoutes.build('nil-pool.convert.form.get', {
          poolNumber: req.params['poolNumber'],
        }),
        inputId: 'numberOfCourtDeferrals',
        pageTitle: 'Number of court deferrals to include in this pool',
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        }
      });
    };
  };

  module.exports.postChangeCourtDeferrals = function(app) {
    return function(req, res) {
      var validatorResult;

      validatorResult = validate(req.body, require('../../../config/validation/request-pool')
        .numberOfDeferrals(req));
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('nil-pool.convert.change-deferrals.get', {
          poolNumber: req.params['poolNumber'],
        }));
      }

      req.session.poolDetails.numberOfCourtDeferrals = req.body.numberOfCourtDeferrals;

      return res.redirect(app.namedRoutes.build('nil-pool.convert.form.get', {
        poolNumber: req.params['poolNumber'],
      }));
    };
  };

  module.exports.getCheckDetails = function(app) {
    return function(req, res) {

      res.render('pool-management/_common/check-request-details', {
        poolDetails: req.session.poolDetails,
        submitUrl: app.namedRoutes.build('nil-pool.convert.check-details.post', {
          poolNumber: req.params['poolNumber'],
        }),
        cancelUrl: app.namedRoutes.build('pool-overview.get', {
          poolNumber: req.params['poolNumber'],
        }),
        changeUrl: app.namedRoutes.build('nil-pool.convert.form.get', {
          poolNumber: req.params['poolNumber'],
        }),
        pageIdentifier: 'Convert a Nil Pool to an Active Pool',
        pageTitle: 'Check pool conversion details',
        buttonLabel: 'Convert pool',
      });
    };
  };

  module.exports.postCheckDetails = function(app) {
    return function(req, res) {
      var tmpBody = _.clone(req.body)
        , successCB = function() {

          app.logger.info('Converted a nil pool to an active pool: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              poolNumber: req.session.poolDetails.poolNumber,
            },
          });

          // delete the canConvert tag after conversion is successful
          delete req.session.poolDetails.canConvert;

          return res.redirect(app.namedRoutes.build('pool-overview.get', {
            poolNumber: req.params['poolNumber'],
          }));
        }
        , errorCB = function(err) {

          app.logger.crit('Failed to convert nil pool to active pool: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              poolNumber: req.session.poolDetails.poolNumber,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.redirect(app.namedRoutes.build('pool-management.get'));
        };

      tmpBody.attendanceTime = req.session.attendanceTime;
      nilPoolConvertObj.put(require('request-promise'), app, req.session.authToken, tmpBody)
        .then(successCB)
        .catch(errorCB);
    }
  }

})();