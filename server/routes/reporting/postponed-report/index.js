(function() {
  'use strict';

  const auth = require('../../../components/auth');
  const postponedController = require('./postponed.controller');

  module.exports = function(app) {
    app.get('/reporting/postponed/search',
      'postponed.search.get',
      auth.verify,
      postponedController.getPostponedSearch(app));

    app.post('/reporting/postponed/search',
      'postponed.search.post',
      auth.verify,
      postponedController.postPostponedSearch(app));
  };

})();
