;(function(){
  'use strict';

  var controller = require('./pending.controller')
    , auth = require('../../components/auth')
    , responseCountMiddleware = require('../../objects/responses').object;


  module.exports = function(app) {
    app.get('/pending', 'inbox.pending.get', auth.verify, responseCountMiddleware.getCount.bind(app), controller.index(app));
  };

})();
