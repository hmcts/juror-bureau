(() => {
  'use strict';

  const { validate } = require('validate.js');
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
  const validator = require('../../config/validation/electoral-register.js');

  module.exports.getSetDeadline = (app) => (req, res) => {
    const tmpErrors = _.clone(req.session.errors);
    const tmpBody = _.clone(req.session.formFields);
    delete req.session.errors;
    delete req.session.formFields;

    const today = new Date();
    let tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    console.log("Get request working for route");
    return res.render('electoral-register/set-deadline', {
      pageTitle: 'Set deadline',
      postUrl: app.namedRoutes.build('electoral-register.set-deadline.post'),
      minDate: dateFilter(tomorrow, null, 'DD/MM/YYYY'),
      cancelUrl: app.namedRoutes.build('electoral-register.get'),
      tmpBody,
      errors: {
        title: 'Please check the form',
        count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
        items: tmpErrors,
      }
    });
  };

  module.exports.postSetDeadline = (app) => async (req, res, next) => {
    console.log('Post working for button', 'Form body:', req.body);

    const { setDeadline } = req.body;
    const validatorResult = validate(req.body, validator.setDeadlineDate());
 
    if (typeof validatorResult !== 'undefined') {
      req.session.errors = validatorResult;
      req.session.formFields = req.body;
      return res.redirect(app.namedRoutes.build('electoral-register.set-deadline.get'));
    }

    const deadlineDate = dateFilter(setDeadline, 'DD/MM/YYYY', 'YYYY-MM-DD');

    console.log(setDeadline);
    console.log(moment(setDeadline, 'yyyy-MM-DD'));
    console.log(moment(new Date()));

    if (moment(deadlineDate, 'yyyy-MM-DD').isSameOrBefore(moment(new Date()))) {
      req.session.errors = makeManualError('setDeadline', "Date must be in the future");
      req.session.formFields = req.body;
      return res.redirect(app.namedRoutes.build('electoral-register.set-deadline.get'));
    }

    const payloadCamel = { deadlineDate };

    const apiResponse = await erDeadlineDAO.put(req, payloadCamel);

    req.session.bannerMessage = 'Deadline updated.';
    return res.redirect(app.namedRoutes.build('electoral-register.get'));
  };

})();
