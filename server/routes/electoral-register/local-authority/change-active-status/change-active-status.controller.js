(() => {
  'use strict';

  const _ = require('lodash');
  const { validate } = require('validate.js');
  const { localAuthorityInfoDAO, changeLaActiveStatus } = require('../../../../objects/electoral-register');
  const validator = require('../../../../config/validation/electoral-register');

  module.exports.getChangeActiveStatus = (app) => async (req, res) => {
    const { laCode, status } = req.params;

    const tmpErrors = _.clone(req.session.errors);
    const tmpBody = _.clone(req.session.formFields);
    delete req.session.errors;
    delete req.session.formFields;

    let localAuthorityInfo;
    try {
      localAuthorityInfo = await localAuthorityInfoDAO.get(req, laCode);
      app.logger.info(`Fetched local authority information to ${status} LA`, {
        auth: req.session.authentication,
        laCode
      })
    } catch (err) {
      app.logger.crit(`Error fetching local authority information to ${status} LA`, {
        auth: req.session.authentication,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });
    }

    return res.render(`electoral-register/${status}-la.njk`, {
      localAuthorityInfo,
      postUrl: app.namedRoutes.build('electoral-register.local-authority.change-active-status.get', { laCode, status }),
      cancelUrl: app.namedRoutes.build('electoral-register.local-authority.get', { laCode }),
      tmpBody,
      errors: {
        title: 'Please check the form',
        count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
        items: tmpErrors,
      },
    });
  };

  module.exports.postChangeActiveStatus = (app) => async (req, res) => {
    const { laCode, status } = req.params;

    if (status === 'deactivate') {
      const validatorResult = validate(req.body, validator.deactivateLa());

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;
        return res.redirect(app.namedRoutes.build('electoral-register.local-authority.change-active-status.get', {
          laCode, status 
        }));
      }
    }

    try {
      const payload = {
        laCode,
        reason: req.body.inactiveReason,
      }

      await changeLaActiveStatus.put(req, payload, status);
      
      app.logger.info(`Marked local authority as ${status === 'activate' ? 'active' : 'inactive'}`, {
        auth: req.session.authentication,
        laCode
      })
    } catch (err) {
      app.logger.crit(`Error marking local authority as ${status === 'activate' ? 'active' : 'inactive'}`, {
        auth: req.session.authentication,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      return res.render('_errors/generic', { err });
    }

    return res.redirect(app.namedRoutes.build('electoral-register.local-authority.get', { laCode }));
  };

})();
