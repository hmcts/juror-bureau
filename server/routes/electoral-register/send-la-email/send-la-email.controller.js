(() => {
  'use strict';

  const { localAuthorityInfoDAO, sendLaEmailDAO } = require('../../../objects/electoral-register');

  const notificationConfig = {
    reminder: {
      route: 'send-reminder',
      apiKey: 'REMINDER_EMAIL',
      successMessage: {
        individual: 'Email reminder sent',
        bulk: 'Reminders sent to',
      },
    },
    initial: {
      route: 'initial-email',
      apiKey: 'INITIAL_EMAIL',
      successMessage: {
        individual: 'Initial ER email sent',
        bulk: 'Initial ER emails sent to',
      },
    },
  };

  module.exports.getSendLaEmail = (app, notificationType) => async (req, res) => {
    const { route } = notificationConfig[notificationType];
    const { laCode } = req.params;
    const individualLaFlow = req.url.includes('/local-authority/');
    
    let postUrl = app.namedRoutes.build(
      `electoral-register.${route}.post`,
    );
    let cancelUrl = app.namedRoutes.build('electoral-register.get');

    let localAuthorityInfo;
    if (individualLaFlow) {
      try {
        localAuthorityInfo = await localAuthorityInfoDAO.get(req, laCode);
        app.logger.info('Fetched local authority information for sending reminder', {
          auth: req.session.authentication,
          laCode,
        });
      } catch (err) {
        app.logger.crit('Error fetching local authority information for sending reminder', {
          auth: req.session.authentication,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic', { err });
      }
      postUrl = app.namedRoutes.build(`electoral-register.local-authority.${route}.post`, { laCode });
      cancelUrl = app.namedRoutes.build('electoral-register.local-authority.get', { laCode })
    }

    return res.render(`electoral-register/${route}.njk`, {
      individualLaFlow,
      noLocalAuthorities: req.session.checkedLaCodes?.length || 0,
      localAuthorityInfo,
      cancelUrl,
      postUrl,
      backLinkUrl: {
        built: true,
        url: app.namedRoutes.build('electoral-register.get'),
      },
    });
  };

  module.exports.postSendLaEmail = (app, notificationType) => async (req, res) => {
    const { apiKey, successMessage } = notificationConfig[notificationType];
    const { laCode } = req.params;
    const individualLaFlow = req.url.includes('/local-authority/');
    const laCodes = individualLaFlow ? [laCode] : req.session.checkedLaCodes;

    delete req.session.checkedLaCodes; // Clear checked LA codes from session after use

    let response;
    try {
      response = await sendLaEmailDAO.post(req, laCodes, apiKey);
    } catch (err) {
      app.logger.crit(`Failed to send ${notificationType} email to local authority`, {
        auth: req.session.authentication,
        laCodes,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      return res.render('_errors/generic', { err });
    }

    app.logger.info(`Sent ${notificationType} email to local authorities`, {
      auth: req.session.authentication,
      laCodes,
    });

    const failures = response.failedNotifications || [];
    const numberSent = response.totalLaCodesRequested - failures.length;

    if (failures.length) {
      app.logger.crit(`Failed to send ${notificationType} email to local ${
        individualLaFlow ? 'authority in individual LA flow' : 'authorities'
      }`, {
        auth: req.session.authentication,
        laCode,
        errors: failures.map(failure => ({
          laCode: failure.laCode,
          failureReason: failure.failureReason,
        })),
      });

      req.session.errors = individualLaFlow
        ? getIndividualErrors(failures, notificationType)
        : getBulkErrors(failures, notificationType);

      if (numberSent > 0) {
        req.session.bannerMessage = getBulkSuccessMessage(successMessage.bulk, numberSent);
      }
    }

    if (individualLaFlow) {
      if (!failures.length) {
        req.session.bannerMessage = successMessage.individual;
      }
      return res.redirect(app.namedRoutes.build('electoral-register.local-authority.get', { laCode }));
    }

    if (!failures.length) {
      req.session.bannerMessage = getBulkSuccessMessage(successMessage.bulk, response.totalLaCodesRequested);
    }
    return res.redirect(app.namedRoutes.build('electoral-register.get'));
  };

  const getBulkSuccessMessage = (message, numberOfLocalAuthorities) =>
  `${message} ${numberOfLocalAuthorities} local ${
    numberOfLocalAuthorities > 1 ? 'authorities' : 'authority'
  }.`;

  const getFailureMessage = (failure, notificationType) => {
    const mappings = {
      NOTIFY_API_ERROR: `Failed to send ${notificationType} email to ${failure.emailAddress}: `
        + 'Email failed to send via GOV.UK Notify',
      LA_NOT_FOUND: `Failed to send ${notificationType} email to ${failure.laCode}: Local authority not found`,
      NO_USERS_FOR_LA: `Failed to send ${notificationType} email to ${failure.laName}: `
        + 'Local authority exists but has no users',
      EMAIL_ADDRESS_BLANK: `Failed to send ${notificationType} email to ${failure.laName}: `
        + 'User has no email address',
      USER_INACTIVE: `Failed to send ${notificationType} email to ${failure.emailAddress}: User is inactive`,
      UNEXPECTED_ERROR: `Failed to send ${notificationType} email to ${failure.emailAddress}: `
        + 'An unexpected error occurred',
    };

    return mappings[failure.failureReason] || 'An unknown error occurred';
  };

  const getIndividualErrors = (failures, notificationType) => failures.reduce((errors, failure) => {
    const message = getFailureMessage(failure, notificationType);
    const key = `${failure.laCode}${failure.emailAddress ? `-${failure.emailAddress}` : ''}`;

    errors[key] = [{ summary: message, details: message }];
    return errors;
  }, {});

  const getBulkErrors = (failures, notificationType) => failures.reduce((errors, failure) => {
    if (!errors[failure.laCode]) {
      const localAuthority = failure.laName || `LA code ${failure.laCode}`;
      const message = `Failed to send one or more ${notificationType} emails to ${localAuthority}.`;

      errors[failure.laCode] = [{ summary: message, details: message }];
    }
    return errors;
  }, {});

})();
