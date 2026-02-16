(() => {
  'use strict';

  const _ = require('lodash');
  const { localAuthorityInfoDAO, sendReminderDAO } = require('../../../objects/electoral-register');

  module.exports.getSendReminder = (app) => async (req, res) => {
    const indivdualLaFlow = req.url.includes('/local-authority/');
    const { laCode } = req.params;

    let localAuthorityInfo;
    let laCodes;
    let cancelUrl = app.namedRoutes.build('electoral-register.get');
    let postUrl = app.namedRoutes.build('electoral-register.send-reminder.post');
    if (indivdualLaFlow) {
      cancelUrl = app.namedRoutes.build('electoral-register.local-authority.get', { laCode });
      postUrl = app.namedRoutes.build('electoral-register.local-authority.send-reminder.post', { laCode });
      try {
        localAuthorityInfo = await localAuthorityInfoDAO.get(req, laCode);
        app.logger.info('Fetched local authority information for sending reminder', {
          auth: req.session.authentication,
          laCode
        })
      } catch (err) {
        app.logger.crit('Error fetching local authority information for sending reminder', {
          auth: req.session.authentication,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });
        
        return res.render('_errors/generic', { err });
      }
    } else {
      laCodes = req.session.checkedLaCodes;
    }

    return res.render('electoral-register/send-reminder.njk', {
      indivdualLaFlow,
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

  module.exports.postSendReminder = (app) => async (req, res) => {
    const indivdualLaFlow = req.url.includes('/local-authority/');
    const { laCode } = req.params;
    const laCodes = indivdualLaFlow ? [laCode] : req.session.checkedLaCodes;
    
    delete req.session.checkedLaCodes; // Clear checked LA codes from session after use

    try {
      await sendReminderDAO.post(req, { laCodes });
    } catch (err) {
      app.logger.crit('Failed to send reminder email to local authority', {
        auth: req.session.authentication,
        laCodes,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      return res.render('_errors/generic', { err });
    }

    app.logger.info('Sent reminder email to local authorities', {
      auth: req.session.authentication,
      laCodes,
    });

    if (indivdualLaFlow) {
      req.session.bannerMessage = 'Email reminder sent.';
      return res.redirect(app.namedRoutes.build('electoral-register.local-authority.get', { laCode }));
    }

    req.session.bannerMessage = `Reminders sent to ${laCodes.length} local ${laCodes.length > 1 ? 'authorities' : 'authority'}.`;
    return res.redirect(app.namedRoutes.build('electoral-register.get'));
  };

})();
