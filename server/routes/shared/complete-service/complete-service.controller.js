(() => {
  'use strict';

  const _ = require('lodash');
  const { validate } = require('validate.js');
  const completeServiceValidator = require('../../../config/validation/complete-service');
  const { completeService } = require('../../../objects/complete-service');
  const { makeDate, dateFilter, capitalizeFully } = require('../../../components/filters');
  const { record } = require('../../../objects/juror-record');


  module.exports.getCompleteServiceConfirm = (app) => async(req, res) => {
    const tmpErrors = _.cloneDeep(req.session.errors);
    const tmpFields = _.cloneDeep(req.session.formFields) || {};
    let cancelUrl;
    let submitUrl;
    let minCompletionDate;
    let juror;

    delete req.session.errors;
    delete req.session.formField;

    if (typeof req.params.poolNumber !== 'undefined') {
      cancelUrl = app.namedRoutes.build('pool-overview.get', {
        poolNumber: req.params.poolNumber,
      });
      submitUrl = app.namedRoutes.build('pool-overview.complete-service.confirm.post', {
        poolNumber: req.params.poolNumber,
      });
    } else if (typeof req.params.jurorNumber !== 'undefined') {
      req.session.selectedJurors = req.params.jurorNumber;

      if (!req.session.jurorCommonDetails) {
        req.session.jurorCommonDetails = (await record.get(
          require('request-promise'),
          app,
          req.session.authToken,
          'detail',
          req.params['jurorNumber'],
          req.session.locCode,
        )).data.commonDetails;
      }

      const { startDate } = req.session.jurorCommonDetails;

      minCompletionDate = dateFilter(makeDate(startDate), null, 'DD/MM/YYYY');

      if (req.url.includes('reporting')) {
        cancelUrl = app.namedRoutes.build('reports.incomplete-service.report.get', { filter: req.session.reportSearch });
        submitUrl = app.namedRoutes.build('reports.incomplete-service.complete.post', {
          jurorNumber: req.params.jurorNumber,
        }) + `${req.session.completeServiceLastDate ? `?lastAttendanceDate=${req.session.completeServiceLastDate}` : ''}`;
        juror = {
          name: capitalizeFully(`${req.session.jurorCommonDetails.title} ${req.session.jurorCommonDetails.firstName} ${req.session.jurorCommonDetails.lastName}`),
          jurorNumber: req.params.jurorNumber,
          lastAttendanceDate: req.session.completeServiceLastDate ? dateFilter(req.session.completeServiceLastDate, 'YYYY-mm-dd', 'dddd D MMM YYYY') : '-',
        };
      } else {
        cancelUrl = app.namedRoutes.build('juror.update.get', {
          jurorNumber: req.params.jurorNumber,
        });
        submitUrl = app.namedRoutes.build('juror.update.complete-service.post', {
          jurorNumber: req.params.jurorNumber,
        });
      }
    }

    const today = new Date();
    const maxCompletionDate = dateFilter(today.setFullYear(today.getFullYear() + 1), null, 'DD/MM/YYYY');
    const defaultCompletionDate = tmpFields.completionDate || dateFilter(new Date(), null, 'DD/MM/YYYY');


    return res.render('shared/complete-service/complete-service-confirm.njk', {
      submitUrl,
      cancelUrl,
      defaultCompletionDate,
      minCompletionDate,
      maxCompletionDate,
      juror,
      errors: {
        message: '',
        count:
          typeof tmpErrors !== 'undefined'
            ? Object.keys(tmpErrors).length
            : 0,
        items: tmpErrors,
      },
    });
  };

  module.exports.postCompleteServiceConfirm = (app) => (req, res) => {
    if (!Array.isArray(req.session.selectedJurors)) {
      req.body.selectedJurors = [req.session.selectedJurors];
    } else {
      req.body.selectedJurors = req.session.selectedJurors;
    }

    // If we single transfer, we can FE validate startDate.
    req.body.jurorDates =
      typeof req.params.jurorNumber !== 'undefined'
        ? [req.session.jurorCommonDetails.startDate]
        : [];

    const validatorResult = validate(req.body, completeServiceValidator());
    let failValidationUrl, successUrl, errorUrl;

    if (typeof req.params.poolNumber !== 'undefined') {
      failValidationUrl = app.namedRoutes.build('pool-overview.complete-service.confirm.get', {
        poolNumber: req.params.poolNumber,
      });
      successUrl = app.namedRoutes.build('pool-overview.get', {
        poolNumber: req.params.poolNumber,
      });
      errorUrl = app.namedRoutes.build('pool-overview.get', {
        poolNumber: req.params.poolNumber,
      });
    } else if (typeof req.params.jurorNumber !== 'undefined') {
      if (req.url.includes('reporting')) {
        failValidationUrl = app.namedRoutes.build('reports.incomplete-service.complete.get', {
          jurorNumber: req.params.jurorNumber,
        }) + `${req.session.completeServiceLastDate ? `?lastAttendanceDate=${req.session.completeServiceLastDate}` : ''}`;
        successUrl = app.namedRoutes.build('reports.incomplete-service.report.get', {
          filter: req.session.reportSearch,
        });
        errorUrl = app.namedRoutes.build('reports.incomplete-service.complete.get', {
          jurorNumber: req.params.jurorNumber,
        }) + `${req.session.completeServiceLastDate ? `?lastAttendanceDate=${req.session.completeServiceLastDate}` : ''}`;
      } else {
        failValidationUrl = app.namedRoutes.build('juror.update.complete-service.get', {
          jurorNumber: req.params.jurorNumber,
        });
        // TODO: remove query param once backend implemented, to show data as designed
        successUrl = app.namedRoutes.build('juror-record.overview.get', {
          jurorNumber: req.params.jurorNumber,
        }) + '?serviceAttributes=true';
        errorUrl = app.namedRoutes.build('juror.update.complete-service.get', {
          jurorNumber: req.params.jurorNumber,
        });
      }
    }

    if (typeof validatorResult !== 'undefined') {
      req.session.errors = validatorResult;
      req.session.formFields = req.body;

      return res.redirect(failValidationUrl);
    }

    completeService.patch(app, req.session.authToken, {
      pool: req.params.poolNumber || req.session.jurorCommonDetails.poolNumber,
      completionDate: req.body.completionDate,
      selectedJurors: req.body.selectedJurors,
    }).then(() => {
      req.session.bannerMessage =
        typeof req.params.jurorNumber !== 'undefined'
          ? 'Juror\'s service completed'
          // eslint-disable-next-line max-len
          : `Service completed for ${req.body.selectedJurors.length} ${jurorSuffix('juror', req.body.selectedJurors.length)}`;

      delete req.session.selectedJurors;
      delete req.session.completeServiceLastDate;

      return res.redirect(successUrl);
    }, (err) => {
      app.logger.crit('Failed to complete juror(s) service: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        data: {
          pool: req.params.poolNumber || req.session.jurorCommonDetails.poolNumber,
          completionDate: req.body.completionDate,
          selectedJurors: req.body.selectedJurors,
        },
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      if (err.statusCode === 422) {

        req.session.errors = {
          completionDate: [{
            details: err.error.message,
          }],
        };

        return res.redirect(errorUrl);
      }

      return res.render('_errors/generic');
    });
  };

  function jurorSuffix(word, length) {
    return word + (length > 1 ? 's' : '');
  }

})();
