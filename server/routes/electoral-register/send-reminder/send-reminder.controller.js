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

    let response;
    try {
      response = await sendReminderDAO.post(req, { laCodes });
      console.log('\n\nSend reminder response:', response, '\n\n');
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

    if (response.failedNotifications?.length) {
      const failedLaErrors = {};
      if (indivdualLaFlow) {
        app.logger.crit('Failed to send reminder email to local authority in individual LA flow', {
          auth: req.session.authentication,
          laCode,
          errors: response.failedNotifications.map(failure => ({laCode: failure.laCode, failureReason: failure.failureReason})),
        });

        response.failedNotifications.forEach(failure => {
          failedLaErrors[`${failure.laCode}${failure.emailAddress ? `-${failure.emailAddress}` : ''}`] = [{
            summary: errorMessageMapping(failure),
            details: errorMessageMapping(failure),
          }];
        });
      } else {
        app.logger.crit('Failed to send reminder email to local authorities', {
          auth: req.session.authentication,
          laCode,
          errors: response.failedNotifications.map(failure => ({laCode: failure.laCode, failureReason: failure.failureReason})),
        });
        
        // Only show one error per LA in the bulk flow
        response.failedNotifications.forEach(failure => {
          if (!failedLaErrors[failure.laCode]) {
            failedLaErrors[failure.laCode] = [{
            summary: `Failed to send one or more reminder emails to ${failure.laName || (`LA code ${failure.laCode}`)}.`,
            details: `Failed to send one or more reminder emails to ${failure.laName || (`LA code ${failure.laCode}`)}.`,
          }];
          }
        });
      }
      req.session.errors = failedLaErrors;
    }

    if (indivdualLaFlow) {
      if (!response.failedNotifications?.length) {
        req.session.bannerMessage = 'Email reminder sent.';
      }
      return res.redirect(app.namedRoutes.build('electoral-register.local-authority.get', { laCode }));
    }

    if (!response.failedNotifications?.length) {
      req.session.bannerMessage = `Reminders sent to ${response.successfulNotificationsSent} 
        local ${response.successfulNotificationsSent > 1 ? 'authorities' : 'authority'}.`;
    }
    return res.redirect(app.namedRoutes.build('electoral-register.get'));
  };

  const errorMessageMapping = (failure) => {
    const mappings = {
      NOTIFY_API_ERROR: `Failed to send reminder email to ${failure.emailAddress}: Email failed to send via GOV.UK Notify`,
      LA_NOT_FOUND: `Failed to send reminder email to ${failure.laCode}: Local authority not found`,
      NO_USERS_FOR_LA: `Failed to send reminder email to ${failure.laName}: Local authority exists but has no users`,
      EMAIL_ADDRESS_BLANK: `Failed to send reminder email to ${failure.laName}: User has no email address`,
      USER_INACTIVE: `Failed to send reminder email to ${failure.emailAddress}: User is inactive`,
      UNEXPECTED_ERROR: `Failed to send reminder email to ${failure.emailAddress}: An unexpected error occurred`
    }
    return mappings[failure.failureReason] || "An unknown error occurred";
  };

})();
