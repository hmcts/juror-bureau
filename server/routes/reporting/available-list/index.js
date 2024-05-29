
(() => {
  'use strict';

  const { getAvailableListSearch, postAvailableListSearch } = require('./available-list.controller');
  const auth = require('../../../components/auth');

  module.exports = function(app) {
    app.get('/reporting/available-list',
      'reports.available-list.filter.get',
      auth.verify,
      getAvailableListSearch(app));
    app.post('/reporting/available-list',
      'reports.available-list.filter.post',
      auth.verify,
      postAvailableListSearch(app));
  };
})();
