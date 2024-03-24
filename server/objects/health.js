const { DAO } = require('./dataAccessObject');

;(function(){
  'use strict';

  module.exports.healthDAO = new DAO('/actuator/health');
})();
