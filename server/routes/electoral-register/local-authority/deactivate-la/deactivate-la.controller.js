const { validate } = require('validate.js');

(() => {
  'use strict';

  const _ = require('lodash');
  const moment = require('moment');
  const { localAuthorityInfoDAO, deactivateLocalAuthorityDAO } = require('../../../../objects/electoral-register');
  const validator = require('../../../../config/validation/electoral-register');

  module.exports.getDeactivateLa = (app) => async (req, res) => {
    const { laCode } = req.params;

    const tmpErrors = _.clone(req.session.errors);
    const tmpBody = _.clone(req.session.formFields);
    delete req.session.errors;
    delete req.session.formFields;

    let localAuthorityInfo;
    try {
      localAuthorityInfo = await localAuthorityInfoDAO.get(req, laCode);
      app.logger.info('Fetched local authoirty information for deactivating LA', {
        auth: req.session.authentication,
        laCode
      })
    } catch (err) {
      app.logger.crit('Error fetching local authority information for deactivating LA', {
        auth: req.session.authentication,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });
    }

    return res.render('electoral-register/deactivate-la.njk', {
      localAuthorityInfo,
      postUrl: app.namedRoutes.build('electoral-register.local-authority.deactivate.post', { laCode }),
      cancelUrl: app.namedRoutes.build('electoral-register.local-authority.get', { laCode }),
      tmpBody,
      errors: {
        title: 'Please check the form',
        count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
        items: tmpErrors,
      },
    });
  };

  module.exports.postDeactivateLa = (app) => async (req, res) => {
    const { laCode } = req.params;

    const validatorResult = validate(req.body, validator.deactivateLa());

    if (typeof validatorResult !== 'undefined') {
      req.session.errors = validatorResult;
      req.session.formFields = req.body;
      return res.redirect(app.namedRoutes.build('electoral-register.local-authority.deactivate.get', { laCode }));
    }

    try {
      const payload = {
        laCode,
        reason: req.body.inactiveReason,
      }

      await deactivateLocalAuthorityDAO.put(req, payload);
      
      app.logger.info('Marked local authority as inactive', {
        auth: req.session.authentication,
        laCode
      })
    } catch (err) {
      app.logger.crit('Error marking local authority as inactive', {
        auth: req.session.authentication,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      return res.render('_errors/generic', { err });
    }

    return res.redirect(app.namedRoutes.build('electoral-register.local-authority.get', { laCode }));
  };

})();
