;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');

  module.exports.staffRosterDAO = new DAO('bureau/staff/roster');
})();
