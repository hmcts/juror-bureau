;(function(){
  'use strict';

  const controller = require('./pending.controller');
  const auth = require('../../components/auth');
  const { todoDAO } = require('../../objects');

  module.exports = function(app) {
    app.get('/pending', 'inbox.pending.get', auth.verify, todoDAO.get, controller.index(app));
  };

})();
