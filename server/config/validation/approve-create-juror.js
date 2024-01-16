(() => {
  'use strict';

  const validate = require('validate.js');

  module.exports = () => ({
    'approveReject': {
      presence: {
        message: {
          summary: 'Select whether you want to approve or reject this pending juror',
          details: ['Select whether you want to approve or reject this pending juror'],
        }},
    },
    'rejectComments': {
      rejectComments: {},
    },
  });

  validate.validators.rejectComments = (value, options, key, attributes) => {
    if (attributes['approveReject'] === 'REJECT' && attributes['rejectComments'].length === 0) {
      return {
        summary: 'You must enter a comment about why you rejected this pending juror',
        details: ['You must enter a comment about why you rejected this pending juror'],
      };
    }

    return null;
  };

})();
