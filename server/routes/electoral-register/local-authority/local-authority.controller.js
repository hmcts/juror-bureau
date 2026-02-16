(() => {
  'use strict';

  const _ = require('lodash');
  const moment = require('moment');
  const { localAuthorityInfoDAO, erUploadStats } = require('../../../objects/electoral-register');

  module.exports.getLocalAuthorityInfo = (app) => async (req, res) => {
    const { laCode } = req.params;

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

    console.log('\n\n', localAuthorityInfo, '\n\n');

    return res.render('electoral-register/local-authority.njk', {
      localAuthorityInfo,
      daysToDeadline: deadlineDiff + 1,
      showDeadlineWarrning: deadlineDiff <= 28,
      bannerMessage,
      actionRoutes: {
        changeNotes: '#',
        sendReminder: '#',
        markInactive: app.namedRoutes.build('electoral-register.local-authority.deactivate.get', { laCode }),
        markActive: app.namedRoutes.build('electoral-register.local-authority.activate.get', { laCode }),
      },
      backLinkUrl: {
        built: true,
        url: app.namedRoutes.build('electoral-register.get'),
      }
    });
  };

})();
