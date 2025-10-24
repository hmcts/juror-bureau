
(() => {
  'use strict';

  const { filterCutoffDateGet, filterCutoffDatePost, getCompleteService } = require('./incomplete-service.controller');
  const completeServiceController = require('../../shared/complete-service/complete-service.controller');
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

    app.get('/reporting/incomplete-service/complete/:jurorNumber',
      'reports.incomplete-service.complete-redirect.get',
      auth.verify,
      getCompleteService(app));

    app.get('/reporting/incomplete-service/complete-service/:jurorNumber',
      'reports.incomplete-service.complete.get',
      auth.verify,
      completeServiceController.getCompleteServiceConfirm(app));

    app.post('/reporting/incomplete-service/complete-service/:jurorNumber',
      'reports.incomplete-service.complete.post',
      auth.verify,
      completeServiceController.postCompleteServiceConfirm(app));
  };
})();
