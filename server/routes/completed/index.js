;(function(){
  'use strict';

  var controller = require('./completed.controller')
    , auth = require('../../components/auth')
    , responseCountMiddleware = require('../../objects/responses').object;


  module.exports = function(app) {
    app.get('/completed', 'inbox.completed.get', auth.verify, responseCountMiddleware.getCount.bind(app), controller.index(app));

  };

})();

