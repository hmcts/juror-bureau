
(() => {
  'use strict';

  const { getUncompletedCheck } = require('./daily-utilisation.controller');
  const auth = require('../../../components/auth');

  module.exports = function(app) {
    app.get('/reporting/daily-utilisation/check/:filter',
      'reports.daily-utilisation.check.get',
      auth.verify,
      getUncompletedCheck(app));
  };
})();
