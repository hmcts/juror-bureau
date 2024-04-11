/* eslint-disable strict */

module.exports = function() {
  return {
    idMatches: {
      presence: {
        allowEmpty: false,
        message: {
          summary: 'Check if the ID matches the name of the juror record',
          details: 'Check if the ID matches the name of the juror record',
        },
      },
    },
    idType: {
      presence: {
        allowEmpty: false,
        message: {
          summary: 'Select an ID type',
          details: 'Select an ID type',
        },
      },
    },
  };
};
