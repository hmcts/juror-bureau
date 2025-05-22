(function(){
  'use strict';

  var controller = require('./homepage.controller')
    , auth = require('../../components/auth');

  module.exports = function(app) {
    app.get('/homepage', 'homepage.get', auth.verify, controller.dashboard(app));
  };

})();
