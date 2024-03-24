;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');

  module.exports.assignMultiDAO = new DAO('bureau/staff/assign-multi', {
    post: function(assignTo, responses) {
      const body = {
        assignTo: (typeof assignTo === 'string' && assignTo.length > 0) ? assignTo : null,
        responses: responses,
      };

      return { body };
    }}
  );
})();
