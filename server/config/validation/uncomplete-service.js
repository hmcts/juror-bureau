;(function(){
  'use strict';

  require('./custom-validation');

  module.exports.searchOptions = function() {
    return {
      searchCompletedJurors: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Select whether you want to search by juror number, juror name or pool',
            details: 'Select whether you want to search by juror number, juror name or pool',
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
            summary: 'Enter juror number',
            details: 'Enter juror number',
          },
        },
      },
    };
  };
  module.exports.searchByJurorName = function() {
    return {
      searchByJurorName: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter juror name',
            details: 'Enter juror name',
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
