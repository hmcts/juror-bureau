;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const { dateFilter } = require('../components/filters');

  module.exports.completeServiceDAO = new DAO('moj/complete-service/', {
    patch: function(/** @type {{ pool: number; completionDate: string; selectedJurors: number[]; }} */ opts) {
      const uri = `${this.resource}${opts.pool}/complete`;
      const body = {
        'completion_date': dateFilter(opts.completionDate, 'DD/MM/YYYY', 'YYYY-MM-DD'),
        'juror_numbers': opts.selectedJurors,
      };

      return { uri, body };
    }}
  );
})();
