(() => {
  'use strict';

  const _ = require('lodash');
  const { validate } = require('validate.js');
  const { localAuthorityInfoDAO, changeEmailRequestStatus } = require('../../../../objects/electoral-register');
  const { toSentenceCase } = require('../../../../components/filters');
  const validator = require('../../../../config/validation/electoral-register');

  module.exports.getChangeEmailRequestStatus = (app) => async (req, res) => {
    const { laCode } = req.params;

    const tmpErrors = _.clone(req.session.errors);
    const tmpBody = _.clone(req.session.formFields);
    delete req.session.errors;
    delete req.session.formFields;

    let localAuthorityInfo;
    try {
      localAuthorityInfo = await localAuthorityInfoDAO.get(req, laCode);
      app.logger.info(`Fetched local authority information for LA`, {
        auth: req.session.authentication,
        laCode
      })
    } catch (err) {
      app.logger.crit(`Error fetching local authority information for LA`, {
        auth: req.session.authentication,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });
    }

    return res.render(`electoral-register/change-email-request-status.njk`, {
      localAuthorityInfo,
      postUrl: app.namedRoutes.build('electoral-register.local-authority.change-email-request-status.post', { laCode }),
      cancelUrl: app.namedRoutes.build('electoral-register.local-authority.get', { laCode }),
      tmpBody,
      errors: {
        title: 'Please check the form',
        count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
        items: tmpErrors,
      },
    });
  };

  module.exports.postChangeEmailRequestStatus = (app) => async (req, res) => {
    const { laCode } = req.params;

    const validatorResult = validate(req.body, validator.changeEmailRequestStatus());

    if (typeof validatorResult !== 'undefined') {
      req.session.errors = validatorResult;
      req.session.formFields = req.body;
      return res.redirect(app.namedRoutes.build('electoral-register.local-authority.change-email-request-status.get', { laCode }));
    }

    const payload = {
      laCode,
      emailRequestStatus: req.body.status,
    }

    try {
      await changeEmailRequestStatus.put(req, payload);
      
      app.logger.info(`Changed email request status for local authority to ${req.body.status}`, {
        auth: req.session.authentication,
        laCode
      })
    } catch (err) {
      app.logger.crit(`Error changing email request status for local authority to ${req.body.status}`, {
        auth: req.session.authentication,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      return res.render('_errors/generic', { err });
    }

    req.session.bannerMessage = `Email request status changed to ${toSentenceCase(req.body.status).toLowerCase()}`;

    return res.redirect(app.namedRoutes.build('electoral-register.local-authority.get', { laCode }));
  };

})();
