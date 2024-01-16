(function() {
  'use strict';

  var validate = require('validate.js')

  module.exports.processAction = function() {
    return {
      processActionType: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Please select a response process type',
            details: 'Please select a response process type'
          }
        }
      }
    }
  }

  module.exports.requestInfo = function() {
    return {
      requestInfo: {
        requestInfo: {}
      }
    }
  }

  validate.validators.requestInfo = function(...args) {
    var message = {
        summary: 'Select what information you need from the juror',
        details: [],
        summaryLink: 'info-jurorDetails'
      },
      attributes = args[3];

    // the object will always have at least 1 element because it contains the _csrf key so
    // we can check for its keys lenght and if it is bigger than 1, it means something was selected, if not we error
    if (Object.keys(attributes).length === 1 && Object.keys(attributes)[0] === '_csrf') {
      message.details.push('Select what information you need from the juror');
    }

    // Feedback
    if (message.details.length > 0) {
      return message;
    }

    return null;
  }

})();
