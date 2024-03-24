;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');

  module.exports.assignDAO = new DAO('bureau/staff/assign', {
    post: function(jurorNumber, assignTo, version) {
      const body = {
        responseJurorNumber: jurorNumber,
        assignTo: (typeof assignTo === 'string' && assignTo.length > 0) ? assignTo : null,
        version: parseInt(version, 10),
      };

      return { body };
    }}
  );
})();
