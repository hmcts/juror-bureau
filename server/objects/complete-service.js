;(function(){
  'use strict';

  const { dateFilter } = require('../components/filters')
  const { DAO } = require('./dataAccessObject');

  module.exports.completeService = new DAO('moj/complete-service', {
    patch: function({pool, completionDate, selectedJurors}) {
      return {
        uri: `${this.resource}/${pool}/complete`,
        body: {
          'completionDate': dateFilter(completionDate, 'DD/MM/YYYY', 'YYYY-MM-DD'),
          'jurorNumbers': selectedJurors,
        },
      }
    }
  });

})();
