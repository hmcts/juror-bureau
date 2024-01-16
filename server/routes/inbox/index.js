;(function(){
  'use strict';

  var controller = require('./inbox.controller')
    , auth = require('../../components/auth')
    , responseCountMiddleware = require('../../objects/responses').object;

  module.exports = function(app) {
    app.get('/inbox', 'inbox.todo.get', auth.verify, responseCountMiddleware.getCount.bind(app), controller.index(app));
  };

})();
