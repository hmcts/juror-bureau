const Joi = require('joi');
const { validateJoiSchema } = require('./index');
const { buildTimeFieldSchema } = require('./time-validation');

const checkOutTimeMessageMapping = {
  missingHour: 'Enter an hour for check out time',
  invalidHour: 'Enter an hour between 0 and 12',
  missingMinutes: 'Enter minutes for check out time',
  invalidMinutes: 'Enter minutes between 0 and 59',
  missingPeriod: 'Select whether check out time is am or pm',
};

const schema = Joi.object({
  checkOutTimeHour: buildTimeFieldSchema({
    prefix: 'checkOutTime',
    part: 'Hour',
    messages: { 
      missing: checkOutTimeMessageMapping.missingHour,
      invalidRange: checkOutTimeMessageMapping.invalidHour,
    },
  }),
  checkOutTimeMinute: buildTimeFieldSchema({
    prefix: 'checkOutTime',
    part: 'Minute',
    messages: {
      missing: checkOutTimeMessageMapping.missingMinutes,
      invalidRange: checkOutTimeMessageMapping.invalidMinutes,
    },
  }),
  checkOutTimePeriod: buildTimeFieldSchema({
    prefix: 'checkOutTime',
    part: 'Period',
    messages: {
      missing: checkOutTimeMessageMapping.missingPeriod,
    },
  }),
});

module.exports = (body) => validateJoiSchema(schema, body);
