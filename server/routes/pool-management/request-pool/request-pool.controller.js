;(function() {
  'use strict';

  var _ = require('lodash')
    , validate = require('validate.js')
    , validator = require('../../../config/validation/request-pool')
    , modUtils = require('../../../lib/mod-utils')
    , requestPoolObj = require('../../../objects/request-pool')
    , isCourtUser = require('../../../components/auth/user-type').isCourtUser
    , dateFilter = require('../../../components/filters').dateFilter
    , checkDayType = require('../check-day-type');
  const { fetchCourtsDAO } = require('../../../objects');

  // this middleware checks if the user has already started a pool request
  // caching the pool details on the session object helps with that
  // it allows us to have a multi step form for a pool request
  module.exports.hasStartedRequest = function(app) {
    return function(req, res, next) {
      if (typeof req.session.poolDetails === 'undefined') {
        return res.redirect(app.namedRoutes.build('request-pool.select-court.get'));
      }

      next();
    }
  }

  module.exports.getSelectCourt = function(app) {
    return async function(req, res) {
      var tmpErrors
        , transformedCourtNames

        // callbacks for when a user is a court user
        , successCB = function(result) {
          req.session.poolDetails = {
            courtName: result.locationName,
            courtCode: result.locationCode,
            attendanceTime: {
              hour: result.attendanceTime.split(':')[0],
              minute: result.attendanceTime.split(':')[1],
            },
          };

          if (req.query['nil'] === 'true') {
            return res.redirect(app.namedRoutes.build('nil-pool.get'));
          }

          res.redirect(app.namedRoutes.build('request-pool.pool-details.get'));
        }
        , errorCB = function(err) {
          req.session.errors = {
            courtNameOrLocation: [{
              summary: 'Please check the court name or location',
              details: 'It was not possible to load your court automatically. Please manually select a court'
            }]
          };

          app.logger.crit('Failed to select a court: ', {
            auth: req.session.authentication,
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          // because the court was invalid lets then set it as invalid but not remove
          // this will allow to bypass the current session values until the user relogs
          req.session.userCourt = {
            isValid: false,
          };

          res.redirect(app.namedRoutes.build('request-pool.select-court.get'));
        };

      if (!req.session.courtsList) {
        try {
          req.session.courtsList = await fetchCourtsDAO.get(req);
        } catch (err) {
          app.logger.crit('Failed to fetch courts list: ', {
            auth: req.session.authentication,
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          req.session.errors = modUtils.makeManualError('Courts list', 'Failed to fetch courts list');

          return res.redirect(app.namedRoutes.build('request-pool.select-court.get'));
        }
      }

      transformedCourtNames = modUtils.transformCourtNames(req.session.courtsList);

      // redirect the user straight to pool-details form when they are a court user
      // a court user is defined with a court number different than 400 (400 being bureau user)
      if (isCourtUser(req, res) && typeof req.session.poolDetails === 'undefined') {
        req.body.courtNameOrLocation = req.session.authentication.locCode;

        return modUtils.matchUserCourt(req.session.courtsList, req.body)
          .then(successCB)
          .catch(errorCB);
      }

      tmpErrors = _.cloneDeep(req.session.errors);
      delete req.session.errors;
      delete req.session.formFields;

      return res.render('pool-management/_common/select-court', {
        courts: transformedCourtNames,
        pageTitle: 'Select a court for this pool',
        submitUrl: app.namedRoutes.build('request-pool.select-court.post') + (req.query['nil'] ? '?nil=true' : ''),
        cancelUrl:
          app.namedRoutes.build((typeof req.session.poolDetails !== 'undefined')
            ? 'request-pool.pool-details.get' : 'pool-management.get'),
        pageIdentifier: 'Request a Pool',
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        }
      });
    }
  }

  module.exports.postSelectCourt = function(app) {
    return function(req, res) {
      var validatorResult
        , successCB = function(result) {
          req.session.poolDetails = {
            courtName: result.locationName,
            courtCode: result.locationCode,
            attendanceTime: {
              hour: result.attendanceTime.split(':')[0],
              minute: result.attendanceTime.split(':')[1],
            },
          };

          if (req.query['nil'] === 'true') {
            return res.redirect(app.namedRoutes.build('nil-pool.get'));
          }

          res.redirect(app.namedRoutes.build('request-pool.pool-details.get'));
        }
        , errorCB = function() {
          req.session.errors = {
            courtNameOrLocation: [{
              summary: 'Please check the court name or location',
              details: 'This court does not exist. Please enter a name or code of an existing court'
            }]
          };

          res.redirect(app.namedRoutes.build('request-pool.select-court.get'));
        };

      validatorResult = validate(req.body, validator.courtNameOrLocation(req));
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('request-pool.select-court.get'));
      }

      // reset session data
      delete req.session.errors;
      delete req.session.formFields;

      return modUtils.matchUserCourt(req.session.courtsList, req.body)
        .then(successCB)
        .catch(errorCB);
    }
  }

  // maybe there is a better way of running this without having to request the number of deferrals every time?
  // TODO: investigate the above?
  module.exports.getPoolDetails = function(app) {
    return function(req, res) {
      var tmpErrors
        , suggestedDate

        , successCB = function(data) {

          // cache the number of deferrals available so we can always have it at hand
          // for when changing the number of deferrals
          req.session.poolDetails.courtDeferralsAvailable = data;

          app.logger.info('Fetched the number of court deferrals: ', {
            auth: req.session.authentication,
            data: {
              locationCode: req.session.poolDetails.courtCode,
              attendanceDate: dateFilter(req.session.poolDetails.attendanceDate, null, 'YYYY-MM-DD'),
              numberOfCourtDeferrals: data,
            },
          });

          return res.render('pool-management/request-pool/pool-details/index', {
            poolDetails: {
              courtName: req.session.poolDetails.courtName,
              courtCode: req.session.poolDetails.courtCode,
              attendanceTime: req.session.poolDetails.attendanceTime,
              attendanceDate:
                (typeof req.session.poolDetails.attendanceDate === 'undefined')
                  ? suggestedDate : req.session.poolDetails.attendanceDate,
              poolType:
                (typeof req.session.poolDetails.poolType === 'undefined')
                  ? null : req.session.poolDetails.poolType,
              additionalRequirements:
                (typeof req.session.poolDetails.additionalRequirements === 'undefined')
                  ? null : req.session.poolDetails.additionalRequirements,
              numberOfJurorsRequired:
                (typeof req.session.poolDetails.numberOfJurorsRequired === 'undefined')
                  ? null : req.session.poolDetails.numberOfJurorsRequired,
              numberOfCourtDeferrals:
                (typeof req.session.poolDetails.numberOfCourtDeferrals === 'undefined')
                  ? data : req.session.poolDetails.numberOfCourtDeferrals,
            },
            errors: {
              title: 'Please check the form',
              count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
              items: tmpErrors,
            }
          });
        }
        , errorCB = function(err) {
          app.logger.crit('Failed to fetch the number of court deferrals: ', {
            auth: req.session.authentication,
            data: {
              locationCode: req.session.poolDetails.courtCode,
              attendanceDate: dateFilter(req.session.poolDetails.attendanceDate, null, 'YYYY-MM-DD'),
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('_errors/generic', { err });
        };

      // set a session var saying that the user is visiting the poolDetailsPage
      // this will be used to block access to change screens from any other page... ie direct link
      req.session.poolDetailsPage = true;

      suggestedDate = modUtils.buildSuggestedDate();

      // save the suggested date into the session
      // because we might need to show if the user decides to change it.
      // also delete the numberOfCourtDeferrals if there is a new date (tmpDate)
      // because we want to use the number of deferrals for that new date
      if (typeof req.session.poolDetails.attendanceDate === 'undefined') {
        req.session.poolDetails.attendanceDate = suggestedDate;
      } else if (typeof req.session.tmpDate !== 'undefined') {
        req.session.poolDetails.attendanceDate = req.session.tmpDate;
        delete req.session.tmpDate;
        delete req.session.poolDetails.numberOfCourtDeferrals;
      }

      tmpErrors = _.cloneDeep(req.session.errors);
      delete req.session.errors;
      delete req.session.formFields;
      delete req.session.invalidDate;
      delete req.session.redirectedFrom;
      delete req.session.checkDetailsPage;

      requestPoolObj.fetchCourtDeferrals.get(
        req,
        req.session.poolDetails.courtCode,
        req.session.poolDetails.attendanceDate
      )
        .then(successCB)
        .catch(errorCB);
    }
  }

  // I may need to add a request here to fetch the pool number
  // but it could also be done before getting here
  module.exports.postPoolDetails = function(app) {
    return function(req, res) {
      var validatorResult
        , tmpPoolDetails = req.session.poolDetails;

      // some data gets overwritten when we clone the body but we still need it
      // store it on a temp var and reassign back to req.session.poolDetails
      req.session.poolDetails = _.clone(req.body);
      req.session.poolDetails.courtName = tmpPoolDetails.courtName;
      req.session.poolDetails.courtCode = tmpPoolDetails.courtCode;
      req.session.poolDetails.attendanceTime = tmpPoolDetails.attendanceTime;

      validatorResult = validate(req.body, require('../../../config/validation/request-pool.js').poolDetails(req));
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('request-pool.pool-details.get'));
      }

      // clear error session data
      delete req.session.errors;
      delete req.session.formFields;
      delete req.session.poolDetailsPage;

      // add this current session data only to be able to manage the same served files for multiple calls
      req.session.redirectedFrom = 'request-pool.pool-details.post';

      checkDayType(app)(req, res);
    }
  }

  module.exports.getChangeAttendanceDate = function(app) {
    return function(req, res) {
      var tmpErrors
        , tmpFormFields
        , currentSetDate = new Date(req.session.poolDetails.attendanceDate || null);

      tmpErrors = _.clone(req.session.errors);
      tmpFormFields = _.clone(req.session.formFields);
      delete req.session.errors;
      delete req.session.formFields;

      // delete the new temp date from the session
      // if the user clicks cancel to go back to the date setting and then pool details
      // the old date will still be displayed
      delete req.session.tmpDate;

      // if the user tries to access to change attendance date from anywhere but pool-details page
      // quit them from the request-pool journey
      if (req.session.poolDetailsPage !== true) {
        return res.redirect(app.namedRoutes.build('pool-management.get'));
      }

      res.render('pool-management/_common/change-attendance-date', {
        attendanceDate: currentSetDate,
        submitUrl: 'request-pool.change-attendance-date.post',
        cancelUrl: 'request-pool.pool-details.get',
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        }
      });
    }
  }

  module.exports.postChangeAttendanceDate = function(app) {
    return function(req, res) {
      var validatorResult;

      validatorResult = validate(req.body, validator.validateDate());
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('request-pool.change-attendance-date.get'));
      }

      // set the new date to the session poolDetails object
      req.session.tmpDate = dateFilter(req.body.attendanceDate, 'DD/MM/YYYY', 'YYYY-MM-DD')

      // clear error session data
      delete req.session.errors;
      delete req.session.formFields;
      delete req.session.invalidDate;

      // add this current session data only to be able to manage the same served files for multiple calls
      req.session.redirectedFrom = 'request-pool.change-attendance-date.post';

      checkDayType(app)(req, res);
    }
  }

  module.exports.getChangeDeferrals = function(app) {
    return function(req, res) {
      var tmpErrors;

      tmpErrors = _.cloneDeep(req.session.errors);
      delete req.session.errors;
      delete req.session.formFields;

      // if the user tries to access to change the number of deferrals from anywhere but pool-details page
      // quit them from the request-pool journey
      if (req.session.poolDetailsPage !== true) {
        return res.redirect(app.namedRoutes.build('pool-management.get'));
      }

      res.render('pool-management/_common/change-deferrals', {
        courtDeferrals: req.session.poolDetails.courtDeferralsAvailable.toString(),
        pageTitle: 'Number of court deferrals to include in this pool',
        submitUrl: app.namedRoutes.build('request-pool.change-deferrals.post'),
        cancelUrl: app.namedRoutes.build('request-pool.pool-details.get'),
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        }
      });
    }
  }

  module.exports.postChangeDeferrals = function(app) {
    return function(req, res) {
      var validatorResult;

      validatorResult = validate({
        numberOfDeferrals: req.session.poolDetails.courtDeferralsAvailable
      }, validator.numberOfDeferrals(req.body));
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('request-pool.change-deferrals.get'));
      }

      // clear errors from the session
      delete req.session.errors;
      delete req.session.formFields;

      req.session.poolDetails.numberOfCourtDeferrals = req.body.numberOfDeferrals;

      res.redirect(app.namedRoutes.build('request-pool.pool-details.get'));
    }
  }

  module.exports.getInvalidDate = function(app) {
    return function(req, res) {
      var invalidDate = {};

      if (typeof req.session.invalidDate !== 'undefined') {
        invalidDate = req.session.invalidDate;
      } else {
        invalidDate = req.session.errors.invalidDate;
        invalidDate.redirectedFrom = req.session.redirectedFrom;
      }

      // cache for refreshing purposes and delete the errors to avoid leaking
      req.session.invalidDate = invalidDate;
      delete req.session.errors;

      res.render('pool-management/_common/invalid-date', {
        invalidDate: invalidDate,
      });
    }
  }

  module.exports.getCheckDetails = function(app) {
    return function(req, res) {
      var successCB = function(data) {

          // set the new pool number into the current poolDetails data...
          // we know that data is undefined because coming from change-pool-number screen
          // we call this function with no parameters
          req.session.poolDetails.poolNumber =
            (typeof data === 'undefined') ? req.session.newPoolNumber : data;

          app.logger.info('Generated a new pool number: ', {
            auth: req.session.authentication,
            data: req.session.poolDetails.poolNumber,
          });

          const poolDetails = req.session.poolDetails;

          if (parseInt(poolDetails.numberOfJurorsRequired) >= parseInt(poolDetails.numberOfCourtDeferrals)) {
            poolDetails.actualRequired = poolDetails.numberOfJurorsRequired - poolDetails.numberOfCourtDeferrals;
          } else {
            poolDetails.actualRequired = 0;
            poolDetails.numberOfCourtDeferrals = poolDetails.numberOfJurorsRequired;
          }

          const tmpErrors = _.clone(req.session.errors);

          delete req.session.errors;

          return res.render('pool-management/_common/check-request-details', {
            poolDetails: poolDetails,
            submitUrl: app.namedRoutes.build('request-pool.check-details.post'),
            cancelUrl: app.namedRoutes.build('pool-management.get'),
            changeUrl: app.namedRoutes.build('request-pool.pool-details.get'),
            changePoolNumberUrl: app.namedRoutes.build('request-pool.change-pool-number.get'),
            pageIdentifier: 'Request a Pool',
            pageTitle: 'Check your pool request',
            buttonLabel: 'Request pool',
            errors: {
              title: 'Please check all details',
              count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
              items: tmpErrors,
            },
          });
        },
        errorCB = function(err) {

          app.logger.crit('Failed to generate a new pool number: ', {
            auth: req.session.authentication,
            data: {
              locationCode: req.session.poolDetails.courtCode,
              attendanceDate: req.session.poolDetails.attendanceDate,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.redirect(app.namedRoutes.build('pool-management.get'));
        };

      // delete some unnecessary cached data
      delete req.session.invalidDate;
      delete req.session.redirectedFrom;

      // set a session var with checkDetails page
      req.session.checkDetailsPage = true;

      // conditionally send an api request to generate a pool number
      if (typeof req.session.newPoolNumber === 'undefined') {
        requestPoolObj.generatePoolNumber.get(
          req,
          req.session.poolDetails.courtCode,
          req.session.poolDetails.attendanceDate
        )
          .then(successCB)
          .catch(errorCB);
      } else {
        // call the successCB() function with no parameters
        successCB();
      }
    }
  }

  module.exports.postCheckDetails = function(app) {
    return function(req, res) {
      var tmpBody = _.clone(req.body)
        , successCB = function() {

          app.logger.info('Created a new pool request: ', {
            auth: req.session.authentication,
            data: req.session.poolDetails,
          });

          return res.redirect(app.namedRoutes.build('pool-management.get'));
        }
        , errorCB = function(err) {

          app.logger.crit('Failed to create a new pool request: ', {
            auth: req.session.authentication,
            data: req.session.poolDetails,
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          req.session.errors = modUtils.makeManualError('poolRequest', 'Something went wrong when trying to request a new pool');

          return res.redirect(app.namedRoutes.build('request-pool.check-details.get'));
        };

      // res.render('pool-management/_common/request-pool-loading.njk');

      tmpBody.attendanceTime = req.session.poolDetails.attendanceTime;

      // clear error session data
      delete req.session.errors;
      delete req.session.formFields;

      requestPoolObj.createPoolRequest.post(req, tmpBody)
        .then(successCB)
        .catch(errorCB);
    }
  }

  module.exports.getChangeAttendanceTime = function(app) {
    return function(req, res) {
      var tmpErrors;

      tmpErrors = _.cloneDeep(req.session.errors);
      delete req.session.errors;
      delete req.session.formFields;

      // if the user tries to access to change attendance time from anywhere but pool-details page
      // quit them from the request-pool journey
      if (req.session.poolDetailsPage !== true) {
        return res.redirect(app.namedRoutes.build('pool-management.get'));
      }

      res.render('pool-management/_common/change-attendance-time', {
        attendanceTime: {
          hour: req.session.poolDetails.attendanceTime.hour,
          minute: req.session.poolDetails.attendanceTime.minute,
        },
        submitUrl: 'request-pool.change-attendance-time.post',
        cancelUrl: 'request-pool.pool-details.get',
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        }
      });
    }
  }

  module.exports.postChangeAttendanceTime = function(app) {
    return function(req, res) {
      var validatorResult;

      validatorResult = validate(req.body, validator.attendanceTime(req));
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('request-pool.change-attendance-time.get'));
      }

      // reset session data
      delete req.session.errors;
      delete req.session.formFields;

      req.session.poolDetails.attendanceTime = modUtils.padTime(req.body);

      res.redirect(app.namedRoutes.build('request-pool.pool-details.get'));
    }
  }

  module.exports.getChangePoolNumber = function(app) {
    return function(req, res) {
      var transformedPoolNumbers
        , tmpErrors
        , poolNumberPrefix

        , successCB = function(data) {

          // add the server response to the session so we can passe it to the post call
          req.session.poolNumbers = data.poolNumbers;

          transformedPoolNumbers = modUtils.transformPoolNumbers(data.poolNumbers);

          return res.render('pool-management/request-pool/change-pool-number/index', {
            courtCode: req.session.poolDetails.courtCode,
            courtName: req.session.poolDetails.courtName,
            poolNumbers: transformedPoolNumbers,
            errors: {
              title: 'Please check the form',
              count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
              items: tmpErrors,
            }
          });
        }
        , errorCB = function(err) {

          app.logger.crit('Failed to fetch pool numbers: ', {
            auth: req.session.authentication,
            data: poolNumberPrefix,
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.redirect(app.namedRoutes.build('pool-management.get'));
        }

      // quit the request-pool process if the user tries to access from an invalid page / direct link
      if (req.session.checkDetailsPage !== true) {
        return res.redirect(app.namedRoutes.build('pool-management.get'));
      }

      tmpErrors = _.cloneDeep(req.session.errors);
      delete req.session.errors;
      delete req.session.formFields;

      poolNumberPrefix = poolNumberPrefixBuilder(req.session.poolDetails);

      requestPoolObj.fetchPoolNumbers.get(req, poolNumberPrefix)
        .then(successCB)
        .catch(errorCB);
    }
  }

  module.exports.postChangePoolNumber = function(app) {
    return function(req, res) {
      var validatorResult;

      validatorResult = validate(req.body, validator.poolNumber(req));
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('request-pool.change-pool-number.get'));
      }

      // reset session data
      delete req.session.errors;
      delete req.session.formFields;
      delete req.session.poolNumbers;

      // when we visit the check-details page the app always does an api request to generate a pool number
      // we (at least I) don't want that. so I will save the new pool number into the session to
      // conditionally send that api call
      req.session.newPoolNumber = req.body.poolNumber;

      res.redirect(app.namedRoutes.build('request-pool.check-details.get'));
    }
  }

  module.exports.poolNumberPrefixBuilder = poolNumberPrefixBuilder;
  function poolNumberPrefixBuilder(poolDetails) {
    var courtCode = poolDetails.courtCode
      , dateJoin = dateFilter(poolDetails.attendanceDate, null, 'YYMM');

    return [courtCode, dateJoin].join('');
  }

})();
