/* eslint-disable strict */

module.exports = function() {
  return {
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
