;(function(){
  'use strict';

  var validate = require('validate.js');

  module.exports = function(checkedJurors) {
    return {
      selectedJurors: {
        lettersJurorSelect: {
          checkedJurors,
        },
      },
    };
  };

  validate.validators.lettersJurorSelect = function(_, options) {
    var message = {
      summary: '',
      details: [],
    };

    if (!options.checkedJurors || !options.checkedJurors.length) {
      message.summary = 'Select at least one juror';
      message.details.push('Select at least one juror');
    }

    if (message.summary !== '') {
      return message;
    }

    return null;
  };
})();
