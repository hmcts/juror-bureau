;(function(){
  'use strict';

  var controller = require('./pending.controller')
    , auth = require('../../components/auth');


  module.exports = function(app) {
    app.get('/pending', 'inbox.pending.get', auth.verify, controller.index(app));
  };

})();
