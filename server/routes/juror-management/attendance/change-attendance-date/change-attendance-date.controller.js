(function() {
  'use strict';

  const _ = require('lodash')
    , { dateFilter } = require('../../../../components/filters')
    , validate = require('validate.js')
    , jurorRecordObject = require('../../../../objects/juror-record')
    , attendanceDateValidator = require('../../../../config/validation/change-attendance-date').attendanceDate;

  module.exports.getChangeAttendanceDate = function(app) {
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

        const attendance = await jurorRecordObject.attendanceDetails.get(
          req,
          jurorNumber,
        );

        return res.render('juror-management/attendance/change-attendance-date', {
          processUrl: app.namedRoutes.build(
            'juror-record.attendance.change-attendance-date.post',
            { jurorNumber: juror.jurorNumber }
          ),
          cancelUrl: app.namedRoutes.build('juror-record.attendance.get', { jurorNumber: juror.jurorNumber }),
          juror,
          minDate: dateFilter(attendance.nextDate ?? new Date(), null, 'DD/MM/YYYY'),
          errors: {
            title: 'Please check the form',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          },
          formDetails: tmpBody,
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

  module.exports.postChangeAttendanceDate = function(app) {
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

      let validatorResult;

      validatorResult = validate(req.body, attendanceDateValidator({ onCall: req.session.jurorCommonDetails.onCall }));

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;
        return res.redirect(
          app.namedRoutes.build('juror-record.attendance.change-attendance-date.get', { jurorNumber: jurorNumber })
        );
      }

      const payload = {
        'jurorNumbers': [jurorNumber],
        'nextDate': req.body.attendanceDate !== '' ? dateFilter(req.body.attendanceDate, null, 'YYYY-MM-DD') : '',
        'onCall': req.body.onCall || false,
      };

      return jurorRecordObject.changeDate.patch(
        req,
        payload,
      )
        .then(successCB)
        .catch(errorCB);
    };
  };

})();



