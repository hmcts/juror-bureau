(function() {
  'use strict';

  var validate = require('validate.js')
    , validator = require('./summons-management')
    , validatorResult = null;

  describe('Summons management validators:', function() {

    beforeEach(function() {
      validatorResult = null;
    });

    it('should validate the process reply action select - happy path', function() {
      var mockBody = {
        processActionType: 'responded',
      };

      validatorResult = validate(mockBody, validator.processAction());

      expect(validatorResult).toBeUndefined();
    });

    it('should validate the process reply action select - unhappy path', function() {
      var mockBody = {};

      validatorResult = validate(mockBody, validator.processAction());

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult).toHaveProperty('processActionType');
      expect(validatorResult.processActionType).toBeInstanceOf(Array);
      expect(validatorResult.processActionType).toHaveLength(1);
      expect(validatorResult.processActionType[0]).toEqual(expect.any(Object));
      expect(validatorResult.processActionType[0]).toHaveProperty('summary');
      expect(validatorResult.processActionType[0]).toHaveProperty('details');
      expect(validatorResult.processActionType[0].summary).toEqual('Please select a response process type');
      expect(validatorResult.processActionType[0].details).toEqual('Please select a response process type');
    });

    it('should validate the request more info from juror form - happy path', function() {
      var mockBody = {
        _csrf: 'some-csrf-token',
        'info-jurorDetails': 'dateOfBirth',
      };

      validatorResult = validate(mockBody, validator.requestInfo());

      expect(validatorResult).toBeUndefined();
    });

    it('should validate the request more info from juror form - unhappy path', function() {
      var mockBody = {
        _csrf: 'some-csrf-token',
      };

      validatorResult = validate(mockBody, validator.requestInfo());

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult).toHaveProperty('requestInfo');
      expect(validatorResult.requestInfo).toBeInstanceOf(Array);
      expect(validatorResult.requestInfo).toHaveLength(1);
      expect(validatorResult.requestInfo[0]).toEqual(expect.any(Object));
      expect(validatorResult.requestInfo[0]).toHaveProperty('summary');
      expect(validatorResult.requestInfo[0]).toHaveProperty('details');
      expect(validatorResult.requestInfo[0].summary).toEqual('Select what information you need from the juror');
      expect(validatorResult.requestInfo[0].details).toHaveLength(1);
      expect(validatorResult.requestInfo[0].details[0]).toEqual('Select what information you need from the juror');
    });

  });

})();
