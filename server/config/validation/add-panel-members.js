;(function(){
  'use strict';

  module.exports = function() {
    return {
      jurorType: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Select which group of jurors you want to generate more panel members from',
            details: 'Select which group of jurors you want to generate more panel members from',
          },
        },
      },
      noJurors: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter how many extra jurors are needed on this panel',
            details: 'Enter how many extra jurors are needed on this panel',
          },
        },
      },
    };
  };

})();
