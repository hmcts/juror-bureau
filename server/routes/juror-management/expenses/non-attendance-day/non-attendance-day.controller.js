const { makeManualError } = require('../../../../lib/mod-utils');

(function() {
  'use strict';

  const _ = require('lodash')
    , validate = require('validate.js')
    , nonAttendanceDayValidator = require('../../../../config/validation/non-attendance-day')
    , { jurorNonAttendanceDao } = require('../../../../objects/juror-attendance')
    , { dateFilter } = require('../../../../components/filters');

  module.exports.getNonAttendanceDay = (app) => {
    return function(req, res) {
      const tmpErrors = _.clone(req.session.errors);
      const tmpFields = _.clone(req.session.formFields);
      const { jurorNumber, poolNumber } = req.params;
      const { status } = req.query;
      const locCode = req.session.authentication.locCode;
      let cancelUrl;
      let postUrl;

      if (req.url.includes('record')) {
        postUrl = app.namedRoutes.build('juror-record.attendance.non-attendance-day.post', {
          jurorNumber,
          poolNumber,
        });
        cancelUrl = app.namedRoutes.build('juror-record.attendance.get', { jurorNumber });
        if (req.session.jurorCommonDetails) {
          if (jurorNumber != req.session.jurorCommonDetails?.jurorNumber) {
            app.logger.crit('Juror number does not match cached data', {
              auth: req.session.authentication,
              jwt: req.session.authToken,
              data: {
                jurorNumber: {
                  url: jurorNumber,
                  cached: req.session.jurorCommonDetails.jurorNumber,
                },
              },
            });
            return res.render('_errors/data-mismatch');
          }
        }
      } else if (req.url.includes('trial-management')) {
        postUrl = app.namedRoutes.build('trial-management.trials.add-non-attendance-day.post', {
          trialNumber: req.params.trialNumber,
          locationCode: req.params.locationCode,
        });
        cancelUrl = app.namedRoutes.build('trial-management.trials.detail.get', {
          trialNumber: req.params.trialNumber,
          locationCode: req.params.locationCode,
        });
      } else {
        cancelUrl = app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.get', {
          jurorNumber,
          locCode,
          status: status || 'draft',
        });
        postUrl = app.namedRoutes.build('juror-management.non-attendance-day.post', {
          jurorNumber,
          poolNumber,
        }) + `?status=${status || 'draft'}`;
      }

      delete req.session.errors;
      delete req.session.formFields;

      return res.render('juror-management/non-attendance-day.njk', {
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
    return async function(req, res) {
      const { jurorNumber, poolNumber, trialNumber } = req.params;
      const { status } = req.query;
      const locCode = req.params.locationCode || req.session.authentication.locCode;
      let errorUrl;
      let successUrl;

      const validatorResult = validate(req.body, nonAttendanceDayValidator());

      if (req.url.includes('record')) {
        errorUrl = app.namedRoutes.build('juror-record.attendance.non-attendance-day.get', {
          jurorNumber, poolNumber,
        });
        successUrl = app.namedRoutes.build('juror-record.attendance.get', { jurorNumber });
      } else if (req.url.includes('trial-management')) {
        errorUrl = app.namedRoutes.build('trial-management.trials.add-non-attendance-day.get', {
          trialNumber,
          locationCode: locCode,
        });
        successUrl = app.namedRoutes.build('trial-management.trials.detail.get', {
          trialNumber,
          locationCode: locCode,
        });
      } else {
        errorUrl = app.namedRoutes.build('juror-management.non-attendance-day.get', {
          jurorNumber, poolNumber,
        });
        successUrl = app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.get', {
          jurorNumber, locCode, status: 'draft',
        });
      }

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(errorUrl);
      }

      try {

        const payload = {
          'location_code': locCode,
          'non_attendance_date': dateFilter(
            req.body.nonAttendanceDay.split('/').map(d => d.padStart(2, '0')).join('/'), 'DD/MM/YYYY', 'YYYY-MM-DD',
          ),
        };

        if (req.url.includes('trial-management')) {
          payload.juror_numbers = req.session[`${trialNumber}-${locCode}-nonAttendanceDay`]?.selectedJurors;
          payload.trial_number = trialNumber;
        } else {
          payload.juror_number = jurorNumber;
          payload.pool_number = poolNumber;
        }

        // await jurorNonAttendanceDao.post(req, payload);

        if (status && status !== 'draft') {
          // We do not need to add the non-attendance date to the dates list
          // because it will always be draft to start with
          // req.session.editApprovalDates.push(payload.non_attendance_date);

          return res.redirect(app.namedRoutes.build('juror-management.edit-expense.get', {
            jurorNumber,
            locCode,
            status,
          }));
        }

        if (req.url.includes('trial-management')) {
          req.session.bannerMessage = 'Non-attendance day added';
          delete req.session[`${trialNumber}-${locCode}-nonAttendanceDay`];
        }

        return res.redirect(successUrl);
      } catch (err) {
        app.logger.crit('Failed to add a non-attendance day for juror', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        if (err.statusCode === 422) {
          if (err.error.code === 'ATTENDANCE_RECORD_ALREADY_EXISTS') {
            req.session.errors = makeManualError(
              'nonAttendanceDay',
              'You cannot mark this date as a non-attendance day' 
              + ' because it\'s already been recorded as an attendance day.'
            );
          } else if (err.error.code === 'APPEARANCE_RECORD_BEFORE_SERVICE_START_DATE') {
            req.session.errors = makeManualError(
              'nonAttendanceDay',
              'Non-attendance date cannot be before the juror\'s service start date.'
            );
          } else if (err.error.code === 'INVALID_JUROR_POOL_LOCATION') {
            req.session.errors = makeManualError(
              'nonAttendanceDay',
              'This juror belongs to either the primary or satellite court in your area.'
              + ' You must add the attendance for the court location.'
              + ' Please log back in as the correct court to add this attendance'
            );
          } else {
            req.session.errors = makeManualError('nonAttendanceDay', err.error.message ? err.error.message : 'Could not add non-attendance date');
          }

          req.session.formFields = req.body;

          return res.redirect(errorUrl);
        }

        return res.render('_errors/generic', { err });
      };
    };
  };

})();
