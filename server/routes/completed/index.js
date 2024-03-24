;(function(){
  'use strict';

  const controller = require('./completed.controller');
  const auth = require('../../components/auth');
  const { todoDAO } = require('../../objects');

  module.exports = function(app) {
    app.get('/completed', 'inbox.completed.get', auth.verify, todoDAO.get, controller.index(app));
  };

})();

