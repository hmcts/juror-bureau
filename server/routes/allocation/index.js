;(function(){
  'use strict';

  var controller = require('./allocation.controller')
    , auth = require('../../components/auth')
    , responseCountMiddleware = require('../../objects/responses').object;

  module.exports = function(app) {
    app.get(
      '/new-replies',
      'allocation.get',
      auth.verify,
      auth.isSupervisor,
      responseCountMiddleware.getCount.bind(app),
      controller.index(app)
    );

    app.post(
      '/new-replies',
      'allocation.post',
      auth.verify,
      auth.isSupervisor,
      responseCountMiddleware.getCount.bind(app),
      controller.post(app)
    );

  };

})();
