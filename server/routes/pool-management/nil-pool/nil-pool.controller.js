;(function() {
  'use strict';

  var _ = require('lodash')
    , validate = require('validate.js')
    , modUtils = require('../../../lib/mod-utils')
    , filters = require('../../../components/filters')
    , nilPoolCheck = require('../../../objects/nil-pool').nilPoolCheck
    , nilPoolCreate = require('../../../objects/nil-pool').nilPoolCreate
    , checkDayType = require('../check-day-type')
    , courtsList;

  // this simple middleware is to block users from accessing any branched of create-nil-pool via direct link
  // ie: visiting 'app.com/pool-management/nil-pool/change-attendance-date' directlyshould redirect them out
  module.exports.hasStartedNilPool = function(app) {
    return function(req, res, next) {
      if (typeof req.session.hasStartedNilPool === 'undefined'
        || !req.session.hasStartedNilPool) {
        return res.redirect(app.namedRoutes.build('pool-management.get'));
      }

      next();
    }
  }

  module.exports.index = function(app) {
    return function(req, res) {
      var suggestedDate
        , tmpErrors
        , attendanceTime;

      if (typeof req.session.poolDetails.attendanceDate === 'undefined') {
        suggestedDate = modUtils.buildSuggestedDate();
        req.session.poolDetails.attendanceDate = suggestedDate;
      }

      if (typeof req.session.tmpDate !== 'undefined') {
        req.session.poolDetails.attendanceDate = req.session.tmpDate;
      }

      attendanceTime =
        req.session.poolDetails.attendanceTime.hour
          + ':' + req.session.poolDetails.attendanceTime.minute;

      tmpErrors = _.cloneDeep(req.session.errors);
      delete req.session.errors;
      delete req.session.formFields;
      delete req.session.tmpDate;

      // we need to set some state to let the system know that the current user
      // has started a new process of create a nil pool
      req.session.hasStartedNilPool = true;

      return res.render('pool-management/nil-pool/index', {
        poolDetails: {
          courtName: req.session.poolDetails.courtName,
          courtCode: req.session.poolDetails.courtCode,
          attendanceDate: req.session.poolDetails.attendanceDate,
          attendanceTime: attendanceTime,
          poolType: req.session.poolDetails.poolType,
        },
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        }
      });
    };
  };

  module.exports.post = function(app) {
    return function(req, res) {
      var validatorResult
        , successCB = function(data) {

          app.logger.info('Checked if nil pool can be created: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: req.body,
            response: data,
          });

          if (data.deferrals > 0) {

            // still undecided if I should just render or redirect to another page 🤔
            return res.render('pool-management/nil-pool/has-deferrals', {
              deferrals: data.deferrals,
            })
          }

          // add the newly created pool number to the poolDetails
          req.session.poolDetails.poolNumber = data.poolNumber;
          req.session.poolDetails.poolType = req.body.poolType;

          // else redirect to check details page... to be implemented
          return res.redirect(app.namedRoutes.build('nil-pool.check-details.get'));
        }
        , errorCB = function(err) {

          app.logger.crit('Could not check if nil pool can be created: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: req.body,
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.redirect(app.namedRoutes.build('pool-management.get'));
        };

      validatorResult = validate(req.body, require('../../../config/validation/request-pool').poolType(req));
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('nil-pool.get'));
      }

      // clear any unnecessary session data
      delete req.session.errors;
      delete req.session.formFields;

      nilPoolCheck.post(require('request-promise'), app, req.session.authToken, req.body)
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.getChangeCourt = function(app) {
    return function(req, res) {
      var transformedCourtNames;

      courtsList = _.clone(req.session.courtsList);
      transformedCourtNames = modUtils.transformCourtNames(courtsList);

      return res.render('pool-management/_common/select-court', {
        pageTitle: 'Select a court for this pool',
        courts: transformedCourtNames,
        submitUrl: app.namedRoutes.build('nil-pool.change-court.post'),
        cancelUrl: app.namedRoutes.build('nil-pool.get'),
        pageIdentifier: 'Create a Nil Pool'
      });
    };
  };

  module.exports.postChangeCourt = function(app) {
    return function(req, res) {
      var validatorResult
        , successCB = function(result) {
          var attendanceTime = {
            hour: result.attendanceTime.split(':')[0],
            minute: result.attendanceTime.split(':')[1],
          };

          req.session.poolDetails = {
            courtName: result.locationName,
            courtCode: result.locationCode,
            attendanceTime: attendanceTime,
          };

          res.redirect(app.namedRoutes.build('nil-pool.get'));
        }
        , errorCB = function() {
          req.session.errors = {
            courtNameOrLocation: [{
              summary: 'Please check the court name or location',
              details: 'This court does not exist. Please enter a name or code of an existing court'
            }]
          };

          res.redirect(app.namedRoutes.build('nil-pool.change-court.get'));
        };

      validatorResult = validate(req.body, require('../../../config/validation/request-pool').courtNameOrLocation(req));
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('nil-pool.change-court.get'));
      }

      // reset session data
      delete req.session.errors;
      delete req.session.formFields;

      return modUtils.matchUserCourt(courtsList, req.body)
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.getChangeAttendanceDate = function(app) {
    return function(req, res) {
      var selectedAttendanceDate
        , tmpErrors;

      // if we post an invalid date and go back,
      // we then want to remove the tmpDate and show the old date
      delete req.session.tmpDate;

      selectedAttendanceDate = new Date(req.session.poolDetails.attendanceDate);

      // set temp and clear any unnecessary session data
      tmpErrors = req.session.errors;
      delete req.session.errors;
      delete req.session.formFields;

      return res.render('pool-management/_common/change-attendance-date', {
        attendanceDate: selectedAttendanceDate,
        submitUrl: 'nil-pool.change-attendance-date.post',
        cancelUrl: 'nil-pool.get',
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        }
      });
    };
  };

  module.exports.postChangeAttendanceDate = function(app) {
    return function(req, res) {
      var tmpBody = req.body
        , validatorResult;

      validatorResult = validate(req.body, require('../../../config/validation/request-pool.js').validateDate());
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('nil-pool.change-attendance-date.get'));
      }

      req.session.tmpDate = filters.dateFilter(tmpBody.attendanceDate, 'DD/MM/YYYY', 'YYYY-MM-DD');
      req.session.redirectedFrom = 'nil-pool.change-attendance-date.post';

      checkDayType(app)(req, res);
    };
  };

  module.exports.getInvalidDate = function(app) {
    return function(req, res) {
      var invalidDate = {};

      if (typeof req.session.invalidDate !== 'undefined') {
        invalidDate = req.session.invalidDate;
      } else {
        invalidDate = req.session.errors.invalidDate;
        invalidDate.redirectedFrom = 'nil-pool.change-attendance-date.post';
      }

      // cache for refreshing purposes and delete the errors to avoid leaking
      req.session.invalidDate = invalidDate;
      delete req.session.errors;

      res.render('pool-management/_common/invalid-date', {
        invalidDate: invalidDate,
      });
    };
  };

  module.exports.getCheckNilPoolDetails = function(app) {
    return function(req, res) {
      var tmpBody = _.clone(req.session.poolDetails);

      tmpBody.attendanceTime =
        req.session.poolDetails.attendanceTime.hour
          + ':' + req.session.poolDetails.attendanceTime.minute;

      res.render('pool-management/nil-pool/check-details', {
        poolDetails: tmpBody,
      });
    };
  };

  module.exports.postCheckNilPoolDetails = function(app) {
    return function(req, res) {
      var successCB = function() {

          app.logger.info('Created a new nil pool: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: req.body,
          });

          return res.redirect(app.namedRoutes.build('pool-management.get'));
        }
        , errorCB = function(err) {

          app.logger.crit('Could not create nil pool: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: req.body,
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.redirect(app.namedRoutes.build('pool-management.get'));
        };

      nilPoolCreate.post(require('request-promise'), app, req.session.authToken, req.body)
        .then(successCB)
        .catch(errorCB);
    };
  };

})();
