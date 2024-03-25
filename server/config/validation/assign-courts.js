(function() {
  'use strict';

  module.exports.assignCourts = function() {
    return {
      selectedCourts: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Select one or more courts',
            details: 'Select one or more courts',
          },
        },
      },
    };
  };

})();
