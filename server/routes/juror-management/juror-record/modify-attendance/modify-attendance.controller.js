(function() {
  'use strict';

  const _ = require('lodash');
  const { convert12to24 } = require('../../../../components/filters');
  const validate = require('validate.js');
  const modifyAttendanceValidator = require('../../../../config/validation/modify-jurors-attendance');
  const attendanceTimeValidator = require('../../../../config/validation/add-attendance').attendanceTime;
  const { makeManualError, padTimeForApi, mapCamelToSnake } = require('../../../../lib/mod-utils');
  const { modifyJurorAttendance } = require('../../../../objects');

  module.exports.getModifyAttendance = function(app) {
    return async function(req, res) {
      const tmpErrors = _.clone(req.session.errors);
      const tmpBody = _.clone(req.session.formFields);
      const { jurorNumber, poolNumber } = req.params;
      const attendanceDate = req.query.date;

      delete req.session.errors;
      delete req.session.formFields;

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

      return res.render('juror-management/juror-record/change-attendance', {
        jurorName,
        attendanceDate,
        deleteUrl: app.namedRoutes.build('juror-record.attendance.delete-juror-attendance.get', {
          jurorNumber,
          poolNumber,
        }) + `?date=${attendanceDate}`,
        processUrl: app.namedRoutes.build('juror-record.attendance.modify-juror-attendance.post', {
          jurorNumber,
          poolNumber,
        }) + `?date=${attendanceDate}`,
        cancelUrl: app.namedRoutes.build('juror-record.attendance.get', {
          jurorNumber,
        }),
        tmpBody,
        errors: {
          title: 'There is a problem',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });

    };
  };

  module.exports.postModifyAttendance = function(app) {
    return async function(req, res) {
      const { jurorNumber, poolNumber } = req.params;
      const attendanceDate = req.query.date;
      const errorUrl = app.namedRoutes.build('juror-record.attendance.modify-juror-attendance.get', {
        jurorNumber,
        poolNumber,
      }) + `?date=${attendanceDate}`;
      const validationRedirect = function(validatorResult) {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;
        return res.redirect(errorUrl);
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

      let validatorResult = validate(req.body, modifyAttendanceValidator.modifyAttendanceType());

      if (typeof validatorResult !== 'undefined') {
        return validationRedirect(validatorResult);
      }

      if (req.body.attendanceType === 'ATTENDANCE') {
        validatorResult = validate(req.body, attendanceTimeValidator());
      }

      if (typeof validatorResult !== 'undefined') {
        return validationRedirect(validatorResult);
      }

      const payload = {
        'jurorNumber': jurorNumber,
        'poolNumber': poolNumber,
        'attendanceDate': attendanceDate,
        'modifyAttendanceType': req.body.attendanceType,
      };

      if (req.body.attendanceType === 'ATTENDANCE') {
        const checkInTime = padTimeForApi(
          convert12to24(
            `${req.body.checkInTimeHour}
            :${req.body.checkInTimeMinute}
            ${req.body.checkInTimePeriod}`
          )
        );
        const checkOutTime = padTimeForApi(
          convert12to24(
            `${req.body.checkOutTimeHour}
            :${req.body.checkOutTimeMinute}
            ${req.body.checkOutTimePeriod}`
          )
        );

        payload.checkInTime = checkInTime;
        payload.checkOutTime = checkOutTime;
      }

      sendUpdateRequest(app, req, res, payload);
    };
  };

  module.exports.getDeleteAttendance = function(app) {
    return async function(req, res) {
      const { jurorNumber, poolNumber } = req.params;
      const attendanceDate = req.query.date;
      const payload = {
        'jurorNumber': jurorNumber,
        'poolNumber': poolNumber,
        'attendanceDate': attendanceDate,
        'modifyAttendanceType': 'DELETE',
      };

      sendUpdateRequest(app, req, res, payload);
    };
  };

  async function sendUpdateRequest(app, req, res, payload) {
    const { jurorNumber, poolNumber } = req.params;
    const attendanceDate = req.query.date;

    try {
      await modifyJurorAttendance.patch(req, mapCamelToSnake(payload));

      app.logger.info('Updated attendance date: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        data: payload,
      });

      return res.redirect(app.namedRoutes.build('juror-record.attendance.get', {
        jurorNumber,
      }));
    } catch (err) {
      app.logger.crit('Could not update attendance date: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        data: req.body,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      if (err.statusCode === 422){
        req.session.errors =
          makeManualError('', err.error.message);
      } else  {
        req.session.errors =
          makeManualError('', 'Something went wrong when trying to modify the juror\'s attendance');
      }

      return res.redirect(app.namedRoutes.build('juror-record.attendance.modify-juror-attendance.get', {
        jurorNumber,
        poolNumber,
      }) + `?date=${attendanceDate}`);
    };
  }

})();
