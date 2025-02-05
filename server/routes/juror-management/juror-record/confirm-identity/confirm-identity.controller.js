/* eslint-disable strict */

const _ = require('lodash');
const validate = require('validate.js');
const idTypeValidator = require('../../../../config/validation/confirm-identity');
const { systemCodesDAO, confirmIdentityDAO } = require('../../../../objects');
const { Logger } = require('../../../../components/logger');

module.exports.getConfirmIdentity = function(app) {
  return async function(req, res) {
    const { jurorNumber } = req.params;

    const tmpErrors = _.clone(req.session.errors);
    const tmpBody = _.clone(req.session.tmpBody);

    delete req.session.errors;
    delete req.session.tmpBody;

    let idCheckCodes;

    try {
      idCheckCodes = (await systemCodesDAO.get(req, 'ID_CHECK')).reduce((acc, code) => {
        acc.push({
          value: code.code,
          text: code.description,
          selected: tmpBody && tmpBody.idType === code.code,
        });

        return acc;
      }, [{ value: '', text: 'Select ID type' }]);
    } catch (err) {
      Logger.instance.crit('Failed to fetch system codes for id check', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        data: { jurorNumber },
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      return res.render('_errors/generic');
    }

    res.render('juror-management/juror-record/confirm-identity', {
      idCheckCodes,
      jurorNumber,
      tmpBody,
      errors: {
        title: 'Please check the form',
        count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
        items: tmpErrors,
      },
    });
  };
};

module.exports.postConfirmIdentity = function(app) {
  return async function(req, res) {
    const { jurorNumber } = req.params;

    const validationErrors = validate(req.body, idTypeValidator());

    if (validationErrors) {
      req.session.errors = validationErrors;
      req.session.tmpBody = req.body;

      return res.redirect(app.namedRoutes.build('juror-record.confirm-identity.get', { jurorNumber }));
    }

    const payload = {
      'jurorNumber': jurorNumber,
      'confirmCode': req.body.idType,
    };

    try {
      await confirmIdentityDAO.patch(req, payload);

      req.session.bannerMessage = 'Identity confirmed';
    } catch (err) {
      Logger.instance.crit('Failed to confirm the juror\'s identity', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        data: { payload },
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      req.session.errors = {
        idCheckError: [{ details: 'Something went wrong when trying to confirm the juror\'s identity' }],
      };

      return res.redirect(app.namedRoutes.build('juror-record.confirm-identity.get', { jurorNumber }));
    }

    res.redirect(app.namedRoutes.build('juror-record.overview.get', { jurorNumber }));
  };
};
