;(function(){
  'use strict';

  var controller = require('./inbox.controller')
    , auth = require('../../components/auth');

  module.exports = function(app) {
    app.get('/inbox', 'inbox.todo.get', auth.verify, controller.index(app));
  };

})();
