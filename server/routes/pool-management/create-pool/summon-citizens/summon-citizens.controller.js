;(function(){
  'use strict';

  var _ = require('lodash')
    // , summonsFormObj = require('../../../../objects/summons-form').poolSummaryObject
    , modUtils = require('../../../../lib/mod-utils')
    , additionalSummonsValidator = require('../../../../config/validation/additional-summons')
    , courtNameOrLocationValidator = require('../../../../config/validation/request-pool').courtNameOrLocation
    , deferralsValidator = require('../../../../config/validation/request-pool').numberOfDeferrals
    , dateFilter = require('../../../../components/filters/').dateFilter
    // , summonCitizenObject = require('../../../../objects/summon-citizens').summonCitizenObject
    // , fetchCourts = require('../../../../objects/request-pool').fetchCourts
    , { fetchCourtsDAO, summonCitizenDAO, summonsFormDAO } = require('../../../../objects')
    , validate = require('validate.js');

  module.exports.index = function(app) {
    return function(req, res) {
      var tmpErrors
        , catchmentAreaCode
        , successCB = function(data) {
          var transformedPostCodes;

          if (data.hasOwnProperty('courtCatchmentItems')) {
            transformedPostCodes = modUtils.transformPostcodes(data.courtCatchmentItems);
          }

          app.logger.info('Fetched pool details for summoning citizens: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              locationCode: catchmentAreaCode,
              attendanceDate: dateFilter(new Date(req.session.poolDetails.poolDetails.courtStartDate),
                null, 'YYYY-MM-DD'),
              numberOfCourtDeferrals: data,
            },
          });

          tmpErrors = _.clone(req.session.errors);
          delete req.session.errors;
          delete req.session.formFields;

          req.session.poolDetails.courtYield =
            (typeof transformedPostCodes !== 'undefined') ? transformedPostCodes[1] : 0;

          req.session.availableBureauDeferrals = data.bureauDeferrals;

          if (typeof req.session.newBureauDeferrals !== 'undefined') {
            req.session.poolDetails.currentBureauDeferrals = req.session.newBureauDeferrals;
          } else {
            req.session.poolDetails.currentBureauDeferrals = data.bureauDeferrals;
          }

          res.render('pool-management/create-pool/summon-citizens/index', {
            poolDetails: req.session.poolDetails,
            bureauDeferrals: req.session.poolDetails.currentBureauDeferrals,
            changeCatchmentAreaUrl: app.namedRoutes.build('summon-citizens.change-catchment-area.get', {
              poolNumber: req.params['poolNumber'],
            }),
            changeDeferralsUrl: app.namedRoutes.build('summon-citizens.change-deferrals.get', {
              poolNumber: req.params['poolNumber'],
            }),
            numberRequired: data.numberRequired,
            postcodes: (typeof transformedPostCodes !== 'undefined') ? transformedPostCodes[0] : [],
            errors: {
              title: 'Please check the form',
              count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
              items: tmpErrors,
            },
          });
        }

        , errorCB = function(err) {
          app.logger.crit('Failed to fetch pool details for summoning citizens: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              poolNumber: req.session.poolDetails.poolDetails.poolNumber,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          res.redirect(app.namedRoutes.build('pool-management.get'));
        };

      if (typeof req.session.newCourtCatchmentArea !== 'undefined') {
        catchmentAreaCode = req.session.newCourtCatchmentArea;
        req.session.poolDetails.currentCatchmentArea = catchmentAreaCode.locationCode;
      } else {
        catchmentAreaCode = req.params['poolNumber'].slice(0, 3);
        req.session.poolDetails.currentCatchmentArea = catchmentAreaCode;
      }

      summonsFormDAO.post(req, req.session.poolDetails)
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.post = function(app) {
    return function(req, res) {
      var validatorResult
        , successCB = function() {

          app.logger.info('Successfully created pool and summoned citizens: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              body: req.body,
            },
          });

          return res.redirect(app.namedRoutes.build('pool-management.get') + '?status=created');
        }
        , errorCB = function(err) {

          app.logger.crit('Failed to create pool and summon citizens: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              body: req.body,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          if (err.error.reasonCode && err.error.reasonCode === 'invalid_yield') {
            req.session.errors = {
              citizensToSummon: [{
                summary: 'Number of citizens to summon is too high',
                details: 'Number of citizens to summon is too high',
              }],
            };
          } else {
            req.session.errors = {
              citizensToSummon: [{
                summary: 'Something went wrong while trying to summon jurors',
                details: 'Something went wrong while trying to summon jurors',
              }],
            };
          };

          return res.redirect(app.namedRoutes.build('summon-citizens.get', {
            poolNumber: req.params['poolNumber'],
          }));
        };

      validatorResult = validate(req.body, additionalSummonsValidator(req.session.poolDetails.courtYield));
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('summon-citizens.get', {
          poolNumber: req.params.poolNumber,
        }));
      };

      summonCitizenDAO.post(req, req.body, 'create-pool')
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.getChangeCatchmentArea = function(app, page) {
    return function(req, res) {
      var transformedCourtNames
        , tmpErrors
        , submitUrl
        , cancelUrl
        , pageIdentifier
        , renderFn = function(response) {

          if (response) {
            req.session.courtsList = response.courts;
            transformedCourtNames = modUtils.transformCourtNames(response.courts);
          } else {
            transformedCourtNames = modUtils.transformCourtNames(_.clone(req.session.courtsList));
          }

          return res.render('pool-management/_common/select-court', {
            pageTitle: 'Change the court catchment area',
            courts: transformedCourtNames,
            submitUrl: submitUrl,
            cancelUrl: cancelUrl,
            pageIdentifier: pageIdentifier,
            errors: {
              title: 'Please check the form',
              count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
              items: tmpErrors,
            },
          });
        };

      if (page === 'summon-citizens') {
        submitUrl = app.namedRoutes.build('summon-citizens.change-catchment-area.post', {
          poolNumber: req.params['poolNumber'],
        });
        cancelUrl = app.namedRoutes.build('summon-citizens.get', {
          poolNumber: req.params['poolNumber'],
        });
        pageIdentifier = 'Summon Citizens';
      } else if (page === 'summon-additional-citizens') {
        submitUrl = app.namedRoutes.build('pool.additional-summons.change-catchment-area.post', {
          poolNumber: req.params['poolNumber'],
        });
        cancelUrl = app.namedRoutes.build('pool.additional-summons.get', {
          poolNumber: req.params['poolNumber'],
        });
        pageIdentifier = 'Summon Additional Citizens';
      } else if (page === 'coroner-pool') {
        submitUrl = app.namedRoutes.build('coroner-pool.change-catchment-area.post', {
          poolNumber: req.params['poolNumber'],
        });
        cancelUrl = app.namedRoutes.build('coroner-pool.catchment-area.get', {
          poolNumber: req.params['poolNumber'],
        });
        pageIdentifier = 'Coroner Pool';
      }

      tmpErrors = _.clone(req.session.errors);
      delete req.session.errors;
      delete req.session.formFields;

      if (typeof req.session.courtsList === 'undefined') {
        return fetchCourtsDAO.get(req)
          .then(renderFn);
      }

      return renderFn(null);
    };
  };

  module.exports.postChangeCatchmentArea = function(app, page) {
    return function(req, res) {
      var validatorResult
        , renderUrl
        , errorUrl
        , successCB = function(data) {

          req.session.newCourtCatchmentArea = data;

          return res.redirect(renderUrl);
        }
        , errorCB = function() {
          req.session.errors = {
            courtNameOrLocation: [{
              summary: 'Please check the court name or location',
              details: 'We could not find that court. Select another one or go back',
            }],
          };

          return res.redirect(errorUrl);
        };

      if (page === 'summon-citizens') {
        renderUrl = app.namedRoutes.build('summon-citizens.get', {
          poolNumber: req.params['poolNumber'],
        });
        errorUrl = app.namedRoutes.build('summon-citizens.change-catchment-area.get', {
          poolNumber: req.params['poolNumber'],
        });
      } else if (page === 'summon-additional-citizens') {
        renderUrl = app.namedRoutes.build('pool.additional-summons.get', {
          poolNumber: req.params['poolNumber'],
        });
        errorUrl = app.namedRoutes.build('pool.additional-summons.change-catchment-area.get', {
          poolNumber: req.params['poolNumber'],
        });
      } else if (page === 'coroner-pool') {
        renderUrl = app.namedRoutes.build('coroner-pool.catchment-area.get', {
          poolNumber: req.params['poolNumber'],
        });
        errorUrl = app.namedRoutes.build('coroner-pool.change-catchment-area.get', {
          poolNumber: req.params['poolNumber'],
        });
      }

      validatorResult = validate(req.body, courtNameOrLocationValidator(req));
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(errorUrl);
      }

      modUtils.matchUserCourt(req.session.courtsList, req.body)
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.getChangeDeferrals = function(app, page) {
    return function(req, res) {
      var tmpErrors
        , deferrals
        , submitUrl
        , cancelUrl;

      if (page === 'summon-citizens') {
        deferrals = req.session.availableBureauDeferrals;
        submitUrl = app.namedRoutes.build('summon-citizens.change-deferrals.post', {
          poolNumber: req.params['poolNumber'],
        });
        cancelUrl = app.namedRoutes.build('summon-citizens.get', {
          poolNumber: req.params['poolNumber'],
        });
      } else if (page === 'summon-additional-citizens') {
        deferrals = req.session.poolDetails.additionalStatistics.bureauSupply;
        submitUrl = app.namedRoutes.build('pool.additional-summons.change-deferrals.post', {
          poolNumber: req.params['poolNumber'],
        });
        cancelUrl = app.namedRoutes.build('pool.additional-summons.get', {
          poolNumber: req.params['poolNumber'],
        });
      }

      tmpErrors = _.clone(req.session.errors);
      delete req.session.errors;
      delete req.session.formFields;

      return res.render('pool-management/_common/change-deferrals', {
        submitUrl: submitUrl,
        cancelUrl: cancelUrl,
        pageTitle: 'Number of bureau deferrals to include in this pool',
        bureauDeferrals: deferrals.toString(),
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postChangeDeferrals = function(app, page) {
    return function(req, res) {
      var validatorResult
        , currentBureauDeferrals
        , renderUrl
        , errorUrl;

      if (page === 'summon-citizens') {
        currentBureauDeferrals = req.session.poolDetails.currentBureauDeferrals;
        errorUrl = app.namedRoutes.build('summon-citizens.change-deferrals.get'
          , {poolNumber: req.params['poolNumber'],
          });
        renderUrl = app.namedRoutes.build('summon-citizens.get', {
          poolNumber: req.params['poolNumber'],
        });
      } else if (page === 'summon-additional-citizens') {
        currentBureauDeferrals = req.session.poolDetails.additionalStatistics.bureauSupply;
        errorUrl = app.namedRoutes.build('pool.additional-summons.change-deferrals.get', {
          poolNumber: req.params['poolNumber'],
        });
        renderUrl = app.namedRoutes.build('pool.additional-summons.get', {
          poolNumber: req.params['poolNumber'],
        });
      }

      validatorResult = validate({
        numberOfDeferrals: currentBureauDeferrals,
      }, deferralsValidator(req.body));
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(errorUrl);
      }

      if (req.body.numberOfDeferrals !== currentBureauDeferrals) {
        if (page === 'summon-citizens') {
          req.session.newBureauDeferrals = req.body.numberOfDeferrals;
        } else if (page === 'summon-additional-citizens') {
          req.session.tmpSelectedBureauSupply = req.body.numberOfDeferrals;
        }
      }

      return res.redirect(renderUrl);
    };
  };

})();
