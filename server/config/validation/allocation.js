(function() {
  'use strict';

  var validate = require('validate.js');

  module.exports = function() {

    return {
      replies: {
        replies: {}
      }
      ,
      staff: {
        staffSelected: {}
      }
    };
  };

  validate.validators.replies = function(value, options, key, attributes) {
    var message = {
      summary: '',
      details: []
    };

    if (attributes.allocateSuperUrgent === '' &&
    attributes.allocateUrgent === '' &&
    attributes.allocateNonUrgent === '') {
      message.summary = 'Enter how many replies you want to assign to each selected officer - you must enter a number in at least one box';
      message.details.push('Enter how many replies you want to assign to each selected officer - you must enter a number in at least one box');
    }

    if (message.summary !== '') {
      return message;
    }

    return null;
  };

  validate.validators.staffSelected = function(value, options, key, attributes) {
    var message = {
      summary: '',
      details: []
    };

    if (!attributes.selectedstaff) {
      message.summary = 'Select at least 1 officer to assign replies to';
      message.details.push('Select at least 1 officer to assign replies to');
    }

    if (message.summary !== '') {
      return message;
    }

    return null;
  };

})();
