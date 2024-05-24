;(function(){
  'use strict';

  var controller = require('./completed.controller')
    , auth = require('../../components/auth');


  module.exports = function(app) {
    app.get('/completed', 'inbox.completed.get', auth.verify, controller.index(app));

  };

})();

