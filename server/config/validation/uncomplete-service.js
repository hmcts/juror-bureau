;(function(){
  'use strict';

  require('./custom-validation');

  module.exports.searchOptions = function() {
    return {
      searchCompletedJurors: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Select whether you want to search by juror or pool',
            details: 'Select whether you want to search by juror or pool',
          },
        },
      },
    };
  };
  module.exports.searchByJuror = function() {
    return {
      searchByJuror: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter juror name, number or postcode',
            details: 'Enter juror name, number or postcode',
          },
        },
      },
    };
  };
  module.exports.searchByPool = function() {
    return {
      searchByPool: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter a pool number',
            details: 'Enter a pool number',
          },
        },
      },
    };
  };
})();
