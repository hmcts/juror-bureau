(() => {
  'use strict';

  const _ = require('lodash');
  const moment = require('moment');
  const { dateFilter, toSentenceCase } = require('../../components/filters');
  const { makeManualError, paginationBuilder } = require('../../lib/mod-utils');
  const {
    erLocalAuthorityStatusDAO,
    localAuthoritiesDAO,
    erUploadStats,
    erDeadlineDAO
  } = require('../../objects/electoral-register');
  const PAGE_SIZE = 20;

  module.exports.getSetDeadline = (app) => (req, res) => {
    const today = new Date();
    let tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    console.log("Get request working for route");
    return res.render('electoral-register/set-deadline', {
      pageTitle: 'Set deadline',
      postUrl: app.namedRoutes.build('electoral-register.set-deadline.post'),
      minDate: dateFilter(tomorrow, null, 'DD/MM/YYYY'),
      cancelUrl: app.namedRoutes.build('electoral-register.get')
    });
  };

  module.exports.postSetDeadline = (app) => async (req, res, next) => {
    console.log('Post working for button', 'Form body:', req.body);

    const { setDeadline } = req.body;

    if (!setDeadline) {
      req.session.bannerMessage = { type: 'error', message: 'Please select a date.' };
      return res.redirect(app.namedRoutes.build('electoral-register.get'));
    }

    // Accept DD/MM/YYYY or YYYY-MM-DD and normalise to 'YYYY-MM-DD'
    const parseDate = (d) => {
      const m = moment(d, ['DD/MM/YYYY'], true);
      return m.isValid() ? m.format('YYYY-MM-DD') : null;
    };

    const deadlineDate = parseDate(setDeadline);
    if (!deadlineDate) {
      req.session.bannerMessage = { type: 'error', message: 'Invalid date format.' };
      return res.redirect(app.namedRoutes.build('electoral-register.get'));
    }

    const payloadCamel = { deadlineDate };

    const apiResponse = await erDeadlineDAO.put(req, payloadCamel);

    req.session.bannerMessage = 'Deadline updated.';
    return res.redirect(app.namedRoutes.build('electoral-register.get'));
  };

})();
