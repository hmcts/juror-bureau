;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');

  module.exports.searchDAO = new DAO('moj/juror-response/retrieve', {
    post: function(body) {
      return { body };
    }}
  );
})();
