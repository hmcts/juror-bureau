(function() {
  'use strict';

  const _ = require('lodash')
    , validate = require('validate.js')
    , validator = require('../../../config/validation/default-expenses');

  module.exports.getDefaultExpenses = (app) => {
    return function(req, res) {
      const tmpErrors = _.cloneDeep(req.session.errors);
      const tmpBody = _.cloneDeep(req.session.tmpBody);
      const processUrl = app.namedRoutes.build('juror-management.default-expenses.post',
          {jurorNumber: req.params.jurorNumber}),
        cancelUrl = app.namedRoutes.build(
          'juror-management.unpaid-attendance.expense-record.get', {jurorNumber: req.params.jurorNumber});

      delete req.session.errors;
      delete req.session.tmpBody;
      return res.render('expenses/default-expenses.njk', {
        processUrl,
        cancelUrl,
        tmpBody,
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postDefaultExpenses = (app) => {
    return async function(req, res) {
      req.body.totalTravelTime = {
        hour: req.body['totalTravelTime-hour'],
        minutes: req.body['totalTravelTime-minute'],
      };
      const validatorResult = validate(req.body, validator());

      if (typeof validatorResult !== 'undefined') {
        req.session.tmpBody = req.body;
        req.session.errors = validatorResult;

        return res.redirect(app.namedRoutes.build('juror-management.default-expenses.get', {
          jurorNumber: req.params.jurorNumber}));

      };
      try {
        //TODO replace with endpoint
        resolver();
        return res.redirect(app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.get',
          {jurorNumber: req.params.jurorNumber}));
      } catch (error) {
        app.logger.crit('Unable to uncomplete service', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      };
    };

  };
  //TODO delete resolver once backend is ready
  function resolver() {
    return new Promise(res => res(''));
  };

})();
