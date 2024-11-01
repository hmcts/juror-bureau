;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');

  module.exports.postponeObject = new DAO('moj/deferral-maintenance/juror/postpone');

})();
