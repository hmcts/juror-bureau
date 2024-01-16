;(function(){
  'use strict';

  var controller = require('./dashboard.controller')

  module.exports = function(app) {
    app.get('/dashboard', 'dashboard.get', controller.index(app));

    app.post('/dashboard', 'dashboard.post', controller.getData(app));
  };

})();
