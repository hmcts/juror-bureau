;(function(){
  'use strict';

  const controller = require('./inbox.controller');
  const auth = require('../../components/auth');
  const { todoDAO } = require('../../objects');

  module.exports = function(app) {
    app.get('/inbox', 'inbox.todo.get', auth.verify, todoDAO.get, controller.index(app));
  };

})();
