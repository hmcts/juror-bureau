const { makeManualError } = require('../../../../lib/mod-utils');
const { jurorRecordDetailsDAO } = require('../../../../objects/juror-record');

(function() {
  'use strict';

  const _ = require('lodash')
    , validate = require('validate.js')
    , nonAttendanceDayValidator = require('../../../../config/validation/non-attendance-day')
    , { jurorNonAttendanceDao, bulkJurorNonAttendanceDao } = require('../../../../objects/juror-attendance')
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
      } else if (req.url.includes('pool-management')) {
        postUrl = app.namedRoutes.build('pool-management.add-non-attendance-day.post', {
          poolNumber,
        });
        cancelUrl = app.namedRoutes.build('pool-overview.get', {
          poolNumber,
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
      const { jurorNumber, poolNumber } = req.params;
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
          'juror_number': jurorNumber,
          'pool_number': poolNumber,
        };

        await jurorNonAttendanceDao.post(req, payload);

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

        return res.redirect(successUrl);
      } catch (err) {
        return handleNonAttendanceError(app)(req, res, err, errorUrl);
      }
    };
  };

  module.exports.postBulkNonAttendanceDay = (app) => {
    return async function(req, res) {
      const { poolNumber, trialNumber } = req.params;
      const locCode = req.params.locationCode || req.session.authentication.locCode;
      let errorUrl;
      let successUrl;
      let nonAttendancePayload;

      const nonAttendanceDate = dateFilter(
        req.body.nonAttendanceDay.split('/').map(d => d.padStart(2, '0')).join('/'), 'DD/MM/YYYY', 'YYYY-MM-DD',
      )

      const validatorResult = validate(req.body, nonAttendanceDayValidator());

      if (req.url.includes('trial-management')) {
        errorUrl = app.namedRoutes.build('trial-management.trials.add-non-attendance-day.get', {
          trialNumber,
          locationCode: locCode,
        });
        successUrl = app.namedRoutes.build('trial-management.trials.detail.get', {
          trialNumber,
          locationCode: locCode,
        });
      } else {
        errorUrl = app.namedRoutes.build('pool-management.add-non-attendance-day.get', {
          poolNumber,
        });
        successUrl = app.namedRoutes.build('pool-overview.get', {
          poolNumber,
        });
      }

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(errorUrl);
      }

      let jurorDetails;
      if (req.url.includes('trial-management')) {
        // Trial route - Jurors in session - pool number detials fetched from api
        try {
          const jurorNumbers = req.session[`${trialNumber}-${locCode}-nonAttendanceDay`]?.selectedJurors;
  
          const jurorDetailsPayload = jurorNumbers.map((jurorNumber) => ({
            'juror_number': jurorNumber,
            'juror_version': null,
            'include': ['ACTIVE_POOL'],
          }));
  
          jurorDetails = await jurorRecordDetailsDAO.post(
            req,
            jurorDetailsPayload,
          )
  
          delete jurorDetails['_headers']; 
          jurorDetails =  Object.values(jurorDetails)
            
        } catch (err) {
          app.logger.crit('Failed to get juror details', {
            auth: req.session.authentication,
            token: req.session.authToken,
            error: typeof err.error !== 'undefined' ? err.error : err.toString(),
          });
  
          return res.render('_errors/generic', { err });
        };

        nonAttendancePayload = jurorDetails.map((juror) => ({
          'juror_number': juror.juror_number,
          'location_code': locCode,
          'non_attendance_date': nonAttendanceDate,
          'pool_number': juror.active_pool.pool_number,
        }));
      } else {
        // Pool Management route - pool number in url and jurors in session
        const jurorNumbers = req.session[`${poolNumber}-nonAttendanceDay`]?.selectedJurors;
        nonAttendancePayload = jurorNumbers.map((jurorNumber) => ({
          'juror_number': jurorNumber,
          'location_code': locCode,
          'non_attendance_date': nonAttendanceDate,
          'pool_number': poolNumber,
        }));
      }

      try {
        await bulkJurorNonAttendanceDao.post(req, nonAttendancePayload);

        req.session.bannerMessage = 'Non-attendance day added';

        if (req.url.includes('trial-management')) {
          delete req.session[`${trialNumber}-${locCode}-nonAttendanceDay`];
        } else {
          delete req.session[`${poolNumber}-nonAttendanceDay`];
        }

        return res.redirect(successUrl);
      } catch (err) {
        return handleNonAttendanceError(app)(req, res, err, errorUrl, true);
      };
    };
  };

  const handleNonAttendanceError = (app) => {
    return function(req, res, err, errorUrl, bulkRequest = false) {
      app.logger.crit('Failed to add a non-attendance day for juror(s)', {
        auth: req.session.authentication,
        token: req.session.authToken,
        error: typeof err.error !== 'undefined' ? err.error : err.toString(),
      });

      if (err.statusCode === 422) {
        if (err.error.code === 'ATTENDANCE_RECORD_ALREADY_EXISTS') {
          req.session.errors = makeManualError(
            'nonAttendanceDay',
            'You cannot mark this date as a non-attendance day' 
            + ' because it\'s already been recorded as an attendance day'
            + `${bulkRequest ? ' for one or more of the selected jurors.' : '.'}`
          );
        } else if (err.error.code === 'APPEARANCE_RECORD_BEFORE_SERVICE_START_DATE') {
          req.session.errors = makeManualError(
            'nonAttendanceDay',
            'Non-attendance date cannot be before the juror\'s service start date'
            + `${bulkRequest ? ' for any of the selected jurors.' : '.'}`
          );
        } else if (err.error.code === 'INVALID_JUROR_POOL_LOCATION') {
          req.session.errors = makeManualError(
            'nonAttendanceDay',
            'This juror belongs to either the primary or satellite court in your area.'
            + ' You must add the attendance for the court location.'
            + ' Please log back in as the correct court to add this attendance'
            + `${bulkRequest ? ' for the selected jurors.' : '.'}`
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

})();
