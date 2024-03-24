const { DAO } = require('./dataAccessObject');

;(function(){
  'use strict';

  // TODO Stub to be updated once back end is available
  module.exports.policeCheckDAO = new DAO('moj/police-check/{}', {
    post: function() {
      return { debug: Promise.resolve() };
    }}
  );
})();

