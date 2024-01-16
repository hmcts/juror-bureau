;(function(){
  'use strict';

  module.exports = function() {
    return {
      selectedResponses: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Select the replies you want to send',
            details: 'Select the replies you want to send',
            summaryLink: 'sendToButtonMulti'
          }
        },
      },
    };
  };
})();
