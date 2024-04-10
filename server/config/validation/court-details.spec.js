(function() {
  'use strict';
  var validate = require('validate.js')
    , validator = require('./court-details')
    , validatorResult = null;

  describe('Administration - Edit court details validators:', function() {

    beforeEach(function() {
      validatorResult = null;
    });

    it('should successfully validate selected user type', function() {
      const mockRequest = {
        mainPhoneNumber: '01234567890',
        defaultAttendanceTimeHour: '09',
        defaultAttendanceTimeMinute: '30',
        defaultAttendanceTimePeriod: 'am',
        assemblyRoomId: '1',
        costCentre: 'CSTCTR1',
        signature: 'signature',
      };

      validatorResult = validate(mockRequest, validator.courtDetails());
      expect(validatorResult).toBeUndefined();
    });

    it('should try to validate an invalid request - all require fields missing', function() {
      const mockRequest = {
        mainPhoneNumber: '',
        defaultAttendanceTimeHour: '',
        defaultAttendanceTimeMinute: '',
        defaultAttendanceTimePeriod: '',
        assemblyRoomId: '',
        costCentre: '',
        signature: '',
      };

      validatorResult = validate(mockRequest, validator.courtDetails());

      expect(validatorResult).toEqual(expect.any(Object));

      expect(validatorResult.mainPhoneNumber[0]).toHaveProperty('summary');
      expect(validatorResult.mainPhoneNumber[0].summary).toEqual('Enter a main telephone number');
      expect(validatorResult.mainPhoneNumber[0].details).toEqual('Enter a main telephone number');

      expect(validatorResult.defaultAttendanceTimeHour[0]).toHaveProperty('summary');
      expect(validatorResult.defaultAttendanceTimeHour[0].summary).toEqual('Enter an hour for default attendance time');
      expect(validatorResult.defaultAttendanceTimeHour[0].details).toEqual('Enter an hour for default attendance time');

      expect(validatorResult.defaultAttendanceTimeMinute[0]).toHaveProperty('summary');
      expect(validatorResult.defaultAttendanceTimeMinute[0].summary).toEqual('Enter minutes for default attendance time');
      expect(validatorResult.defaultAttendanceTimeMinute[0].details).toEqual('Enter minutes for default attendance time');

      expect(validatorResult.defaultAttendanceTimePeriod[0]).toHaveProperty('summary');
      expect(validatorResult.defaultAttendanceTimePeriod[0].summary).toEqual('Select whether check out time is am or pm');
      expect(validatorResult.defaultAttendanceTimePeriod[0].details).toEqual('Select whether check out time is am or pm');

      expect(validatorResult.assemblyRoomId[0]).toHaveProperty('summary');
      expect(validatorResult.assemblyRoomId[0].summary).toEqual('Select an assembly room');
      expect(validatorResult.assemblyRoomId[0].details).toEqual('Select an assembly room');

      expect(validatorResult.costCentre[0]).toHaveProperty('summary');
      expect(validatorResult.costCentre[0].summary).toEqual('Enter a cost centre');
      expect(validatorResult.costCentre[0].details).toEqual('Enter a cost centre');

      expect(validatorResult.signature[0]).toHaveProperty('summary');
      expect(validatorResult.signature[0].summary).toEqual('Enter a signature');
      expect(validatorResult.signature[0].details).toEqual('Enter a signature');
    });
  });

  it('should try to validate an invalid request - all require fields missing', function() {
    const mockRequest = {
      mainPhoneNumber: '',
      defaultAttendanceTimeHour: '',
      defaultAttendanceTimeMinute: '',
      defaultAttendanceTimePeriod: '',
      assemblyRoomId: '',
      costCentre: '',
      signature: '',
    };

    validatorResult = validate(mockRequest, validator.courtDetails());

    expect(validatorResult).toEqual(expect.any(Object));

    expect(validatorResult.mainPhoneNumber[0]).toHaveProperty('summary');
    expect(validatorResult.mainPhoneNumber[0].summary).toEqual('Enter a main telephone number');
    expect(validatorResult.mainPhoneNumber[0].details).toEqual('Enter a main telephone number');

    expect(validatorResult.defaultAttendanceTimeHour[0]).toHaveProperty('summary');
    expect(validatorResult.defaultAttendanceTimeHour[0].summary).toEqual('Enter an hour for default attendance time');
    expect(validatorResult.defaultAttendanceTimeHour[0].details).toEqual('Enter an hour for default attendance time');

    expect(validatorResult.defaultAttendanceTimeMinute[0]).toHaveProperty('summary');
    expect(validatorResult.defaultAttendanceTimeMinute[0].summary).toEqual('Enter minutes for default attendance time');
    expect(validatorResult.defaultAttendanceTimeMinute[0].details).toEqual('Enter minutes for default attendance time');

    expect(validatorResult.defaultAttendanceTimePeriod[0]).toHaveProperty('summary');
    expect(validatorResult.defaultAttendanceTimePeriod[0].summary).toEqual('Select whether check out time is am or pm');
    expect(validatorResult.defaultAttendanceTimePeriod[0].details).toEqual('Select whether check out time is am or pm');

    expect(validatorResult.assemblyRoomId[0]).toHaveProperty('summary');
    expect(validatorResult.assemblyRoomId[0].summary).toEqual('Select an assembly room');
    expect(validatorResult.assemblyRoomId[0].details).toEqual('Select an assembly room');

    expect(validatorResult.costCentre[0]).toHaveProperty('summary');
    expect(validatorResult.costCentre[0].summary).toEqual('Enter a cost centre');
    expect(validatorResult.costCentre[0].details).toEqual('Enter a cost centre');

    expect(validatorResult.signature[0]).toHaveProperty('summary');
    expect(validatorResult.signature[0].summary).toEqual('Enter a signature');
    expect(validatorResult.signature[0].details).toEqual('Enter a signature');
  });

  it('should try to validate an invalid request - time value out of bounds', function() {
    const mockRequest = {
      mainPhoneNumber: '01234567890',
      defaultAttendanceTimeHour: '44',
      defaultAttendanceTimeMinute: '-11',
      defaultAttendanceTimePeriod: 'am',
      assemblyRoomId: '1',
      costCentre: 'CSTCTR1',
      signature: 'signature',
    };

    validatorResult = validate(mockRequest, validator.courtDetails());

    expect(validatorResult).toEqual(expect.any(Object));

    expect(validatorResult.defaultAttendanceTimeHour[0]).toHaveProperty('summary');
    expect(validatorResult.defaultAttendanceTimeHour[0].summary).toEqual('Enter an hour between 1 and 12');
    expect(validatorResult.defaultAttendanceTimeHour[0].details).toEqual('Enter an hour between 1 and 12');

    expect(validatorResult.defaultAttendanceTimeMinute[0]).toHaveProperty('summary');
    expect(validatorResult.defaultAttendanceTimeMinute[0].summary).toEqual('Enter minutes between 0 and 59');
    expect(validatorResult.defaultAttendanceTimeMinute[0].details).toEqual('Enter minutes between 0 and 59');
  });

  it('should try to validate an invalid request - time value contains special characters or letter', function() {
    const mockRequest = {
      mainPhoneNumber: '01234567890',
      defaultAttendanceTimeHour: '4a4',
      defaultAttendanceTimeMinute: '!!',
      defaultAttendanceTimePeriod: 'am',
      assemblyRoomId: '1',
      costCentre: 'CSTCTR1',
      signature: 'signature',
    };

    validatorResult = validate(mockRequest, validator.courtDetails());

    expect(validatorResult).toEqual(expect.any(Object));

    expect(validatorResult.defaultAttendanceTimeHour[0]).toHaveProperty('summary');
    expect(validatorResult.defaultAttendanceTimeHour[0].summary).toEqual('Enter an hour between 1 and 12');
    expect(validatorResult.defaultAttendanceTimeHour[0].details).toEqual('Enter an hour between 1 and 12');

    expect(validatorResult.defaultAttendanceTimeMinute[0]).toHaveProperty('summary');
    expect(validatorResult.defaultAttendanceTimeMinute[0].summary).toEqual('Enter minutes between 0 and 59');
    expect(validatorResult.defaultAttendanceTimeMinute[0].details).toEqual('Enter minutes between 0 and 59');
  });

})();
