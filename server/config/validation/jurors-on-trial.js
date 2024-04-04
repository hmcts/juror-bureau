/* eslint-disable strict */

module.exports.jurorsOnTrial = function(body) {
  return {
    attendanceDate: {
      presence: {
        allowEmpty: false,
        message: {
          details: 'Select which day you’re confirming attendance for',
          summary: 'Select which day you’re confirming attendance for',
        },
      },
    },
    selectedJurors: {
      presence: {
        allowEmpty: false,
        message: {
          details: 'Select which jurors attended at these times',
          summary: 'Select which jurors attended at these times',
        },
      },
    },
    differentDate: () => {
      if (!body.attendanceDate || body.attendanceDate !== 'differentDate') return null;

      return {
        presence: {
          allowEmpty: false,
          message: {
            details: 'Enter date that you’re confirming attendance for',
            summary: 'Enter date that you’re confirming attendance for',
          },
        },
      };
    },
  };
};
