/* eslint-disable */
(function() {
  'use strict';

  var validate = require('validate.js')
    , validator = require('./messaging')
    , validatorResult = null

  describe('Message template validators:', function() {

    beforeEach(function() {
      validatorResult = null;
    });

    it('should validate a valid request - all possible fields', function() {
      var mockRequest = {
        attendanceDate: '01/01/2024',
        sentenceDate: '01/01/2024',
        attendanceTimeHour: '8',
        attendanceTimeMinute: '45',
        attendanceTimePeriod: 'am',
      };

      validatorResult = validate(mockRequest, validator.messageTemplate());

      expect(validatorResult).toBeUndefined();
    });

    it('should validate a valid request - no attendance time', function() {
      var mockRequest = {
        attendanceDate: '01/01/2024',
        sentenceDate: '01/01/2024',
      };

      validatorResult = validate(mockRequest, validator.messageTemplate());

      expect(validatorResult).toBeUndefined();
    });

    it('should validate a valid request - no sentence date', function() {
      var mockRequest = {
        attendanceDate: '01/01/2024',
        attendanceTimeHour: '8',
        attendanceTimeMinute: '45',
        attendanceTimePeriod: 'am',
      };

      validatorResult = validate(mockRequest, validator.messageTemplate());

      expect(validatorResult).toBeUndefined();
    });

    it('should validate a valid request - no attendance date', function() {
      var mockRequest = {
        sentenceDate: '01/01/2024',
        attendanceTimeHour: '8',
        attendanceTimeMinute: '45',
        attendanceTimePeriod: 'am',
      };

      validatorResult = validate(mockRequest, validator.messageTemplate());

      expect(validatorResult).toBeUndefined();
    });

    it('should validate a valid request - only attendance date', function() {
      var mockRequest = {
        attendanceDate: '01/01/2024',
      };

      validatorResult = validate(mockRequest, validator.messageTemplate());

      expect(validatorResult).toBeUndefined();
    });

    it('should validate a valid request - only sentence date', function() {
      var mockRequest = {
        sentenceDate: '01/01/2024',
      };

      validatorResult = validate(mockRequest, validator.messageTemplate());

      expect(validatorResult).toBeUndefined();
    });

    it('should validate a valid request - only attendance time', function() {
      var mockRequest = {
        attendanceTimeHour: '8',
        attendanceTimeMinute: '45',
        attendanceTimePeriod: 'am',
      };

      validatorResult = validate(mockRequest, validator.messageTemplate());

      expect(validatorResult).toBeUndefined();
    });

    it('should validate a invalid request - empty attendance date', function() {
      var mockRequest = {
        attendanceDate: '',
      };

      validatorResult = validate(mockRequest, validator.messageTemplate());

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult.attendanceDate[0]).toHaveProperty('summary');
      expect(validatorResult.attendanceDate[0].summary).toEqual('Enter an attendance date');
    });

    it('should validate a invalid request - invalid chars in attendance date', function() {
      var mockRequest = {
        attendanceDate: '!!/12/2024',
      };

      validatorResult = validate(mockRequest, validator.messageTemplate());

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult.attendanceDate[0]).toHaveProperty('summary');
      expect(validatorResult.attendanceDate[0].summary).toEqual('Attendance date can only include numbers and forward slashes');
    });

    it('should validate a invalid request - invalid format in attendance date', function() {
      var mockRequest = {
        attendanceDate: '2024//01/01',
      };

      validatorResult = validate(mockRequest, validator.messageTemplate());

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult.attendanceDate[0]).toHaveProperty('summary');
      expect(validatorResult.attendanceDate[0].summary).toEqual('Enter attendance date in the correct format, for example, 31/01/2023');
    });

    it('should validate a invalid request - invalid attendance date', function() {
      var mockRequest = {
        attendanceDate: '31/14/2024',
      };

      validatorResult = validate(mockRequest, validator.messageTemplate());

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult.attendanceDate[0]).toHaveProperty('summary');
      expect(validatorResult.attendanceDate[0].summary).toEqual('Enter a real date');
    });

    it('should validate a invalid request - empty sentence date', function() {
      var mockRequest = {
        sentenceDate: '',
      };

      validatorResult = validate(mockRequest, validator.messageTemplate());

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult.sentenceDate[0]).toHaveProperty('summary');
      expect(validatorResult.sentenceDate[0].summary).toEqual('Enter a sentence date');
    });

    it('should validate a invalid request - invalid chars in sentence date', function() {
      var mockRequest = {
        sentenceDate: '!!/12/2024',
      };

      validatorResult = validate(mockRequest, validator.messageTemplate());

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult.sentenceDate[0]).toHaveProperty('summary');
      expect(validatorResult.sentenceDate[0].summary).toEqual('Sentence date can only include numbers and forward slashes');
    });

    it('should validate a invalid request - invalid format in sentence date', function() {
      var mockRequest = {
        sentenceDate: '2024//01/01',
      };

      validatorResult = validate(mockRequest, validator.messageTemplate());

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult.sentenceDate[0]).toHaveProperty('summary');
      expect(validatorResult.sentenceDate[0].summary).toEqual('Enter sentence date in the correct format, for example, 31/01/2023');
    });

    it('should validate a invalid request - invalid sentence date', function() {
      var mockRequest = {
        sentenceDate: '31/14/2024',
      };

      validatorResult = validate(mockRequest, validator.messageTemplate());

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult.sentenceDate[0]).toHaveProperty('summary');
      expect(validatorResult.sentenceDate[0].summary).toEqual('Enter a real date');
    });

    it('should validate an invalid request - attendance time fields are empty', function() {
      let mockRequest = {
        attendanceTimeHour: '',
        attendanceTimeMinute: '',
        attendanceTimePeriod: '',
      };

      validatorResult = validate(mockRequest, validator.messageTemplate());

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult.attendanceTimeHour[0]).toHaveProperty('details');
      expect(validatorResult.attendanceTimeHour[0].details).toEqual('Enter an attendance time');
    });

    it('should validate an invalid request - attendance time missing hours', function() {
      let mockRequest = {
        attendanceTimeHour: '',
        attendanceTimeMinute: '35',
        attendanceTimePeriod: 'am',
      };

      validatorResult = validate(mockRequest, validator.messageTemplate());

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult.attendanceTimeHour[0]).toHaveProperty('details');
      expect(validatorResult.attendanceTimeHour[0].details).toEqual('Enter an hour for attendance time');
    });

    it('should validate an invalid request - attendance time missing minutes', function() {
      let mockRequest = {
        attendanceTimeHour: '10',
        attendanceTimeMinute: '',
        attendanceTimePeriod: 'am',
      };

      validatorResult = validate(mockRequest, validator.messageTemplate());

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult.attendanceTimeMinute[0]).toHaveProperty('details');
      expect(validatorResult.attendanceTimeMinute[0].details).toEqual('Enter minutes for attendance time');
    });

    it('should validate an invalid request - attendance time contains non number values', function() {
      let mockRequest = {
        attendanceTimeHour: '!!',
        attendanceTimeMinute: 'aa',
        attendanceTimePeriod: 'am',
      };

      validatorResult = validate(mockRequest, validator.messageTemplate());

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult.attendanceTimeHour[0]).toHaveProperty('details');
      expect(validatorResult.attendanceTimeHour[0].details).toEqual('Attendance time must only include numbers - you cannot enter letters or special characters');
      expect(validatorResult.attendanceTimeMinute[0]).toHaveProperty('details');
      expect(validatorResult.attendanceTimeMinute[0].details).toEqual('Attendance time must only include numbers - you cannot enter letters or special characters');
    });

    it('should validate an invalid request - attendance time hours and minutes out of bounds', function() {
      let mockRequest = {
        attendanceTimeHour: '14',
        attendanceTimeMinute: '-1',
        attendanceTimePeriod: 'am',
      };

      validatorResult = validate(mockRequest, validator.messageTemplate());

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult.attendanceTimeHour[0]).toHaveProperty('details');
      expect(validatorResult.attendanceTimeHour[0].details).toEqual('Enter an hour between 0 and 12');
      expect(validatorResult.attendanceTimeMinute[0]).toHaveProperty('details');
      expect(validatorResult.attendanceTimeMinute[0].details).toEqual('Enter minutes between 0 and 59');
    });

    it('should validate an invalid request - attendance time period missing', function() {
      let mockRequest = {
        attendanceTimeHour: '8',
        attendanceTimeMinute: '30',
        attendanceTimePeriod: '',
      };

      validatorResult = validate(mockRequest, validator.messageTemplate());

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult.attendanceTimePeriod[0]).toHaveProperty('details');
      expect(validatorResult.attendanceTimePeriod[0].details).toEqual('Select whether attendance time is am or pm');
    });

  });

  describe('Find jurors validators:', function() {

    beforeEach(function() {
      validatorResult = null;
    });

    it('should validate a valid request - juror number search', function() {
      var mockRequest = {
        searchBy: 'jurorNumber',
        jurorNumberSearch: '101010101'
      };

      validatorResult = validate(mockRequest, validator.findJurors());

      expect(validatorResult).toBeUndefined();
    });

    it('should validate an invalid request - juror number search - empty field', function() {
      var mockRequest = {
        searchBy: 'jurorNumber',
        jurorNumberSearch: ''
      };

      validatorResult = validate(mockRequest, validator.findJurors());

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult.jurorNumberSearch[0]).toHaveProperty('details');
      expect(validatorResult.jurorNumberSearch[0].details).toEqual('Enter juror number');
    });

    it('should validate an invalid request - juror number search - invalid chars', function() {
      var mockRequest = {
        searchBy: 'jurorNumber',
        jurorNumberSearch: '1010!!!!101'
      };

      validatorResult = validate(mockRequest, validator.findJurors());

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult.jurorNumberSearch[0]).toHaveProperty('details');
      expect(validatorResult.jurorNumberSearch[0].details).toEqual('Juror number can only include numbers');
    });

    it('should validate an invalid request - juror number search - longer than 9 numbers', function() {
      var mockRequest = {
        searchBy: 'jurorNumber',
        jurorNumberSearch: '1234567890'
      };

      validatorResult = validate(mockRequest, validator.findJurors());

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult.jurorNumberSearch[0]).toHaveProperty('details');
      expect(validatorResult.jurorNumberSearch[0].details).toEqual('Juror number must be 9 numbers');
    });

    it('should validate a valid request - juror name search', function() {
      var mockRequest = {
        searchBy: 'jurorName',
        jurorNameSearch: 'FNAME'
      };

      validatorResult = validate(mockRequest, validator.findJurors());

      expect(validatorResult).toBeUndefined();
    });

    it('should validate an invalid request - juror name search - empty field', function() {
      var mockRequest = {
        searchBy: 'jurorName',
        jurorNameSearch: ''
      };

      validatorResult = validate(mockRequest, validator.findJurors());

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult.jurorNameSearch[0]).toHaveProperty('details');
      expect(validatorResult.jurorNameSearch[0].details).toEqual('Enter juror name');
    });

    it('should validate a valid request - pool no search', function() {
      var mockRequest = {
        searchBy: 'pool',
        poolSearch: '123456789'
      };

      validatorResult = validate(mockRequest, validator.findJurors());

      expect(validatorResult).toBeUndefined();
    });

    it('should validate an invalid request - pool no search - empty field', function() {
      var mockRequest = {
        searchBy: 'pool',
        poolSearch: ''
      };

      validatorResult = validate(mockRequest, validator.findJurors());

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult.poolSearch[0]).toHaveProperty('details');
      expect(validatorResult.poolSearch[0].details).toEqual('Enter pool number');
    });

    it('should validate an invalid request - pool no search - invalid chars', function() {
      var mockRequest = {
        searchBy: 'pool',
        poolSearch: '1234!!aa9'
      };

      validatorResult = validate(mockRequest, validator.findJurors());

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult.poolSearch[0]).toHaveProperty('details');
      expect(validatorResult.poolSearch[0].details).toEqual('Pool number can only include numbers');
    });

    it('should validate an invalid request - pool no search - longer than 9 chars', function() {
      var mockRequest = {
        searchBy: 'pool',
        poolSearch: '1234567890'
      };

      validatorResult = validate(mockRequest, validator.findJurors());

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult.poolSearch[0]).toHaveProperty('details');
      expect(validatorResult.poolSearch[0].details).toEqual('Pool number must be 9 numbers');
    });

    it('should validate a valid request - next due at court date search', function() {
      var mockRequest = {
        searchBy: 'nextDueAtCourt',
        nextDueAtCourtDate: '01/01/2024'
      };

      validatorResult = validate(mockRequest, validator.findJurors());

      expect(validatorResult).toBeUndefined();
    });

    it('should validate a invalid request - next due at court date search - empty date', function() {
      var mockRequest = {
        searchBy: 'nextDueAtCourt',
        nextDueAtCourtDate: ''
      };

      validatorResult = validate(mockRequest, validator.findJurors());

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult.nextDueAtCourtDate[0]).toHaveProperty('summary');
      expect(validatorResult.nextDueAtCourtDate[0].summary).toEqual('Enter date next due at court');
    });

    it('should validate a invalid request - next due at court date search - invalid chars', function() {
      var mockRequest = {
        searchBy: 'nextDueAtCourt',
        nextDueAtCourtDate: '01/!!/2024'
      };

      validatorResult = validate(mockRequest, validator.findJurors());

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult.nextDueAtCourtDate[0]).toHaveProperty('summary');
      expect(validatorResult.nextDueAtCourtDate[0].summary).toEqual('Date next due at court can only include numbers and forward slashes');
    });

    it('should validate a invalid request - next due at court date search - invalid format', function() {
      var mockRequest = {
        searchBy: 'nextDueAtCourt',
        nextDueAtCourtDate: '2024//01/01',
      };

      validatorResult = validate(mockRequest, validator.findJurors());

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult.nextDueAtCourtDate[0]).toHaveProperty('summary');
      expect(validatorResult.nextDueAtCourtDate[0].summary).toEqual('Enter next due at court date in the correct format, for example, 31/01/2023');
    });

    it('should validate a invalid request - next due at court date search - invalid date', function() {
      var mockRequest = {
        searchBy: 'nextDueAtCourt',
        nextDueAtCourtDate: '31/14/2024',
      };

      validatorResult = validate(mockRequest, validator.findJurors());

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult.nextDueAtCourtDate[0]).toHaveProperty('summary');
      expect(validatorResult.nextDueAtCourtDate[0].summary).toEqual('Enter a real date');
    });

    it('should validate a valid request - deferral date search', function() {
      var mockRequest = {
        searchBy: 'deferral',
        deferralDate: '01/01/2024'
      };

      validatorResult = validate(mockRequest, validator.findJurors());

      expect(validatorResult).toBeUndefined();
    });

    it('should validate a invalid request - deferral date search - empty date', function() {
      var mockRequest = {
        searchBy: 'deferral',
        deferralDate: ''
      };

      validatorResult = validate(mockRequest, validator.findJurors());

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult.deferralDate[0]).toHaveProperty('summary');
      expect(validatorResult.deferralDate[0].summary).toEqual('Enter date deferred to');
    });

    it('should validate a invalid request - deferral date search - invalid chars', function() {
      var mockRequest = {
        searchBy: 'deferral',
        deferralDate: '01/!!/2024'
      };

      validatorResult = validate(mockRequest, validator.findJurors());

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult.deferralDate[0]).toHaveProperty('summary');
      expect(validatorResult.deferralDate[0].summary).toEqual('Date deferred to can only include numbers and forward slashes');
    });

    it('should validate a invalid request - deferral date search - invalid format', function() {
      var mockRequest = {
        searchBy: 'deferral',
        deferralDate: '2024//01/01',
      };

      validatorResult = validate(mockRequest, validator.findJurors());

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult.deferralDate[0]).toHaveProperty('summary');
      expect(validatorResult.deferralDate[0].summary).toEqual('Enter date deferred to in the correct format, for example, 31/01/2023');
    });

    it('should validate a invalid request - deferral date search - invalid date', function() {
      var mockRequest = {
        searchBy: 'deferral',
        deferralDate: '31/14/2024',
      };

      validatorResult = validate(mockRequest, validator.findJurors());

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult.deferralDate[0]).toHaveProperty('summary');
      expect(validatorResult.deferralDate[0].summary).toEqual('Enter a real date');
    });

    it('should validate a invalid request - no search by option selected', function() {
      var mockRequest = {
        searchBy: '',
      };

      validatorResult = validate(mockRequest, validator.findJurors());

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult.searchBy[0]).toHaveProperty('summary');
      expect(validatorResult.searchBy[0].summary).toEqual('Select how you want to search for jurors to send message to');
    });

  });

  describe('Trial search validators:', function() {

    beforeEach(function() {
      validatorResult = null;
    });

    it('should validate a valid request', function() {
      var mockRequest = {
        searchTrialNumber: 'T1000000000',
      };

      validatorResult = validate(mockRequest, validator.trialSearch());

      expect(validatorResult).toBeUndefined();
    });

    it('should validate an invalid request - empty field', function() {
      var mockRequest = {
        searchTrialNumber: '',
      };

      validatorResult = validate(mockRequest, validator.trialSearch());

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult.searchTrialNumber[0]).toHaveProperty('summary');
      expect(validatorResult.searchTrialNumber[0].summary).toEqual('Enter a trial number');
    });

    it('should validate an invalid request - lower case letters', function() {
      var mockRequest = {
        searchTrialNumber: 't1000000000',
      };

      validatorResult = validate(mockRequest, validator.trialSearch());

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult.searchTrialNumber[0]).toHaveProperty('summary');
      expect(validatorResult.searchTrialNumber[0].summary).toEqual('Enter a trial number using uppercase letters only');
    });

    it('should validate an invalid request - more than 16 chars', function() {
      var mockRequest = {
        searchTrialNumber: 'T1000000000000000',
      };

      validatorResult = validate(mockRequest, validator.trialSearch());

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult.searchTrialNumber[0]).toHaveProperty('summary');
      expect(validatorResult.searchTrialNumber[0].summary).toEqual('Trial number must be 16 characters or less');
    });

  });

})();
