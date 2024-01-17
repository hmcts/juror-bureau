;(function(){
  'use strict';

  var controller = require('./summoning-progress.controller')
    , auth = require('../../../components/auth')
    , isBureauUser = require('../../../components/auth/user-type.js').isBureauUser;

  module.exports = function(app) {
    app.get('/pool-management/summoning-progress', 'summoning-progress.get',
      auth.verify, isBureauUser, controller.index(app));
    app.post('/pool-management/summoning-progress', 'summoning-progress.post',
      auth.verify, isBureauUser, controller.post(app));
  };
})();
