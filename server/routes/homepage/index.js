(function(){
  'use strict';

  const controller = require('./homepage.controller');
  const auth = require('../../components/auth');
  const { isSuperUser } = require('../../components/auth/user-type');

  module.exports = function(app) {
    app.get('/homepage', 'homepage.get', auth.verify, controller.homepage(app));

    app.get('/homepage/dashboard', 'homepage.dashboard.get', auth.verify, controller.dashboard(app));

    app.post('/homepage/dashboard', 'homepage.dashboard.post', auth.verify, isSuperUser, controller.filterPools(app));
  };

})();
