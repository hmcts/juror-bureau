/* eslint-disable */
(function() {
  'use strict';

  var validate = require('validate.js')
    , trialDetailsValidator = require('./create-trial').trialDetails
    , validatorResult = null
    , courtsList = [
      {
        "court_location": "CHESTER",
        "court_rooms": [
          {
            "id": 1,
            "owner": "415",
            "room_number": "1",
            "description": "Courtroom 1"
          }
        ]
      }
    ]
    , judgesList = [
      {
        "id": 1,
        "code": "1234",
        "description": "Judge 1"
      },
      {
        "id": 2,
        "code": "4321",
        "description": "Judge 2"
      }
    ];

  describe('Create a trial form validators:', function() {

    beforeEach(function() {
      validatorResult = null;
    });

    it('should validate a valid request', function() {
      var mockRequest = {
        trialNumber: "ABCDEF12345",
        trialType: "CRI",
        defendants: "defendant 1",
        respondents: "",
        startDate: "30/10/2023",
        judge: "Judge 1",
        court: "CHESTER",
        courtroom: "Courtroom 1"
      };

      validatorResult = validate(mockRequest, trialDetailsValidator(courtsList, judgesList));

      expect(validatorResult).toBeUndefined();
    });

    it('should validate an invalid request - all empty fields', function() {
      var mockRequest = {
        trialNumber: "",
        defendants: "",
        respondents: "",
        startDate: "",
        judge: "",
      };

      validatorResult = validate(mockRequest, trialDetailsValidator(courtsList, judgesList));

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult).toHaveProperty('trialNumber');
      expect(validatorResult.trialNumber[0]).toHaveProperty('details');
      expect(validatorResult.trialNumber[0].details).toEqual('Enter a trial number');

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult).toHaveProperty('trialType');
      expect(validatorResult.trialType[0]).toHaveProperty('details');
      expect(validatorResult.trialType[0].details).toEqual('Select whether this is a criminal or civil trial');
      
      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult).toHaveProperty('startDate');
      expect(validatorResult.startDate[0]).toHaveProperty('details');
      expect(validatorResult.startDate[0].details).toEqual('Enter a start date for this trial');

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult).toHaveProperty('judge');
      expect(validatorResult.judge[0]).toHaveProperty('details');
      expect(validatorResult.judge[0].details).toEqual('Enter the judge’s name');

    });

    it('should validate an invalid request - criminal trial - no defendants', function() {
      var mockRequest = {
        trialNumber: 'ABCDEF12345',
        trialType: 'CRI',
        defendants: '',
        respondents: '',
        startDate: '03/10/2023',
        judge: 'judge 1',
        court: 'CHESTER',
        courtroom: 'Courtroom 1'
      };

      validatorResult = validate(mockRequest, trialDetailsValidator(courtsList, judgesList));

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult).toHaveProperty('defendants');
      expect(validatorResult.defendants[0]).toHaveProperty('details');
      expect(validatorResult.defendants[0].details).toEqual('Enter defendants');

    });

    it('should validate an invalid request - civil trial - no respondents', function() {
      var mockRequest = {
        trialNumber: 'ABCDEF12345',
        trialType: 'CIV',
        defendants: '',
        respondents: '',
        startDate: '03/10/2023',
        judge: 'judge 1',
        court: 'CHESTER',
        courtroom: 'Courtroom 1'
      };

      validatorResult = validate(mockRequest, trialDetailsValidator(courtsList, judgesList));

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult).toHaveProperty('respondents');
      expect(validatorResult.respondents[0]).toHaveProperty('details');
      expect(validatorResult.respondents[0].details).toEqual('Enter respondents');

    });

    it('should validate an invalid request - judge not in list', function() {
      var mockRequest = {
        trialNumber: "ABCDEF12345",
        trialType: "CRI",
        defendants: "defendant 1",
        respondents: "",
        startDate: "30/10/2023",
        judge: "Invalid Judge",
        court: "CHESTER",
        courtroom: "Courtroom 1"
      };

      validatorResult = validate(mockRequest, trialDetailsValidator(courtsList, judgesList));

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult).toHaveProperty('judge');
      expect(validatorResult.judge[0]).toHaveProperty('details');
      expect(validatorResult.judge[0].details).toEqual('Select a judge from provided list');
    });

    it('should validate an invalid request - court selected - no courtroom', function() {
      var mockRequest = {
        trialNumber: 'ABCDEF12345',
        trialType: 'CIV',
        defendants: '',
        respondents: 'respondent 1',
        startDate: '03/10/2023',
        judge: 'judge 1',
        court: 'CHESTER',
        courtroom: ''
      };

      validatorResult = validate(mockRequest, trialDetailsValidator(courtsList, judgesList));

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult).toHaveProperty('courtroom');
      expect(validatorResult.courtroom[0]).toHaveProperty('details');
      expect(validatorResult.courtroom[0].details).toEqual('Enter courtroom');

    });

    it('should validate an invalid request - court selected - courtroom not in list', function() {
      var mockRequest = {
        trialNumber: 'ABCDEF12345',
        trialType: 'CIV',
        defendants: '',
        respondents: 'respondent 1',
        startDate: '03/10/2023',
        judge: 'judge 1',
        court: 'CHESTER',
        courtroom: 'INVALID COURTROOM'
      };

      validatorResult = validate(mockRequest, trialDetailsValidator(courtsList, judgesList));

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult).toHaveProperty('courtroom');
      expect(validatorResult.courtroom[0]).toHaveProperty('details');
      expect(validatorResult.courtroom[0].details).toEqual('Select courtroom from provided list');

    });

    it('should validate an invalid request - lowercase trial number', function() {
      var mockRequest = {
        trialNumber: 'abcdef12345',
        trialType: 'CIV',
        defendants: '',
        respondents: 'respondent 1',
        startDate: '03/10/2023',
        judge: 'judge 1',
        court: 'CHESTER',
        courtroom: 'Courtroom 1'
      };

      validatorResult = validate(mockRequest, trialDetailsValidator(courtsList, judgesList));

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult).toHaveProperty('trialNumber');
      expect(validatorResult.trialNumber[0]).toHaveProperty('details');
      expect(validatorResult.trialNumber[0].details).toEqual('Enter a trial number using uppercase letters only');

    });

    it('should validate an invalid request - trial number too long', function() {
      var mockRequest = {
        trialNumber: '123456789ABCDEFGH',
        trialType: 'CIV',
        defendants: '',
        respondents: 'respondent 1',
        startDate: '03/10/2023',
        judge: 'judge 1',
        court: 'CHESTER',
        courtroom: 'Courtroom 1'
      };

      validatorResult = validate(mockRequest, trialDetailsValidator(courtsList, judgesList));

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult).toHaveProperty('trialNumber');
      expect(validatorResult.trialNumber[0]).toHaveProperty('details');
      expect(validatorResult.trialNumber[0].details).toEqual('Trial number must be 16 characters or less');

    });


    it('should validate an invalid request - special chars in start date', function() {
      var mockRequest = {
        trialNumber: '123456789ABCDEF',
        trialType: 'CIV',
        defendants: '',
        respondents: 'respondent 1',
        startDate: '03!10!2023',
        judge: 'judge 1',
        court: 'CHESTER',
        courtroom: 'Courtroom 1'
      };

      validatorResult = validate(mockRequest, trialDetailsValidator(courtsList, judgesList));

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult).toHaveProperty('startDate');
      expect(validatorResult.startDate[0]).toHaveProperty('details');
      expect(validatorResult.startDate[0].details).toEqual('Trial start date must only include numbers');

    });

    it('should validate an invalid request - invalid start date', function() {
      var mockRequest = {
        trialNumber: '123456789ABCDEF',
        trialType: 'CIV',
        defendants: '',
        respondents: 'respondent 1',
        startDate: '03/13/2023',
        judge: 'judge 1',
        court: 'CHESTER',
        courtroom: 'Courtroom 1'
      };

      validatorResult = validate(mockRequest, trialDetailsValidator(courtsList, judgesList));

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult).toHaveProperty('startDate');
      expect(validatorResult.startDate[0]).toHaveProperty('details');
      expect(validatorResult.startDate[0].details).toEqual('Enter a date in the correct format, for example, 31/01/2023');

    });

  });
  
})();
  