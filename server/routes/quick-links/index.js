(function() {
  'use strict';

  const auth = require('../../components/auth');
  const controller = require('./quick-links.controller');

  module.exports = function(app) {
    app.get('/quick-link/summoning-progress',
      'quick-link.summoning-progress.get',
      auth.verify,
      controller.index(app, 'summoning-progress.get'),
    );

    app.get('/quick-link/deferral-maintenance',
      'quick-link.deferral-maintenance.get',
      auth.verify,
      controller.index(app, 'pool-management.deferral-maintenance.get'),
    );
  };
})();
