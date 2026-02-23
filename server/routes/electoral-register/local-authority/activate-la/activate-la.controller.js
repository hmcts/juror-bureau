(() => {
  'use strict';

  const _ = require('lodash');
  const moment = require('moment');
  const { localAuthorityInfoDAO, activateLocalAuthorityDAO } = require('../../../../objects/electoral-register');

  module.exports.getActivateLa = (app) => async (req, res) => {
    const { laCode } = req.params;

    let localAuthorityInfo;
    try {
      localAuthorityInfo = await localAuthorityInfoDAO.get(req, laCode);
      app.logger.info('Fetched local authoirty information for activating LA', {
        auth: req.session.authentication,
        laCode
      })
    } catch (err) {
      app.logger.crit('Error fetching local authority information for activating LA', {
        auth: req.session.authentication,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });
    }

    return res.render('electoral-register/activate-la.njk', {
      localAuthorityInfo,
      postUrl: app.namedRoutes.build('electoral-register.local-authority.activate.post', { laCode }),
      cancelUrl: app.namedRoutes.build('electoral-register.local-authority.get', { laCode }),
    });
  };

  module.exports.postActivateLa = (app) => async (req, res) => {
    const { laCode } = req.params;

    try {
      const payload = {
        laCode,
      };

      await activateLocalAuthorityDAO.put(req, payload);
      
      app.logger.info('Marked local authority as active', {
        auth: req.session.authentication,
        laCode
      })
    } catch (err) {
      app.logger.crit('Error marking local authority as active', {
        auth: req.session.authentication,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      return res.render('_errors/generic', { err });
    }

    return res.redirect(app.namedRoutes.build('electoral-register.local-authority.get', { laCode }));
  };

})();
