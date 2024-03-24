;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');

  module.exports.assignmentsMultiDAO = new DAO('bureau/staff/assignments-multi', {
    post: function(jurorNumbers) {
      const body = {
        jurorNumbers: jurorNumbers,
      };

      return { body };
    }}
  );
})();
