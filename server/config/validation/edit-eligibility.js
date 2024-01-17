;(function(){
  'use strict';

  require('./custom-validation');

  module.exports = function() {
    return {
      residency: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Please tell us about where the person you\'re answering for lives or has lived.',
            details: 'Please tell us about where the person you\'re answering for lives or has lived.',
          }
        },
      },
      residencyDetails: {
        presenceIf: {
          field: 'residency',
          value: 'No',
          message: {
            summary: 'Please give details about the person\'s residency',
            details: 'Please give details about the person\'s residency',
          },
        },
        length: {
          maximum: 1000,
          message: {
            summary: 'Please ensure that your reason is not too long',
            details: 'Please ensure that your reason is not too long',
          },
        }
      },

      mentalHealthAct: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Please answer the question about the Mental Health and Capacity acts',
            details: 'Please answer the question about the Mental Health and Capacity acts',
          }
        },
      },
      mentalHealthActDetails: {
        presenceIf: {
          field: 'mentalHealthAct',
          value: 'Yes',
          message: {
            summary: 'Please give details about the Mental Health and Capacity acts',
            details: 'Please give details about the Mental Health and Capacity acts',
          },
        },
        length: {
          maximum: 2020,
          message: {
            summary: 'Please ensure that your reason is not too long',
            details: 'Please ensure that your reason is not too long',
          },
        }
      },

      bail: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Please tell us if the person you\'re answering for is on bail for a criminal offence',
            details: 'Please tell us if the person you\'re answering for is on bail for a criminal offence',
          }
        },
      },
      bailDetails: {
        presenceIf: {
          field: 'bail',
          value: 'Yes',
          message: {
            summary: 'Please give details about the person\'s bail',
            details: 'Please give details about the person\'s bail',
          }
        },
        length: {
          maximum: 1000,
          message: {
            summary: 'Please ensure that your reason is not too long',
            details: 'Please ensure that your reason is not too long',
          }
        },
      },

      convictions: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Please tell us if the person you\'re answering for has been found guilty of a criminal offence with a prison sentence, community order or suspended prison sentence.',
            details: 'Please tell us if the person you\'re answering for has been found guilty of a criminal offence with a prison sentence, community order or suspended prison sentence.',
          }
        },
      },
      convictionsDetails: {
        presenceIf: {
          field: 'convictions',
          value: 'Yes',
          message: {
            summary: 'Please give details about the person\'s criminal offence',
            details: 'Please give details about the person\'s criminal offence',
          }
        },
        length: {
          maximum: 1000,
          message: {
            summary: 'Please ensure that your reason is not too long',
            details: 'Please ensure that your reason is not too long',
          }
        }
      },
    };
  };
})();
