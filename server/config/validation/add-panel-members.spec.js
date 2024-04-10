/* eslint-disable */
(function() {
    'use strict';
  
    const validate = require('validate.js');
    const validator = require('./generate-panel');
  
    // TODO Not yet implemented
    describe('Trials - Generate panel validators:', function() {
  
      it('should validate a valid request', function() {
        const mockRequest = {
          jurorType: 'availablePools',
          noJurors: '7',
        };
  
        const validatorResult = validate(mockRequest, validator());

        expect(validatorResult).toBeUndefined();
      });
  
      it('should try to validate an invalid request - missing all fields', function() {
        const mockRequest = {
          jurorType: '',
          noJurors: '',
        };

        const validatorResult = validate(mockRequest, validator());

        expect(validatorResult).toEqual(expect.any(Object));
        expect(validatorResult.jurorType[0]).toHaveProperty('summary');
        expect(validatorResult.jurorType[0].summary).toEqual('Select which group of jurors you want to generate more panel members from');

        expect(validatorResult).toEqual(expect.any(Object));
        expect(validatorResult.noJurors[0]).toHaveProperty('summary');
        expect(validatorResult.noJurors[0].summary).toEqual('Enter how many extra jurors are needed on this panel');

      });
  
    });
  
  })();
  