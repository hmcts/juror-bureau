;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');

  module.exports.searchResponsesDAO = new DAO('moj/juror-response/retrieve');

})();
