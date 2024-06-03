
(() => {
  'use strict';

  const { getDeferredListSearch, postDeferredListSearch } = require('./deferred-list.controller');
  const auth = require('../../../components/auth');

  module.exports = function(app) {
    app.get('/reporting/deferred-list',
      'reports.deferred-list.filter.get',
      auth.verify,
      getDeferredListSearch(app));
    app.post('/reporting/deferred-list',
      'reports.deferred-list.filter.post',
      auth.verify,
      postDeferredListSearch(app));
  };
})();
