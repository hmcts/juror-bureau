(function() {
  'use strict';

  const _ = require('lodash');
  const validate = require('validate.js');
  const nonAttendanceDayValidator = require('../../../../config/validation/non-attendance-day');
  const { jurorNonAttendanceDao, bulkJurorNonAttendanceDao } = require('../../../../objects/juror-attendance');
  const { dateFilter } = require('../../../../components/filters');
  const { makeManualError } = require('../../../../lib/mod-utils');
  const { jurorRecordDetailsDAO } = require('../../../../objects/juror-record');

  module.exports.getNonAttendanceDay = (app) => {
    return function(req, res) {
      const tmpErrors = _.clone(req.session.errors);
      const tmpFields = _.clone(req.session.formFields);
      const { jurorNumber, poolNumber, trialNumber } = req.params;
      const { status } = req.query;
      const locCode = req.params.locationCode || req.session.authentication.locCode;

      const { postUrl, cancelUrl } = buildUrls(app, req, { jurorNumber, poolNumber, trialNumber, locCode, status });

      if (req.url.includes('record') && req.session.jurorCommonDetails) {
        if ((jurorNumber != req.session.jurorCommonDetails?.jurorNumber) ||
            (poolNumber != req.session.jurorCommonDetails?.poolNumber)) {
          app.logger.crit('Juror number / pool number does not match cached data', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: {
                url: jurorNumber,
                cached: req.session.jurorCommonDetails.jurorNumber,
              },
              poolNumber: {
                url: poolNumber,
                cached: req.session.jurorCommonDetails.poolNumber,
              },
            },
          });
          return res.render('_errors/data-mismatch');
        }
      }

      delete req.session.errors;
      delete req.session.formFields;

      return res.render('juror-management/non-attendance-day.njk', {
        postUrl,
        cancelUrl,
        errors: {
          title: 'There is a problem',
          count: tmpErrors ? Object.keys(tmpErrors).length : 0,
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

      const { errorUrl, successUrl } = buildUrls(app, req, { jurorNumber, poolNumber, locCode, status });

      const validatorResult = validate(req.body, nonAttendanceDayValidator());
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;
        return res.redirect(errorUrl);
      }

      const payload = {
        'location_code': locCode,
        'non_attendance_date': formatNonAttendanceDate(req.body.nonAttendanceDay),
        'juror_number': jurorNumber,
        'pool_number': poolNumber,
      };

      try {
        await jurorNonAttendanceDao.post(req, payload);
      } catch (err) {
        return handleNonAttendanceError(app)(req, res, err, errorUrl, payload);
      }

      if (status && status !== 'draft') {
        return res.redirect(app.namedRoutes.build('juror-management.edit-expense.get', { jurorNumber, locCode, status }));
      }

      return res.redirect(successUrl);
    };
  };

  module.exports.postBulkNonAttendanceDay = (app) => {
    return async function(req, res) {
      const { poolNumber, trialNumber } = req.params;
      const locCode = req.params.locationCode || req.session.authentication.locCode;

      const { postUrl: errorUrl, cancelUrl: successUrl } = buildUrls(app, req, { poolNumber, trialNumber, locCode });

      const validatorResult = validate(req.body, nonAttendanceDayValidator());
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;
        return res.redirect(errorUrl);
      }

      const nonAttendanceDate = formatNonAttendanceDate(req.body.nonAttendanceDay);
      let nonAttendancePayload;

      if (req.url.includes('trial-management')) {
        // Juror pool numbers not stored in session for trials
        // Pool numbers may differ between jurors and are fetched from API
        try {
          const jurorNumbers = req.session[`${trialNumber}-${locCode}-nonAttendanceDay`]?.selectedJurors;
          const jurorDetailsPayload = jurorNumbers.map((jurorNumber) => ({
            'juror_number': jurorNumber,
            'juror_version': null,
            'include': ['ACTIVE_POOL'],
          }));
      
          let jurorDetails = await jurorRecordDetailsDAO.post(req, jurorDetailsPayload);
          delete jurorDetails['_headers'];
          jurorDetails = Object.values(jurorDetails);

          nonAttendancePayload = jurorDetails.map((juror) => ({
            'juror_number': juror.juror_number,
            'location_code': locCode,
            'non_attendance_date': nonAttendanceDate,
            'pool_number': juror.active_pool.pool_number,
          }));
        } catch (err) {
          app.logger.crit('Failed to get juror details', { auth: req.session.authentication, token: req.session.authToken, error: err.toString() });
          return res.render('_errors/generic', { err });
        }
      } else {
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
        return handleNonAttendanceError(app)(req, res, err, errorUrl, nonAttendancePayload, true);
      }
    };
  };

  const buildUrls = (app, req, params) => {
    const { jurorNumber, poolNumber, trialNumber, locCode, status } = params;

    if (req.url.includes('record')) {
      return {
        postUrl: app.namedRoutes.build('juror-record.attendance.non-attendance-day.post', { jurorNumber, poolNumber }),
        cancelUrl: app.namedRoutes.build('juror-record.attendance.get', { jurorNumber }),
        errorUrl: app.namedRoutes.build('juror-record.attendance.non-attendance-day.get', { jurorNumber, poolNumber }),
        successUrl: app.namedRoutes.build('juror-record.attendance.get', { jurorNumber }),
      };
    } else if (req.url.includes('trial-management')) {
      return {
        postUrl: app.namedRoutes.build('trial-management.trials.add-non-attendance-day.post', { trialNumber, locationCode: locCode }),
        cancelUrl: app.namedRoutes.build('trial-management.trials.detail.get', { trialNumber, locationCode: locCode }),
        errorUrl: app.namedRoutes.build('trial-management.trials.add-non-attendance-day.get', { trialNumber, locationCode: locCode }),
        successUrl: app.namedRoutes.build('trial-management.trials.detail.get', { trialNumber, locationCode: locCode }),
      };
    } else if (req.url.includes('pool-management')) {
      return {
        postUrl: app.namedRoutes.build('pool-management.add-non-attendance-day.post', { poolNumber }),
        cancelUrl: app.namedRoutes.build('pool-overview.get', { poolNumber }),
        errorUrl: app.namedRoutes.build('pool-management.add-non-attendance-day.get', { poolNumber }),
        successUrl: app.namedRoutes.build('pool-overview.get', { poolNumber }),
      };
    } else {
      return {
        postUrl: app.namedRoutes.build('juror-management.non-attendance-day.post', { jurorNumber, poolNumber }) + `?status=${status || 'draft'}`,
        cancelUrl: app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.get', { jurorNumber, locCode, status: status || 'draft' }),
        errorUrl: app.namedRoutes.build('juror-management.non-attendance-day.get', { jurorNumber, poolNumber }),
        successUrl: app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.get', { jurorNumber, locCode, status: 'draft' })
      };
    }
  };

  const formatNonAttendanceDate = (date) => {
    return dateFilter(date.split('/').map(d => d.padStart(2, '0')).join('/'), 'DD/MM/YYYY', 'YYYY-MM-DD');
  };

  const handleNonAttendanceError = (app) => {
    return function(req, res, err, errorUrl, payload, bulkRequest = false) {
      app.logger.crit('Failed to add a non-attendance day for juror(s)', {
        auth: req.session.authentication,
        token: req.session.authToken,
        data: payload,
        error: err.error ? err.error : err.toString(),
      });

      if (err.statusCode === 422) {
        const errorMessages = {
          'ATTENDANCE_RECORD_ALREADY_EXISTS': `You cannot mark this date as a non-attendance day because it\'s already been recorded as an attendance day ${bulkRequest ? 'for one or more selected jurors' : ''}.`,
          'APPEARANCE_RECORD_BEFORE_SERVICE_START_DATE': `Non-attendance date cannot be before ${bulkRequest ? 'one or more' : 'the'} juror\'s service start date.`,
          'INVALID_JUROR_POOL_LOCATION': `${bulkRequest ? 'One or more jurors belong' : 'This juror belongs'} to either the primary or satellite court in your area. You must add the attendance for the court location. Please log back in as the correct court to add this attendance.`,
          'INVALID_JUROR_STATUS': `You cannot mark this date as a non-attendance day because ${bulkRequest ? 'one or more jurors are' : 'the juror is'} in summoned status.`,
        };

        const errorMessage = errorMessages[err.error.code] || err.error.message || 'Could not add non-attendance date';
        req.session.errors = makeManualError('nonAttendanceDay', errorMessage);
        req.session.formFields = req.body;

        return res.redirect(errorUrl);
      }

      return res.render('_errors/generic', { err });
    };
  };

})();