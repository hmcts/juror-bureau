;(function() {
  'use strict';

  var controller = require('./pool-management.controller')
    , auth = require('../../components/auth');

  module.exports = function(app) {
    app.get('/pool-management', 'pool-management.get', auth.verify, controller.index(app));
    app.post('/pool-management', 'pool-management.post', auth.verify, controller.filterPools(app));

    app.get('/pool-management/pool-create-select',
      'pool-create-select.get',
      auth.verify,
      controller.getPoolCreateSelect(app));
    app.post('/pool-management/pool-create-select',
      'pool-create-select.post',
      auth.verify,
      controller.postPoolCreateSelect(app));

    require('./pool-overview')(app);
    require('./pool-overview/edit')(app);
    require('./request-pool')(app);
    require('./nil-pool')(app);
    require('./convert-nil-pool')(app);
    require('./delete-pool')(app);
    require('./create-pool/summon-citizens')(app);
    require('./additional-summons')(app);
    require('./summoning-progress')(app);
    require('./pool-search')(app);
    require('./coroner-court')(app);
    require('./deferral-maintenance')(app);
    require('./pool-create-manual')(app);
  };

})();
