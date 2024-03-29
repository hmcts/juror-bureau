const _ = require('lodash');
const summonsFormObj = require('../../../../objects/summons-form').poolSummaryObject;
const modUtils = require('../../../../lib/mod-utils');
const additionalSummonsValidator = require('../../../../config/validation/additional-summons');
const courtNameOrLocationValidator = require('../../../../config/validation/request-pool').courtNameOrLocation;
const deferralsValidator = require('../../../../config/validation/request-pool').numberOfDeferrals;
const dateFilter = require('../../../../components/filters/').dateFilter;
const summonCitizenObject = require('../../../../objects/summon-citizens').summonCitizenObject;
const fetchCourts = require('../../../../objects/request-pool').fetchCourts;
const validate = require('validate.js');

module.exports.index = function (app) {
  return function (req, res) {
    let tmpErrors;
    let catchmentAreaCode;
    const successCB = function (data) {
      let transformedPostCodes;

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
    };

    const errorCB = function (err) {
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

    summonsFormObj.post(require('request-promise'), app, req.session.authToken, req.session.poolDetails)
      .then(successCB)
      .catch(errorCB);
  };
};

module.exports.post = function (app) {
  return function (req, res) {
    const successCB = function () {
      app.logger.info('Successfully created pool and summoned citizens: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        data: {
          body: req.body,
        },
      });

      return res.redirect(app.namedRoutes.build('pool-management.get') + '?status=created');
    };
    const errorCB = function (err) {
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

    const validatorResult = validate(req.body, additionalSummonsValidator(req.session.poolDetails.courtYield));
    if (typeof validatorResult !== 'undefined') {
      req.session.errors = validatorResult;
      req.session.formFields = req.body;

      return res.redirect(app.namedRoutes.build('summon-citizens.get', {
        poolNumber: req.params.poolNumber,
      }));
    };

    summonCitizenObject.post(require('request-promise'), app, req.session.authToken, req.body, 'create-pool')
      .then(successCB)
      .catch(errorCB);
  };
};

module.exports.getChangeCatchmentArea = function (app, page) {
  return function (req, res) {
    let transformedCourtNames;
    let tmpErrors;
    let submitUrl;
    let cancelUrl;
    let pageIdentifier;
    const renderFn = function (response) {

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
      return fetchCourts.get(require('request-promise'), app, req.session.authToken)
        .then(renderFn);
    }

    return renderFn(null);
  };
};

module.exports.postChangeCatchmentArea = function (app, page) {
  return function (req, res) {
    let renderUrl;
    let errorUrl;
    const successCB = function (data) {

      req.session.newCourtCatchmentArea = data;

      return res.redirect(renderUrl);
    };
    const errorCB = function () {
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

    const validatorResult = validate(req.body, courtNameOrLocationValidator(req));
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

module.exports.getChangeDeferrals = function (app, page) {
  return function (req, res) {
    let tmpErrors;
    let deferrals;
    let submitUrl;
    let cancelUrl;

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

module.exports.postChangeDeferrals = function (app, page) {
  return function (req, res) {
    let currentBureauDeferrals;
    let renderUrl;
    let errorUrl;

    if (page === 'summon-citizens') {
      currentBureauDeferrals = req.session.poolDetails.currentBureauDeferrals;
      errorUrl = app.namedRoutes.build('summon-citizens.change-deferrals.get'
        , {
          poolNumber: req.params['poolNumber'],
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

    const validatorResult = validate({
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
