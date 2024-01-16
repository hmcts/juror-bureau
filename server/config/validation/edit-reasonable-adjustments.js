;(function(){
  'use strict';

  require('./custom-validation');

  module.exports = function() {
    return {
      limitedMobility: {
        presenceIf: {
          field: 'assistanceType',
          value: 'Limited mobility',
          message: {
            summary: 'Please give details of the disability or impairment for the person you\'re replying for',
            details: 'Please give details of the disability or impairment for the person you\'re replying for',
          },
        },
      },

      hearingImpairment: {
        presenceIf: {
          field: 'assistanceType',
          value: 'Hearing impairment',
          message: {
            summary: 'Please give details of the disability or impairment for the person you\'re replying for',
            details: 'Please give details of the disability or impairment for the person you\'re replying for',
          },
        },
      },

      diabetes: {
        presenceIf: {
          field: 'assistanceType',
          value: 'Diabetes',
          message: {
            summary: 'Please give details of the disability or impairment for the person you\'re replying for',
            details: 'Please give details of the disability or impairment for the person you\'re replying for',
          },
        },
      },

      sightImpairment: {
        presenceIf: {
          field: 'assistanceType',
          value: 'Severe sight impairment',
          message: {
            summary: 'Please give details of the disability or impairment for the person you\'re replying for',
            details: 'Please give details of the disability or impairment for the person you\'re replying for',
          },
        },
      },

      learningDisability: {
        presenceIf: {
          field: 'assistanceType',
          value: 'Learning disability',
          message: {
            summary: 'Please give details of the disability or impairment for the person you\'re replying for',
            details: 'Please give details of the disability or impairment for the person you\'re replying for',
          },
        },
      },

      other: {
        presenceIf: {
          field: 'assistanceType',
          value: 'Other',
          message: {
            summary: 'Please give details of the disability or impairment for the person you\'re replying for',
            details: 'Please give details of the disability or impairment for the person you\'re replying for',
          },
        },
      },
    };
  };
})();
