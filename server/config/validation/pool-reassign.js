;(function(){
  'use strict';

  var validate = require('validate.js');

  module.exports = function() {
    return {
      selectedJurors: {
        jurorSelect: {},
      },
    };
  };

  validate.validators.jurorSelect = function(value, options, key, attributes) {
    var message = {
      summary: '',
      details: [],
    };

    if (!attributes.selectedJurors) {
      message.summary = 'Select at least one juror';
      message.details.push('Select at least one juror');
    }

    if (message.summary !== '') {
      return message;
    }

    return null;
  };
})();
