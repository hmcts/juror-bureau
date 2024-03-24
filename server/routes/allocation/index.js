;(function(){
  'use strict';

  const controller = require('./allocation.controller');
  const auth = require('../../components/auth');
  const { todoDAO } = require('../../objects');

  module.exports = function(app) {
    app.get(
      '/new-replies',
      'allocation.get',
      auth.verify,
      auth.isSupervisor,
      todoDAO.get,
      controller.index(app)
    );

    app.post(
      '/new-replies',
      'allocation.post',
      auth.verify,
      auth.isSupervisor,
      todoDAO.get,
      controller.post(app)
    );

  };

})();
