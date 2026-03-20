(() => {
  'use strict';

  const _ = require('lodash');
  const { markEmailDeliveredDAO } = require('../../../objects/electoral-register');
  const { makeManualError } = require('../../../lib/mod-utils');

  module.exports.getMarkEmailDelivered = (app) => async (req, res) => {
    const { laCode } = req.params;

    let localAuthorityInfo;
    let cancelUrl = app.namedRoutes.build('electoral-register.get');
    let postUrl = app.namedRoutes.build('electoral-register.mark-email-delivered.post');
    const laCodes = req.session.checkedLaCodes;
    

    return res.render('electoral-register/mark-email-delivered.njk', {
      noLocalAuthorities: laCodes?.length || 0,
      localAuthorityInfo,
      cancelUrl,
      postUrl,
      backLinkUrl: {
        built: true,
        url: app.namedRoutes.build('electoral-register.get'),
      }
    });
  };

  module.exports.postMarkEmailDelivered = (app) => async (req, res) => {
    const indivdualLaFlow = req.url.includes('/local-authority/');
    const { laCode } = req.params;
    const laCodes = indivdualLaFlow ? [laCode] : req.session.checkedLaCodes;
    
    delete req.session.checkedLaCodes; // Clear checked LA codes from session after use

    let response;
    try {
      response = await markEmailDeliveredDAO.put(req, { laCodes });
    } catch (err) {
      app.logger.crit('Failed to mark email as delivered for all local authorities', {
        auth: req.session.authentication,
        laCodes,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      return res.render('_errors/generic', { err });
    }

    if (response.updated?.length > 0) {
      app.logger.info('Marked email as delivered for local authorities', {
        auth: req.session.authentication,
        laCodes: response.updated,
      });
      req.session.bannerMessage = `Email request marked as delivered for ${response.updated.length} local authorit${response.updated.length > 1 ? 'ies' : 'y'}.`;
    }

    if (response.alreadySent?.length > 0) {
      const alreadySentMessage = `Email request already marked as delivered for ${response.alreadySent.length} local authorit${response.alreadySent.length > 1 ? 'ies' : 'y'}.`;
      req.session.bannerMessage = req.session.bannerMessage 
        ? `${req.session.bannerMessage}<br> ${alreadySentMessage}` 
        : alreadySentMessage;
    }

    if (response.errors?.length > 0) {
      app.logger.crit('Failed to mark email as delivered for some local authorities', {
        auth: req.session.authentication,
        laCodes: response.errors,
      });
      req.session.errors = makeManualError('laCodes', `Failed to mark email as delivered for ${response.errors.length} local authorit${response.errors.length > 1 ? 'ies' : 'y'}.`);
    }

    return res.redirect(app.namedRoutes.build('electoral-register.get'));
  };

})();
