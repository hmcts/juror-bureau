(function() {
  'use strict';

  const { addSmartcardSpend } = require('../../../../objects/expense-record');
  const smartcardSpendValidator = require('../../../../config/validation/add-smartcard-spend');
  const validate = require('validate.js');

  module.exports.getAddSmartcardSpend = function(app) {
    return function(req, res) {
      const { jurorNumber, locCode } = req.params;
      const { dates } = req.query;
      const tmpErrors = req.session.errors;
      const tmpData = req.session.formFields;

      delete req.session.errors;
      delete req.session.formFields;

      const postUrl = app.namedRoutes.build(
        'juror-management.unpaid-attendance.expense-record.add-smartcard-spend.post', {
          jurorNumber,
          locCode,
        }
      );
      const cancelUrl = app.namedRoutes.build(
        'juror-management.unpaid-attendance.expense-record.get', {
          jurorNumber,
          locCode,
          status: 'draft',
        }
      );

      return res.render('juror-management/expense-record/add-smartcard-spend.njk', {
        postUrl,
        cancelUrl,
        dates: dates.split(','),
        tmpData,
        errors: {
          title: '',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postAddSmartcardSpend = function(app) {
    return async function(req, res) {
      const { jurorNumber, locCode } = req.params;
      const { attendanceDates, smartcardAmount } = req.body;

      const validatorResult = validate(req.body, smartcardSpendValidator());

      if (validatorResult) {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build(
          'juror-management.unpaid-attendance.expense-record.add-smartcard-spend.get', {
            jurorNumber,
            locCode,
          },
        ) + `?dates=${attendanceDates}`);
      }

      const body = {
        dates: attendanceDates.split(','),
        'smart_card_amount': smartcardAmount,
      };

      try {
        await addSmartcardSpend.patch(app, req, locCode, jurorNumber, body);

        app.logger.info('Successfully updated the smartcard amount for all selected days', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: body,
        });

        return res.redirect(app.namedRoutes.build(
          'juror-management.unpaid-attendance.expense-record.get', {
            jurorNumber,
            locCode,
            status: 'draft',
          }
        ));
      } catch (err) {
        app.logger.crit('Failed to update the smart card amount for all selected days', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: body,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        req.session.errors = {
          smartcardAmount: [{
            summary: err.error.message,
            details: err.error.message,
          }],
        };

        return res.redirect(app.namedRoutes.build(
          'juror-management.unpaid-attendance.expense-record.add-smartcard-spend.get', {
            jurorNumber,
            locCode,
          },
        ) + `?dates=${attendanceDates}`);
      }
    };
  };

})();
