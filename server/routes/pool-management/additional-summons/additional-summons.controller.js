(function() {
  'use strict';

  var _ = require('lodash')
    , modUtils = require('../../../lib/mod-utils')
    , validate = require('validate.js')
    , dateFilter = require('../../../components/filters').dateFilter
    , additionalSummonsValidator = require('../../../config/validation/additional-summons')
    , poolSummaryObj = require('../../../objects/pool-summary').poolSummaryObject
    , postCodesObj = require('../../../objects/postcodes').postCodesObject
    , bureauDeferralsObj = require('../../../objects/bureau-deferrals').bureauDeferralsObject

  const { summonCitizensDAO } = require('../../../objects');

  module.exports.index = function(app) {
    return function(req, res) {
      var promiseArr = []
        , catchmentArea
        , successCB = function(response) {
          var transformedPostCodes
            , tmpErrors;

          if (typeof response[1] !== 'undefined' && response[1].hasOwnProperty('CourtCatchmentItems')) {
            transformedPostCodes = modUtils.transformPostcodes(response[1].CourtCatchmentItems);
          }

          tmpErrors = _.clone(req.session.errors);
          delete req.session.errors;
          delete req.session.formFields;

          req.session.poolDetails = response[0];
          req.session.poolDetails.courtYeld =
            (typeof transformedPostCodes !== 'undefined') ? transformedPostCodes[1] : 0;

          // pass in the tmpSelectedBureauSupply into the pool details
          req.session.poolDetails.additionalStatistics.selectedBureauSupply = req.session.tmpSelectedBureauSupply;

          app.logger.info('Fetched the pool summary and postcodes: ', {
            auth: req.session.authentication,
            data: {
              poolNumber: req.params['poolNumber'],
              locationCode: req.params['poolNumber'].slice(0, 3),
            },
          });

          bureauDeferralsObj.get(
            req,
            catchmentArea,
            dateFilter(new Date(response[0].poolDetails.courtStartDate), null, 'YYYY-MM-DD')
          )
            .then(function(noOfBureauDeferrals) {

              app.logger.info('Fetched the number of bureau deferrals: ', {
                auth: req.session.authentication,
                data: {
                  poolNumber: response[0].poolDetails.locCode,
                },
              });

              // save the number of bureau deferrals
              req.session.poolDetails.additionalStatistics.bureauSupply = noOfBureauDeferrals;

              return res.render('pool-management/additional-summons/index', {
                poolDetails: response[0],
                catchmentArea: catchmentArea,
                postCodes:
                  (typeof transformedPostCodes !== 'undefined') ? transformedPostCodes[0] : [],
                bureauDeferrals:
                  (typeof req.session.poolDetails.additionalStatistics.selectedBureauSupply === 'undefined')
                    ? req.session.poolDetails.additionalStatistics.bureauSupply
                    : req.session.poolDetails.additionalStatistics.selectedBureauSupply,
                submitUrl: app.namedRoutes.build('pool.additional-summons.post', {
                  poolNumber: req.params['poolNumber'],
                }),
                changeCatchmentAreaUrl: app.namedRoutes.build('pool.additional-summons.change-catchment-area.get', {
                  poolNumber: req.params['poolNumber'],
                }),
                changeDeferralsUrl: app.namedRoutes.build('pool.additional-summons.change-deferrals.get', {
                  poolNumber: req.params['poolNumber'],
                }),
                errors: {
                  title: 'Please check the form',
                  count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
                  items: tmpErrors,
                },
              });
            })
            /* eslint-disable no-use-before-define */
            .catch(errorCB);
        }
        , errorCB = function(err) {

          app.logger.crit('Failed to fetch pool summary, postcodes or number of bureau deferrals: ', {
            auth: req.session.authentication,
            data: {
              poolNumber: req.params['poolNumber'],
              locationCode: req.params['poolNumber'].slice(0, 3),
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          // for the moment I want to keep track of this... very unlikely that this will be ever triggered
          req.session.additionalSummonsError = {
            message: 'Something went wrong: ' + err.error.message,
          };

          return res.redirect(app.namedRoutes.build('pool-overview.get', {
            poolNumber: req.params['poolNumber'],
          }));
        };

      if (typeof req.session.newCourtCatchmentArea !== 'undefined') {
        catchmentArea = req.session.newCourtCatchmentArea.locationCode;
      } else {
        catchmentArea = req.params['poolNumber'].slice(0, 3);
      }

      promiseArr.push(poolSummaryObj.get(req, req.params['poolNumber']));
      promiseArr.push(
        postCodesObj.get(
          req,
          catchmentArea
        )
      );

      Promise.all(promiseArr)
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.post = function(app) {
    return function(req, res) {
      var validatorResult
        , successCB = function() {

          app.logger.info('Successfully summoned additional citizens: ', {
            auth: req.session.authentication,
            data: {
              body: req.body,
            },
          });

          return res.redirect(app.namedRoutes.build('pool-overview.get', {
            poolNumber: req.params['poolNumber'],
          }));
        }
        , errorCB = function(err) {

          app.logger.crit('Failed to summon additional citizens: ', {
            auth: req.session.authentication,
            data: {
              body: req.body,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          if (err.error?.code === 'ERR_BAD_REQUEST' && err.error?.reasonCode === 'invalid_yield') {
            req.session.errors = modUtils
              .makeManualError('citizensToSummon', 'The number of citizens summoned is too high and exceeds the yield');
          } else if (err.error?.code === 'DATA_IS_OUT_OF_DATE') {
            req.session.errors = modUtils
              .makeManualError('citizensToSummon', err.error.message ?? 'Data is out of date');
          } else {
            req.session.errors = modUtils.
              makeManualError('citizensToSummon', 'Something went wrong while trying to summon jurors');
          }

          return res.redirect(app.namedRoutes.build('pool.additional-summons.get', {
            poolNumber: req.params['poolNumber'],
          }));
        };

      validatorResult = validate(req.body, additionalSummonsValidator(req.session.poolDetails.courtYeld));
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('pool.additional-summons.get', {
          poolNumber: req.params['poolNumber'],
        }));
      }

      delete req.session.errors;
      delete req.session.formFields;
      // temporarily I'll delete this here when we post....
      // might need to rethink in case the user clicks cancel 🤔
      delete req.session.newCourtCatchmentArea;
      delete req.session.tmpSelectedBureauSupply;

      summonCitizensDAO.post(req, req.body, 'additional-summons')
        .then(successCB)
        .catch(errorCB);
    };
  };

})();
