;(function(){
  'use strict';

  require('./custom-validation');

  module.exports = function() {
    return {
      cjsEmployed: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Answer yes if the person was employed directly by any of these organisations. If they worked as a third party subcontractor, answer no.',
            details: 'Answer yes if the person was employed directly by any of these organisations. If they worked as a third party subcontractor, answer no.',
          },
        },
      },

      cjsEmployer: {
        presenceIf: {
          field: 'cjsEmployed',
          value: 'Yes',
          message: {
            summary: 'Tick any organisations the person worked for directly (not as a third party or subcontractor)',
            details: 'Tick any organisations the person worked for directly (not as a third party or subcontractor)',
          },
        },
      },

      cjsPoliceDetails: {
        presenceIf: {
          field: 'cjsEmployer',
          value: 'Police Force',
          message: {
            summary: 'Please give details of where and when the person worked for the police',
            details: 'Please give details of where and when the person worked for the police',
          },
        },
        length: {
          maximum: 1000,
          message: {
            summary: 'Please ensure that your response is not too long',
            details: 'Please ensure that your response is not too long',
          },
        },
      },

      cjsPrisonDetails: {
        presenceIf: {
          field: 'cjsEmployer',
          value: 'HM Prison Service',
          message: {
            summary: 'Please give details of where and when the person worked for HM Prison Service',
            details: 'Please give details of where and when the person worked for HM Prison Service',
          },
        },
        length: {
          maximum: 1000,
          message: {
            summary: 'Please ensure that your response is not too long',
            details: 'Please ensure that your response is not too long',
          },
        },
      },

      cjsEmployerDetails: {
        presenceIf: {
          field: 'cjsEmployer',
          value: 'Other',
          message: {
            summary: 'Please give details of where and when the person has worked for another Criminal Justice System employer',
            details: 'Please give details of where and when the person has worked for another Criminal Justice System employer',
          },
        },
        length: {
          maximum: 1000,
          message: {
            summary: 'Please ensure that your response is not too long',
            details: 'Please ensure that your response is not too long',
          },
        },
      },

    };
  };
})();
