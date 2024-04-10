/* eslint-disable */
(function() {
  'use strict';

  const validate = require('validate.js'),
      validator = require('./document-exemption-duration'),
      judgesList = [
      {
        description: 'Test judge'
      },
      {
        description: 'Test judge 2'
      }
    ]
  let validatorResult = null;

  describe('Exemption duration document trial validator:', function() {

    beforeEach(function() {
      validatorResult = null;
    });

    it('should validate a valid request - indefinite', function() {
      let mockRequest = {
          durationType: 'indefinitely',
          durationYears: '',
          judge: 'Test judge',
      };

      validatorResult = validate(mockRequest, validator(judgesList));

      expect(validatorResult).toBeUndefined();
    });

    it('should validate a valid request - speicifc years', function() {
      let mockRequest = {
          durationType: 'specific',
          durationYears: '5',
          judge: 'Test judge',
      };

      validatorResult = validate(mockRequest, validator(judgesList));

      expect(validatorResult).toBeUndefined();
    });

    it('should validate an invalid request - all fields missing', function() {
      let mockRequest = {
        durationType: '',
        durationYears: '',
        judge: '',
    };

      validatorResult = validate(mockRequest, validator(judgesList));

      expect(validatorResult).toEqual(expect.any(Object));

      expect(validatorResult).toHaveProperty('durationType');
      expect(validatorResult.durationType[0]).toHaveProperty('details');
      expect(validatorResult.durationType[0].details).toEqual('Select a time period to exempt jurors');

      expect(validatorResult).toHaveProperty('judge');
      expect(validatorResult.judge[0]).toHaveProperty('details');
      expect(validatorResult.judge[0].details).toEqual('Select a judge');
    });

    it('should validate an invalid request - judge not in list', function() {
      let mockRequest = {
        durationType: 'indefinetly',
        durationYears: '',
        judge: 'Test judge 49',
    };

      validatorResult = validate(mockRequest, validator(judgesList));

      expect(validatorResult).toEqual(expect.any(Object));

      expect(validatorResult).toHaveProperty('judge');
      expect(validatorResult.judge[0]).toHaveProperty('details');
      expect(validatorResult.judge[0].details).toEqual('Select a judge');
    });

    it('should validate an invalid request - no judges available', function() {
      let mockRequest = {
        durationType: 'indefinetly',
        durationYears: '',
        judge: 'Test judge 49',
    };

      validatorResult = validate(mockRequest, validator([]));

      expect(validatorResult).toEqual(expect.any(Object));

      expect(validatorResult).toHaveProperty('judge');
      expect(validatorResult.judge[0]).toHaveProperty('details');
      expect(validatorResult.judge[0].details).toEqual('Select a judge');
    });

    it('should validate an invalid request - no years specified', function() {
      let mockRequest = {
        durationType: 'specific',
        durationYears: '',
        judge: 'Test judge 49',
    };

      validatorResult = validate(mockRequest, validator(judgesList));

      expect(validatorResult).toEqual(expect.any(Object));

      expect(validatorResult).toHaveProperty('judge');
      expect(validatorResult.durationYears[0]).toHaveProperty('details');
      expect(validatorResult.durationYears[0].details).toEqual('Enter how many years the jurors should be exempt for');
    });
  });

})();
