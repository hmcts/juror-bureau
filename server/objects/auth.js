;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');

  module.exports.authDAO = new DAO('auth/bureau');
})();
