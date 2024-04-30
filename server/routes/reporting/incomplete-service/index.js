
(() => {
  'use strict';

  const { filterCutoffDateGet, filterCutoffDatePost } = require('./incomplete-service.controller');
  const auth = require('../../../components/auth');

  module.exports = function(app) {
    app.get('/reporting/incomplete-service',
      'reports.incomplete-service.filter.get',
      auth.verify,
      filterCutoffDateGet(app));
    app.post('/reporting/incomplete-service',
      'reports.incomplete-service.filter.post',
      auth.verify,
      filterCutoffDatePost(app));
  };
})();
