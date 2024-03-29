const _ = require('lodash');
const validate = require('validate.js');
const nonAttendanceDayValidator = require('../../../../config/validation/non-attendance-day');
const { jurorNonAttendanceDao } = require('../../../../objects/juror-attendance');
const { dateFilter } = require('../../../../components/filters');

module.exports.getNonAttendanceDay = (app) => {
  return function (req, res) {
    const tmpErrors = _.clone(req.session.errors);
    const tmpFields = _.clone(req.session.formFields);
    const { jurorNumber, poolNumber } = req.params;
    const { status } = req.query;

    let cancelUrl = app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.get', {
      jurorNumber,
      poolNumber,
      status: status || 'draft',
    });
    let postUrl = app.namedRoutes.build('juror-management.non-attendance-day.post', {
      jurorNumber,
      poolNumber,
    }) + `?status=${status || 'draft'}`;

    if (req.url.includes('record')) {
      postUrl = app.namedRoutes.build('juror-record.attendance.non-attendance-day.post', {
        jurorNumber,
        poolNumber,
      });
      cancelUrl = app.namedRoutes.build('juror-record.attendance.get', { jurorNumber });
    }

    delete req.session.errors;
    delete req.session.formFields;

    return res.render('juror-management/non-attendance-day.njk', {
      jurorNumber,
      poolNumber,
      postUrl,
      cancelUrl,
      errors: {
        title: 'There is a problem',
        count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
        items: tmpErrors,
      },
      tmpFields,
    });
  };
};

module.exports.postNonAttendanceDay = (app) => {
  return async function (req, res) {
    const { jurorNumber, poolNumber } = req.params;
    const { status } = req.query;

    const validatorResult = validate(req.body, nonAttendanceDayValidator());
    let errorUrl = app.namedRoutes.build('juror-management.non-attendance-day.get', {
      jurorNumber, poolNumber,
    });
    let successUrl = app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.get', {
      jurorNumber, poolNumber, status: 'draft',
    });

    if (req.url.includes('record')) {
      errorUrl = app.namedRoutes.build('juror-record.attendance.non-attendance-day.get', {
        jurorNumber, poolNumber,
      });
      successUrl = app.namedRoutes.build('juror-record.attendance.get', { jurorNumber });
    }

    if (typeof validatorResult !== 'undefined') {
      req.session.errors = validatorResult;
      req.session.formFields = req.body;

      return res.redirect(errorUrl);
    }

    try {
      const payload = {
        'juror_number': jurorNumber,
        'location_code': req.session.authentication.owner,
        'pool_number': poolNumber,
        'non_attendance_date': dateFilter(
          req.body.nonAttendanceDay.split('/').map(d => d.padStart(2, '0')).join('/'), 'DD/MM/YYYY', 'YYYY-MM-DD',
        ),
      };

      await jurorNonAttendanceDao.post(app, req, payload);

      if (status && status !== 'draft') {
        // We do not need to add the non-attendance date to the dates list
        // because it will always be draft to start with
        // req.session.editApprovalDates.push(payload.non_attendance_date);

        return res.redirect(app.namedRoutes.build('juror-management.edit-expense.get', {
          jurorNumber,
          poolNumber,
          status,
        }));
      }

      return res.redirect(successUrl);
    } catch (err) {
      if (err.statusCode === 422 && err.error.code === 'ATTENDANCE_RECORD_ALREADY_EXISTS') {
        req.session.errors = {
          nonAttendanceDay: [{
            summary: 'You cannot mark this date as a non-attendance day'
              + ' because it\'s already been recorded as an attendance day.',
            details: 'You cannot mark this date as a non-attendance day'
              + ' because it\'s already been recorded as an attendance day.',
          }],
        };
        req.session.formFields = req.body;

        return res.redirect(errorUrl);
      }
      if (err.statusCode === 422 && err.error.code === 'APPEARANCE_RECORD_BEFORE_SERVICE_START_DATE') {
        req.session.errors = {
          nonAttendanceDay: [{
            summary: 'Non-attendance date cannot be before the juror’s service start date.',
            details: 'Non-attendance date cannot be before the juror’s service start date.',
          }],
        };
        req.session.formFields = req.body;

        return res.redirect(errorUrl);
      }

      app.logger.crit('Failed to add a non-attendance day for juror', {
        auth: req.session.authentication,
        token: req.session.authToken,
        error: typeof err.error !== 'undefined' ? err.error : err.toString(),
      });

      return res.render('_errors/generic.njk');
    };
  };
};
