/* eslint-disable */
(function() {
  'use strict';

  var validate = require('validate.js')
    , validator = require('./return-panel-jury')
    , validatorResult = null;

  describe('Return Panel selection validators:', function() {

    beforeEach(function() {
      validatorResult = null;
    });

    it('should validate jurors have been selected', function() {
      var mockRequest = {
        selectedJurors: ['123456789', '987654321'],
      };

      validatorResult = validate(mockRequest, validator.returnPanel(mockRequest));

      expect(validatorResult).to.be.undefined;
    });

    it('should validate that no jurors have been selected', function() {
      var mockRequest = {
      };

      validatorResult = validate(mockRequest, validator.returnPanel(mockRequest));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult.selectedJurors[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.selectedJurors[0].summary).to.equal('Select at least one panel member to return');;
    });

  });

  describe('Return Jury selection validators:', function() {

    beforeEach(function() {
      validatorResult = null;
    });

    it('should validate jurors have been selected', function() {
      var mockRequest = {
        selectedJurors: ['123456789', '987654321'],
      };

      validatorResult = validate(mockRequest, validator.returnJury(mockRequest));

      expect(validatorResult).to.be.undefined;
    });

    it('should validate that no jurors have been selected', function() {
      var mockRequest = {
      };

      validatorResult = validate(mockRequest, validator.returnJury(mockRequest));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult.selectedJurors[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.selectedJurors[0].summary).to.equal('Select at least one juror to return');;
    });

  });

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

      validatorResult = validate(mockRequest, validator.returnAttendanceTimes());

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

      validatorResult = validate(mockRequest, validator.returnAttendanceTimes());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('checkInTime');
      expect(validatorResult.checkInTime[0]).to.have.ownPropertyDescriptor('checkInTime');
      expect(validatorResult.checkInTime[0].checkInTime[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.checkInTime[0].checkInTime[0].details).to.equal('Enter a check in time');
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

      validatorResult = validate(mockRequest, validator.returnAttendanceTimes());

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

      validatorResult = validate(mockRequest, validator.returnAttendanceTimes());

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

      validatorResult = validate(mockRequest, validator.returnAttendanceTimes());

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

      validatorResult = validate(mockRequest, validator.returnAttendanceTimes());

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

      validatorResult = validate(mockRequest, validator.returnAttendanceTimes());

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

      validatorResult = validate(mockRequest, validator.returnAttendanceTimes());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('checkInTime');
      expect(validatorResult.checkInTime[0]).to.have.ownPropertyDescriptor('checkInTimeMinute');
      expect(validatorResult.checkInTime[0].checkInTimeMinute[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.checkInTime[0].checkInTimeMinute[0].details).to.equal('Enter minutes between 0 and 59');
    });

    it('should validate an invalid request - check in minute invalid char', function() {
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

      validatorResult = validate(mockRequest, validator.returnAttendanceTimes());

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

      validatorResult = validate(mockRequest, validator.returnAttendanceTimes());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('checkInTime');
      expect(validatorResult.checkInTime[0]).to.have.ownPropertyDescriptor('checkInTimePeriod');
      expect(validatorResult.checkInTime[0].checkInTimePeriod[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.checkInTime[0].checkInTimePeriod[0].details).to.equal('Select whether check in time is am or pm or delete this juror\'s attendance');
    });

    it('should validate an invalid request - missing checking in hours and mins', function() {
      let mockRequest = {
        checkInTime: {
          hour: '08',
          minute: '30',
          period: 'am',
        },
        checkOutTime: {
          hour: '',
          minute: '',
          period: 'am',
        }
      };

      validatorResult = validate(mockRequest, validator.returnAttendanceTimes());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('checkOutTime');
      expect(validatorResult.checkOutTime[0]).to.have.ownPropertyDescriptor('checkOutTime');
      expect(validatorResult.checkOutTime[0].checkOutTime[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.checkOutTime[0].checkOutTime[0].details).to.equal('Enter a check out time');
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

      validatorResult = validate(mockRequest, validator.returnAttendanceTimes());

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

      validatorResult = validate(mockRequest, validator.returnAttendanceTimes());

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

      validatorResult = validate(mockRequest, validator.returnAttendanceTimes());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('checkOutTime');
      expect(validatorResult.checkOutTime[0]).to.have.ownPropertyDescriptor('checkOutTimeHour');
      expect(validatorResult.checkOutTime[0].checkOutTimeHour[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.checkOutTime[0].checkOutTimeHour[0].details).to.equal('Enter an hour between 1 and 12');
    });

    it('should validate an invalid request - check out hours invalid char', function() {
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

      validatorResult = validate(mockRequest, validator.returnAttendanceTimes());

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

      validatorResult = validate(mockRequest, validator.returnAttendanceTimes());

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

      validatorResult = validate(mockRequest, validator.returnAttendanceTimes());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('checkOutTime');
      expect(validatorResult.checkOutTime[0]).to.have.ownPropertyDescriptor('checkOutTimeMinute');
      expect(validatorResult.checkOutTime[0].checkOutTimeMinute[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.checkOutTime[0].checkOutTimeMinute[0].details).to.equal('Enter minutes between 0 and 59');
    });

    it('should validate an invalid request - check out minutes invalid char', function() {
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

      validatorResult = validate(mockRequest, validator.returnAttendanceTimes());

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

      validatorResult = validate(mockRequest, validator.returnAttendanceTimes());

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

      validatorResult = validate(mockRequest, validator.returnAttendanceTimes());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('checkOutTime');
      expect(validatorResult.checkOutTime[0]).to.have.ownPropertyDescriptor('checkOutTime');
      expect(validatorResult.checkOutTime[0].checkOutTime[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.checkOutTime[0].checkOutTime[0].details).to.equal('Check out time cannot be earlier than check in time');
    });

  });
  
})();
