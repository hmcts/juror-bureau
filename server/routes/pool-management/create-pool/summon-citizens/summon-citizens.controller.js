;(function(){
  'use strict';

  var _ = require('lodash')
    , modUtils = require('../../../../lib/mod-utils')
    , additionalSummonsValidator = require('../../../../config/validation/additional-summons')
    , courtNameOrLocationValidator = require('../../../../config/validation/request-pool').courtNameOrLocation
    , deferralsValidator = require('../../../../config/validation/request-pool').numberOfDeferrals
    , dateFilter = require('../../../../components/filters/').dateFilter
    , fetchCourts = require('../../../../objects/request-pool').fetchCourts
    , validate = require('validate.js');

  const { summonsFormDAO, summonCitizensDAO } = require('../../../../objects');
  const { poolSummaryObject } = require('../../../../objects/pool-summary');

  module.exports.index = function(app) {
    return async function(req, res) {
      const { poolNumber } = req.params;
      const catchmentAreaCode = req.session[`summonJurors-${poolNumber}`]?.newCourtCatchmentArea
        ? req.session[`summonJurors-${poolNumber}`].newCourtCatchmentArea.locationCode : poolNumber.slice(0, 3);
      let pool;

      var tmpErrors
        , successCB = function(data) {
          var transformedPostCodes;

          if (data.hasOwnProperty('courtCatchmentItems')) {
            transformedPostCodes = modUtils.transformPostcodes(data.courtCatchmentItems);
          }

          app.logger.info('Fetched pool details for summoning citizens: ', {
            auth: req.session.authentication,
            data: {
              locationCode: catchmentAreaCode,
              attendanceDate: dateFilter(new Date(pool.poolDetails.courtStartDate), null, 'YYYY-MM-DD'),
              numberOfCourtDeferrals: data,
            },
          });

          tmpErrors = _.clone(req.session.errors);
          delete req.session.errors;
          delete req.session.formFields;

          req.session[`summonJurors-${poolNumber}`].courtYield =
            (typeof transformedPostCodes !== 'undefined') ? transformedPostCodes[1] : 0;

          req.session[`summonJurors-${poolNumber}`].availableBureauDeferrals = data.bureauDeferrals;

          if (typeof req.session[`summonJurors-${poolNumber}`].newBureauDeferrals !== 'undefined') {
            req.session[`summonJurors-${poolNumber}`].currentBureauDeferrals = req.session[`summonJurors-${poolNumber}`].newBureauDeferrals;
          } else {
            req.session[`summonJurors-${poolNumber}`].currentBureauDeferrals = data.bureauDeferrals;
          }

          res.render('pool-management/create-pool/summon-citizens/index', {
            poolDetails: pool,
            bureauDeferrals: req.session[`summonJurors-${poolNumber}`].currentBureauDeferrals,
            changeCatchmentAreaUrl: app.namedRoutes.build('summon-citizens.change-catchment-area.get', { poolNumber }),
            changeDeferralsUrl: app.namedRoutes.build('summon-citizens.change-deferrals.get', { poolNumber }),
            numberRequired: data.numberRequired,
            postcodes: (typeof transformedPostCodes !== 'undefined') ? transformedPostCodes[0] : [],
            catchmentAreaCode,
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
            data: { poolNumber },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          res.redirect(app.namedRoutes.build('pool-management.get'));
        };

      try {
        pool = await poolSummaryObject.get(req, poolNumber);
      } catch (err) {
        app.logger.crit('Failed to fetch pool details for summoning citizens: ', {
          auth: req.session.authentication,
          data: { poolNumber },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic', { err });
      }

      if (!req.session[`summonJurors-${poolNumber}`]) {
        req.session[`summonJurors-${poolNumber}`] = {};
      }

      summonsFormDAO.post(req, pool, catchmentAreaCode)
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.post = function(app) {
    return function(req, res) {
      const { poolNumber } = req.params;

      var validatorResult
        , successCB = function() {

          app.logger.info('Successfully created pool and summoned citizens: ', {
            auth: req.session.authentication,
            data: { body: req.body },
          });

          delete req.session[`summonJurors-${req.params.poolNumber}`];

          return res.redirect(app.namedRoutes.build('pool-management.get') + '?status=created');
        }
        , errorCB = function(err) {

          app.logger.crit('Failed to create pool and summon citizens: ', {
            auth: req.session.authentication,
            data: { body: req.body },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          if (err.statusCode === 422 && err.error?.code === 'COULD_NOT_FIND_ENOUGH_ELIGIBLE_VOTERS') {
            req.session.errors = modUtils
              .makeManualError('citizensToSummon', 'Not enough eligible voters found to create a pool');
          } else if (err.error?.code === 'ERR_BAD_REQUEST' && err.error?.reasonCode === 'invalid_yield') {
            req.session.errors = modUtils
              .makeManualError('citizensToSummon', 'The number of citizens summoned is too high and exceeds the yield');
          } else if (err.error?.code === 'DATA_IS_OUT_OF_DATE') {
            req.session.errors = modUtils
              .makeManualError('citizensToSummon', err.error.message ?? 'Data is out of date');
          } else {
            req.session.errors = modUtils.
              makeManualError('citizensToSummon', 'Something went wrong while trying to summon jurors');
          }

          return res.redirect(app.namedRoutes.build('summon-citizens.get', {
            poolNumber,
          }));
        };

      validatorResult = validate(req.body, additionalSummonsValidator(req.session[`summonJurors-${poolNumber}`].courtYield));
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('summon-citizens.get', {
          poolNumber,
        }));
      };

      summonCitizensDAO.post(req, req.body, 'create-pool')
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.getChangeCatchmentArea = function(app, page) {
    return function(req, res) {
      const { poolNumber } = req.params;

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
        submitUrl = app.namedRoutes.build('summon-citizens.change-catchment-area.post', { poolNumber });
        cancelUrl = app.namedRoutes.build('summon-citizens.get', { poolNumber });
        pageIdentifier = 'Summon Citizens';
      } else if (page === 'summon-additional-citizens') {
        submitUrl = app.namedRoutes.build('pool.additional-summons.change-catchment-area.post', { poolNumber });
        cancelUrl = app.namedRoutes.build('pool.additional-summons.get', { poolNumber });
        pageIdentifier = 'Summon Additional Citizens';
      } else if (page === 'coroner-pool') {
        submitUrl = app.namedRoutes.build('coroner-pool.change-catchment-area.post', { poolNumber });
        cancelUrl = app.namedRoutes.build('coroner-pool.catchment-area.get', { poolNumber });
        pageIdentifier = 'Coroner Pool';
      }

      tmpErrors = _.clone(req.session.errors);
      delete req.session.errors;
      delete req.session.formFields;

      if (typeof req.session.courtsList === 'undefined') {
        return fetchCourts.get(req)
          .then(renderFn);
      }

      return renderFn(null);
    };
  };

  module.exports.postChangeCatchmentArea = function(app, page) {
    return function(req, res) {
      const { poolNumber } = req.params;

      var validatorResult
        , renderUrl
        , errorUrl
        , successCB = function(data) {

          if (page === 'summon-citizens') {
            req.session[`summonJurors-${poolNumber}`].newCourtCatchmentArea = data;
          } else {
            req.session.newCourtCatchmentArea = data;
          }

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
        renderUrl = app.namedRoutes.build('summon-citizens.get', { poolNumber });
        errorUrl = app.namedRoutes.build('summon-citizens.change-catchment-area.get', { poolNumber });
      } else if (page === 'summon-additional-citizens') {
        renderUrl = app.namedRoutes.build('pool.additional-summons.get', { poolNumber });
        errorUrl = app.namedRoutes.build('pool.additional-summons.change-catchment-area.get', { poolNumber });
      } else if (page === 'coroner-pool') {
        renderUrl = app.namedRoutes.build('coroner-pool.catchment-area.get', { poolNumber });
        errorUrl = app.namedRoutes.build('coroner-pool.change-catchment-area.get', { poolNumber });
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
      const { poolNumber } = req.params;

      var tmpErrors
        , deferrals
        , submitUrl
        , cancelUrl;

      if (page === 'summon-citizens') {
        deferrals = req.session[`summonJurors-${poolNumber}`].availableBureauDeferrals;
        submitUrl = app.namedRoutes.build('summon-citizens.change-deferrals.post', { poolNumber });
        cancelUrl = app.namedRoutes.build('summon-citizens.get', { poolNumber });
      } else if (page === 'summon-additional-citizens') {
        deferrals = req.session.poolDetails.additionalStatistics.bureauSupply; // TODO: Check this
        submitUrl = app.namedRoutes.build('pool.additional-summons.change-deferrals.post', { poolNumber });
        cancelUrl = app.namedRoutes.build('pool.additional-summons.get', { poolNumber });
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
      const { poolNumber } = req.params;

      var validatorResult
        , currentBureauDeferrals
        , renderUrl
        , errorUrl;

      if (page === 'summon-citizens') {
        currentBureauDeferrals = req.session[`summonJurors-${poolNumber}`].availableBureauDeferrals;
        errorUrl = app.namedRoutes.build('summon-citizens.change-deferrals.get', { poolNumber });
        renderUrl = app.namedRoutes.build('summon-citizens.get', { poolNumber });
      } else if (page === 'summon-additional-citizens') {
        currentBureauDeferrals = req.session.poolDetails.additionalStatistics.bureauSupply; // TODO: check this
        errorUrl = app.namedRoutes.build('pool.additional-summons.change-deferrals.get', { poolNumber });
        renderUrl = app.namedRoutes.build('pool.additional-summons.get', { poolNumber });
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
          req.session[`summonJurors-${poolNumber}`].newBureauDeferrals = req.body.numberOfDeferrals;
        } else if (page === 'summon-additional-citizens') {
          req.session.tmpSelectedBureauSupply = req.body.numberOfDeferrals;
        }
      }

      return res.redirect(renderUrl);
    };
  };

})();
