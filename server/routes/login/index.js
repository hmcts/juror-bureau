;(function(){
  'use strict';

  var controller = require('./login.controller');

  module.exports = function(app) {
    app.get('/', 'login.get', controller.index(app));
  };

})();
