/* eslint-disable */
(function() {
  'use strict';

  const validate = require('validate.js'),
      changeTimesValidator = require('./change-attendance-times').changeAttendanceTimes();

  let validatorResult = null;

  describe('Change attendance times form - validator:', function() {

    beforeEach(function() {
      validatorResult = null;
    });

    it('should validate a valid request - check out entered', function() {
      let mockRequest = {
        checkInTime: {
          hour: '07',
          minute: '30',
          period: 'am',
        },
        checkOutTime: {
          hour: '08',
          minute: '30',
          period: 'pm',
        }
      };

      validatorResult = validate(mockRequest, changeTimesValidator);

      expect(validatorResult).to.be.undefined;
    });

    it('should validate a valid request - no check out entered', function() {
      let mockRequest = {
        checkInTime: {
          hour: '07',
          minute: '30',
          period: 'am',
        },
        checkOutTime: {
          hour: '',
          minute: '',
        }
      };

      validatorResult = validate(mockRequest, changeTimesValidator);

      expect(validatorResult).to.be.undefined;
    });

    it('should validate an invalid request - missing checking in hours and mins', function() {
      let mockRequest = {
        checkInTime: {
          hour: '',
          minute: '',
          period: 'am',
        },
        checkOutTime: {
          hour: '',
          minute: '',
        }
      };

      validatorResult = validate(mockRequest, changeTimesValidator);

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('checkInTime');
      expect(validatorResult.checkInTime[0]).to.have.ownPropertyDescriptor('checkInTime');
      expect(validatorResult.checkInTime[0].checkInTime[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.checkInTime[0].checkInTime[0].details).to.equal('Enter a check in time or delete this juror\'s attendance');
    });

    it('should validate an invalid request - missing check in hours', function() {
      let mockRequest = {
        checkInTime: {
          hour: '',
          minute: '30',
          period: 'am',
        },
        checkOutTime: {
          hour: '',
          minute: '',
        }
      };

      validatorResult = validate(mockRequest, changeTimesValidator);

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('checkInTime');
      expect(validatorResult.checkInTime[0]).to.have.ownPropertyDescriptor('checkInTimeHour');
      expect(validatorResult.checkInTime[0].checkInTimeHour[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.checkInTime[0].checkInTimeHour[0].details).to.equal('Enter an hour for check in time or delete this juror\'s attendance');
    });

    it('should validate an invalid request - check in hours less than 1', function() {
      let mockRequest = {
        checkInTime: {
          hour: '0',
          minute: '30',
          period: 'am',
        },
        checkOutTime: {
          hour: '',
          minute: '',
        }
      };

      validatorResult = validate(mockRequest, changeTimesValidator);

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('checkInTime');
      expect(validatorResult.checkInTime[0]).to.have.ownPropertyDescriptor('checkInTimeHour');
      expect(validatorResult.checkInTime[0].checkInTimeHour[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.checkInTime[0].checkInTimeHour[0].details).to.equal('Enter an hour between 1 and 12');
    });

    it('should validate an invalid request - check in hours more than 12', function() {
      let mockRequest = {
        checkInTime: {
          hour: '13',
          minute: '30',
          period: 'am',
        },
        checkOutTime: {
          hour: '',
          minute: '',
        }
      };

      validatorResult = validate(mockRequest, changeTimesValidator);

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('checkInTime');
      expect(validatorResult.checkInTime[0]).to.have.ownPropertyDescriptor('checkInTimeHour');
      expect(validatorResult.checkInTime[0].checkInTimeHour[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.checkInTime[0].checkInTimeHour[0].details).to.equal('Enter an hour between 1 and 12');
    });

    it('should validate an invalid request - check in hours invalid char', function() {
      let mockRequest = {
        checkInTime: {
          hour: '!!',
          minute: '30',
          period: 'am',
        },
        checkOutTime: {
          hour: '',
          minute: '',
        }
      };

      validatorResult = validate(mockRequest, changeTimesValidator);

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('checkInTime');
      expect(validatorResult.checkInTime[0]).to.have.ownPropertyDescriptor('checkInTimeHour');
      expect(validatorResult.checkInTime[0].checkInTimeHour[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.checkInTime[0].checkInTimeHour[0].details).to.equal('Check in time must only include numbers - you cannot enter letters or special characters');
    });

    it('should validate an invalid request - missing check in minutes', function() {
      let mockRequest = {
        checkInTime: {
          hour: '08',
          minute: '',
          period: 'am',
        },
        checkOutTime: {
          hour: '',
          minute: '',
        }
      };

      validatorResult = validate(mockRequest, changeTimesValidator);

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('checkInTime');
      expect(validatorResult.checkInTime[0]).to.have.ownPropertyDescriptor('checkInTimeMinute');
      expect(validatorResult.checkInTime[0].checkInTimeMinute[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.checkInTime[0].checkInTimeMinute[0].details).to.equal('Enter minutes for check in time or delete this juror\'s attendance');
    });

    it('should validate an invalid request - check in minutes more than 59', function() {
      let mockRequest = {
        checkInTime: {
          hour: '08',
          minute: '60',
          period: 'am',
        },
        checkOutTime: {
          hour: '',
          minute: '',
        }
      };

      validatorResult = validate(mockRequest, changeTimesValidator);

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('checkInTime');
      expect(validatorResult.checkInTime[0]).to.have.ownPropertyDescriptor('checkInTimeMinute');
      expect(validatorResult.checkInTime[0].checkInTimeMinute[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.checkInTime[0].checkInTimeMinute[0].details).to.equal('Enter minutes between 0 and 59');
    });

    it('should validate an invalid request - check in miute invalid char', function() {
      let mockRequest = {
        checkInTime: {
          hour: '08',
          minute: '!!',
          period: 'am',
        },
        checkOutTime: {
          hour: '',
          minute: '',
        }
      };

      validatorResult = validate(mockRequest, changeTimesValidator);

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('checkInTime');
      expect(validatorResult.checkInTime[0]).to.have.ownPropertyDescriptor('checkInTimeMinute');
      expect(validatorResult.checkInTime[0].checkInTimeMinute[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.checkInTime[0].checkInTimeMinute[0].details).to.equal('Check in time must only include numbers - you cannot enter letters or special characters');
    });

    it('should validate an invalid request - missing check in period', function() {
      let mockRequest = {
        checkInTime: {
          hour: '08',
          minute: '30',
        },
        checkOutTime: {
          hour: '',
          minute: '',
        }
      };

      validatorResult = validate(mockRequest, changeTimesValidator);

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('checkInTime');
      expect(validatorResult.checkInTime[0]).to.have.ownPropertyDescriptor('checkInTimePeriod');
      expect(validatorResult.checkInTime[0].checkInTimePeriod[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.checkInTime[0].checkInTimePeriod[0].details).to.equal('Select whether check in time is am or pm or delete this juror\'s attendance');
    });

    it('should validate an invalid request - missing check out hour', function() {
      let mockRequest = {
        checkInTime: {
          hour: '08',
          minute: '30',
          period: 'am',
        },
        checkOutTime: {
          hour: '',
          minute: '30',
          period: 'pm'
        }
      };

      validatorResult = validate(mockRequest, changeTimesValidator);

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('checkOutTime');
      expect(validatorResult.checkOutTime[0]).to.have.ownPropertyDescriptor('checkOutTimeHour');
      expect(validatorResult.checkOutTime[0].checkOutTimeHour[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.checkOutTime[0].checkOutTimeHour[0].details).to.equal('Enter an hour for check out time');
    });

    it('should validate an invalid request - check out hours less than 1', function() {
      let mockRequest = {
        checkInTime: {
          hour: '08',
          minute: '30',
          period: 'am',
        },
        checkOutTime: {
          hour: '0',
          minute: '30',
          period: 'pm',
        }
      };

      validatorResult = validate(mockRequest, changeTimesValidator);

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('checkOutTime');
      expect(validatorResult.checkOutTime[0]).to.have.ownPropertyDescriptor('checkOutTimeHour');
      expect(validatorResult.checkOutTime[0].checkOutTimeHour[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.checkOutTime[0].checkOutTimeHour[0].details).to.equal('Enter an hour between 1 and 12');
    });

    it('should validate an invalid request - check out hours more than 12', function() {
      let mockRequest = {
        checkInTime: {
          hour: '08',
          minute: '30',
          period: 'am',
        },
        checkOutTime: {
          hour: '13',
          minute: '30',
          period: 'pm',
        }
      };

      validatorResult = validate(mockRequest, changeTimesValidator);

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('checkOutTime');
      expect(validatorResult.checkOutTime[0]).to.have.ownPropertyDescriptor('checkOutTimeHour');
      expect(validatorResult.checkOutTime[0].checkOutTimeHour[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.checkOutTime[0].checkOutTimeHour[0].details).to.equal('Enter an hour between 1 and 12');
    });

    it('should validate an invalid request - check in hours invalid char', function() {
      let mockRequest = {
        checkInTime: {
          hour: '08',
          minute: '30',
          period: 'am',
        },
        checkOutTime: {
          hour: '!!',
          minute: '30',
          period: 'pm',
        }
      };

      validatorResult = validate(mockRequest, changeTimesValidator);

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('checkOutTime');
      expect(validatorResult.checkOutTime[0]).to.have.ownPropertyDescriptor('checkOutTimeHour');
      expect(validatorResult.checkOutTime[0].checkOutTimeHour[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.checkOutTime[0].checkOutTimeHour[0].details).to.equal('Check out time must only include numbers - you cannot enter letters or special characters');
    });

    it('should validate an invalid request - missing check out minutes', function() {
      let mockRequest = {
        checkInTime: {
          hour: '08',
          minute: '30',
          period: 'am',
        },
        checkOutTime: {
          hour: '09',
          minute: '',
          period: 'pm'
        }
      };

      validatorResult = validate(mockRequest, changeTimesValidator);

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('checkOutTime');
      expect(validatorResult.checkOutTime[0]).to.have.ownPropertyDescriptor('checkOutTimeMinute');
      expect(validatorResult.checkOutTime[0].checkOutTimeMinute[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.checkOutTime[0].checkOutTimeMinute[0].details).to.equal('Enter minutes for check out time');
    });

    it('should validate an invalid request - check out minutes more than 59', function() {
      let mockRequest = {
        checkInTime: {
          hour: '08',
          minute: '30',
          period: 'am',
        },
        checkOutTime: {
          hour: '09',
          minute: '60',
          period: 'pm',
        }
      };

      validatorResult = validate(mockRequest, changeTimesValidator);

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('checkOutTime');
      expect(validatorResult.checkOutTime[0]).to.have.ownPropertyDescriptor('checkOutTimeMinute');
      expect(validatorResult.checkOutTime[0].checkOutTimeMinute[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.checkOutTime[0].checkOutTimeMinute[0].details).to.equal('Enter minutes between 0 and 59');
    });

    it('should validate an invalid request - check in hours invalid char', function() {
      let mockRequest = {
        checkInTime: {
          hour: '08',
          minute: '30',
          period: 'am',
        },
        checkOutTime: {
          hour: '09',
          minute: '!!',
          period: 'pm',
        }
      };

      validatorResult = validate(mockRequest, changeTimesValidator);

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('checkOutTime');
      expect(validatorResult.checkOutTime[0]).to.have.ownPropertyDescriptor('checkOutTimeMinute');
      expect(validatorResult.checkOutTime[0].checkOutTimeMinute[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.checkOutTime[0].checkOutTimeMinute[0].details).to.equal('Check out time must only include numbers - you cannot enter letters or special characters');
    });

    it('should validate an invalid request - missing check out period', function() {
      let mockRequest = {
        checkInTime: {
          hour: '08',
          minute: '30',
          period: 'am',
        },
        checkOutTime: {
          hour: '09',
          minute: '30',
          period: ''
        }
      };

      validatorResult = validate(mockRequest, changeTimesValidator);

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('checkOutTime');
      expect(validatorResult.checkOutTime[0]).to.have.ownPropertyDescriptor('checkOutTimePeriod');
      expect(validatorResult.checkOutTime[0].checkOutTimePeriod[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.checkOutTime[0].checkOutTimePeriod[0].details).to.equal('Select whether check out time is am or pm');
    });

    it('should validate an invalid request - check out time before check in time', function() {
      let mockRequest = {
        checkInTime: {
          hour: '08',
          minute: '30',
          period: 'am',
        },
        checkOutTime: {
          hour: '07',
          minute: '30',
          period: 'am'
        }
      };

      validatorResult = validate(mockRequest, changeTimesValidator);

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('checkOutTime');
      expect(validatorResult.checkOutTime[0]).to.have.ownPropertyDescriptor('checkOutTime');
      expect(validatorResult.checkOutTime[0].checkOutTime[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.checkOutTime[0].checkOutTime[0].details).to.equal('Check out time cannot be earlier than check in time');
    });

  });

})();
