(function() {
  'use strict';

  const _ = require('lodash')
    , { dateFilter } = require('../../../../components/filters')
    , validate = require('validate.js')
    , changeAttendanceValidator = require('../../../../config/validation/change-jurors-attendance')
    , attendanceTimeValidator = require('../../../../config/validation/add-attendance').attendanceTime;

  module.exports.getChangeAttendance = function(app) {
    return async function(req, res) {

      const tmpErrors = _.clone(req.session.errors)
        , tmpBody = _.clone(req.session.formFields)
        , { jurorNumber } = req.params;

      delete req.session.errors;
      delete req.session.formFields;

      const juror = {
        jurorNumber: req.params.jurorNumber,
        onCall: req.session.jurorCommonDetails.onCall,
      };
      let cancelUrl = app.namedRoutes.build('juror-record.attendance.get', {
        jurorNumber,
      });
      const jurorName = req.session.jurorNameChangeAttendance;

      if (jurorNumber !== req.session.jurorCommonDetails.jurorNumber) {

        app.logger.crit('The juror number was tampered with: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            jurorNumber: {
              url: jurorNumber,
              cached: req.session.jurorCommonDetails.jurorNumber,
            },
          },
        });

        return res.render('_errors/generic');
      }

      try {

        return res.render('juror-management/juror-record/change-attendance', {
          juror,
          jurorName,
          cancelUrl,
          tmpBody,
          errors: {
            title: 'There is a problem',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          },
        });
      } catch (err) {
        if (err.statusCode === 404) {
          return res.render('juror-management/_errors/not-found');
        }

        app.logger.crit('Failed to fetch the juror attendance data:', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            jurorNumber,
            locationCode: req.session.locCode,
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic');
      };
    };
  };

  module.exports.postChangeAttendance = function(app) {
    return function(req, res) {
      const jurorNumber = req.params.jurorNumber;
      var successCB = function() {

          app.logger.info('Updated attendance date: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: req.body,
          });

          return res.redirect(app.namedRoutes.build('juror-record.attendance.get', { jurorNumber: jurorNumber }));
        }
        , errorCB = function(err) {

          app.logger.crit('Could not update attendance date: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: req.body,
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.redirect(app.namedRoutes.build('juror-record.attendance.get', { jurorNumber: jurorNumber }));
        };

      if (jurorNumber !== req.session.jurorCommonDetails.jurorNumber
        && req.body.jurorNumber !== req.session.jurorCommonDetails.jurorNumber) {

        app.logger.crit('The juror number was tampered with: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            jurorNumber: {
              url: jurorNumber,
              body: req.body.jurorNumber,
              cached: req.session.jurorCommonDetails.jurorNumber,
            },
          },
        });

        return res.render('_errors/generic');
      }

      let validatorResult = validate(req.body, changeAttendanceValidator.changeAttendanceType());

      if (req.body.processActionType === 'attendance') {
        validatorResult = validate(req.body, attendanceTimeValidator());
      }

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;
        return res.redirect(
          app.namedRoutes.build('juror-record.attendance.change-attendance-date.get', { jurorNumber: jurorNumber })
        );
      }

      const payload = {
        jurorNumber,
        'next_date': req.body.attendanceDate !== '' ? dateFilter(req.body.attendanceDate, null, 'YYYY-MM-DD') : '',
        'on_call': req.body.onCall || false,
      };

      return jurorRecordObject.changeDate.patch(
        require('request-promise'),
        app,
        req.session.authToken,
        payload,
      )
        .then(successCB)
        .catch(errorCB);
    };
  };

})();



