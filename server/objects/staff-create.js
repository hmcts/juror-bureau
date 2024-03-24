;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');

  module.exports.createStaffDAO = new DAO('bureau/staff/create');
})();
