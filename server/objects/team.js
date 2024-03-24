;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');

  module.exports.teamListDAO = new DAO('bureau/team');
})();
