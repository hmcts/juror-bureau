(function() {
  'use strict';

  const _ = require('lodash')
    , validate = require('validate.js')
    , { jurorBankDetailsDAO } = require('../../../../objects/expenses')
    , bankDetailsValidator = require('../../../../config/validation/bank-details');

  module.exports.getBankDetails = (app) => {
    return async function(req, res) {
      const tmpErrors = _.cloneDeep(req.session.errors);
      const tmpBody = _.cloneDeep(req.session.tmpBody);
      const { jurorNumber, locCode } = req.params;
      let { status } = req.query;

      if (req.session.jurorCommonDetails && req.url.includes('record')) {
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

      if (status !== 'for-approval' && status !== 'approved' && status !== 'for-reapproval') {
        status = 'draft';
      }

      const routePrefix = req.url.includes('record') ? 'juror-record' : 'juror-management';
      const processUrl = app.namedRoutes.build(`${routePrefix}.bank-details.post`, {
        jurorNumber,
        locCode,
      }) + (status ? `?status=${status}` : '');
      const addNotesUrl = app.namedRoutes.build(`${routePrefix}.bank-details.notes-edit.get`, {
        jurorNumber,
        locCode,
      }) + (status ? `?status=${status}` : '');
      const changeAddressUrl = app.namedRoutes.build(`${routePrefix}.bank-details.address.get`, {
        jurorNumber,
        locCode,
      });
      const cancelUrl = req.url.includes('record')
        ? app.namedRoutes.build('juror-record.expenses.get', { jurorNumber })
        : app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.get', {
          jurorNumber,
          locCode,
          status: status ? status : 'draft',
        });

      const { response: data, headers } = await jurorBankDetailsDAO.get(req, jurorNumber);

      app.logger.info('Fetch juror\'s bank details:  ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        data: data,
      });

      const juror = _.mapKeys(data, (__, key) => _.camelCase(key));

      req.session.bankDetails = {};
      req.session.bankDetails.etag = headers.etag;
      req.session.bankDetails.originalDetails = juror;

      juror.anonymisedAccountNumber = juror.bankAccountNumber ? '########' : '';
      juror.anonymisedSortCode = juror.sortCode ? '##-##-##' : '';

      req.session.locCode = req.session.authentication.locCode;

      delete req.session.errors;
      delete req.session.tmpBody;
      return res.render('expenses/bank-details.njk', {
        juror,
        processUrl,
        cancelUrl,
        addNotesUrl,
        changeAddressUrl,
        tmpBody,
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postBankDetails = (app) => {
    return async function(req, res) {
      const { jurorNumber, locCode } = req.params;
      let { status } = req.query;

      if (status !== 'for-approval' && status !== 'approved' && status !== 'for-reapproval') {
        status = 'draft';
      }

      const validatorResult = validate(req.body, bankDetailsValidator());
      const routePrefix = req.url.includes('record') ? 'juror-record' : 'juror-management';
      const errorUrl = app.namedRoutes.build(`${routePrefix}.bank-details.get`, {
        jurorNumber,
        locCode,
      }) + status ? `?status=${status}` : '';
      const redirectUrl = req.url.includes('record')
        ? app.namedRoutes.build('juror-record.expenses.get', { jurorNumber })
        : app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.get', {
          jurorNumber,
          locCode,
          status: status ? status : 'draft',
        });

      if (typeof validatorResult !== 'undefined') {
        req.session.tmpBody = req.body;
        req.session.errors = validatorResult;

        return res.redirect(errorUrl);
      };

      try {
        await jurorBankDetailsDAO.get(
          req,
          jurorNumber,
          req.session.bankDetails.etag
        );

        req.session.errors = {
          bankDetails: [{
            summary: 'Bank details have been updated by another user',
            details: 'Bank details have been updated by another user',
          }],
        };

        return res.redirect(errorUrl);
      } catch (err) {
        if (err.statusCode !== 304) {

          app.logger.crit('Failed to compare etags for when updating bank details: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('_errors/generic', { err });
        }
      }

      try {
        const accountNumber = req.body.accountNumber === '########'
          ? req.session.bankDetails.originalDetails.bankAccountNumber
          : req.body.accountNumber;

        const sortCode = req.body.sortCode === '##-##-##'
          ? req.session.bankDetails.originalDetails.sortCode
          : req.body.sortCode.replace(/-/g, '');

        const body = {
          jurorNumber,
          accountNumber: accountNumber,
          sortCode: sortCode,
          accountHolderName: req.body.accountHolderName,
        };

        const payload = _.mapKeys(body, (__, key) => _.snakeCase(key));

        await jurorBankDetailsDAO.patch(req, payload);

        app.logger.info('Updated juror\'s bank details:  ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: payload,
        });

        delete req.session.bankDetails;

        return res.redirect(redirectUrl);
      } catch (err) {
        app.logger.crit('Failed to set jurors bank details', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic', { err });
      };
    };

  };

})();
