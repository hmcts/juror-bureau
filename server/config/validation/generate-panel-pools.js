;(function(){
  'use strict';

  var validate = require('validate.js');

  module.exports = function() {
    return {
      selectedPools: {
        selectedPools: {},
      },
    };
  };

  validate.validators.selectedPools = function(value, options, key, attributes) {

    let tmpErrors = [];

    if (!attributes.selectedPools) {
      tmpErrors = [{
        summary: 'Select which pools you want to use jurors from',
        details: 'Select which pools you want to use jurors from',
      }];
    }
    return tmpErrors.length === 0
      ? null
      : tmpErrors;
  };
})();
