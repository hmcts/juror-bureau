(() => {
  'use strict';

  const _ = require('lodash');
  const moment = require('moment');
  const { localAuthorityInfoDAO, erUploadStats } = require('../../../objects/electoral-register');

  module.exports.getLocalAuthorityInfo = (app) => async (req, res) => {
    const { laCode } = req.params;

    const tmpErrors = _.clone(req.session.errors);
    delete req.session.errors;

    const bannerMessage = _.clone(req.session.bannerMessage);
    delete req.session.bannerMessage;

    let localAuthorityInfo;
    try {
      localAuthorityInfo = await localAuthorityInfoDAO.get(req, laCode);
      app.logger.info('Fetched local authoirty information', {
        auth: req.session.authentication,
        laCode
      })
    } catch (err) {
      app.logger.crit('Error fetching local authority information', {
        auth: req.session.authentication,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });
    }

    let deadline;
    try {
      deadline = (await erUploadStats.get(req)).deadlineDate;
    } catch (err) {
      app.logger.crit('Error fetching local authority deadline information', {
        auth: req.session.authentication,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });
    }

    const deadlineDiff = moment(new Date(deadline)).diff(
      moment(new Date()),
      'days',
    );

    return res.render('electoral-register/local-authority.njk', {
      localAuthorityInfo,
      daysToDeadline: deadlineDiff + 1,
      showDeadlineWarrning: deadlineDiff <= 28 && localAuthorityInfo.uploadStatus !== 'UPLOADED',
      bannerMessage,
      actionRoutes: {
        markInactive: app.namedRoutes.build('electoral-register.local-authority.change-active-status.get', {
          laCode,
          status: 'deactivate'
        }),
        markActive: app.namedRoutes.build('electoral-register.local-authority.change-active-status.get', {
          laCode,
          status: 'activate'
        }),
        sendReminder: app.namedRoutes.build('electoral-register.local-authority.send-reminder.get', { laCode }),
        editNotes: app.namedRoutes.build('electoral-register.local-authority.edit-notes.get', { laCode }),
        changeEmailRequestStatus: app.namedRoutes.build('electoral-register.local-authority.change-email-request-status.get', { laCode }),
      },
      backLinkUrl: {
        built: true,
        url: app.namedRoutes.build('electoral-register.get'),
      },
      errors: {
        title: 'Please check the form',
        count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
        items: tmpErrors,
      }
    });
  };

})();
