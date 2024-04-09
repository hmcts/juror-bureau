/* eslint-disable strict */

const validate = require('validate.js');
const { dateFilter } = require('../../components/filters');

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
    differentDate: {
      jurorsOnTrialDifferentDate: {
        attendanceDate: body.attendanceDate,
      },
    },
  };
};

validate.validators.jurorsOnTrialDifferentDate = (value, options, key, attributes) => {
  if (!attributes.attendanceDate || attributes.attendanceDate !== 'differentDate') return null;

  const message = {
    summary: '',
    details: [],
  };

  if (!value) {
    message.summary = 'Enter date that you’re confirming attendance for';
    message.details.push('Enter date that you’re confirming attendance for');

    return message;
  };

  if (!value.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    message.summary = 'Enter a date in the correct format, for example, 31/01/2023';
    message.details.push('Enter a date in the correct format, for example, 31/01/2023');

    return message;
  }

  const formattedDate = dateFilter(value, 'DD/MM/YYYY', 'YYYY-MM-DD');
  const tomorrow = new Date();

  tomorrow.setDate(tomorrow.getDate());

  if (new Date(formattedDate) > tomorrow) {
    message.summary = 'The date you enter must be today or in the past';
    message.details.push('The date you enter must be today or in the past');

    return message;
  }

  return null;
};
