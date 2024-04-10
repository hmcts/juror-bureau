/* eslint-disable */
(function() {
    'use strict';
  
    var validate = require('validate.js')
      , validator = require('./generate-panel')
      , validatorResult = null;
  
    // TODO Not yet implemented
    describe('Trials - Generate panel validators:', function() {
  
      beforeEach(function() {
        validatorResult = null;
      });
  
      it('should validate a valid request', function() {
        var mockRequest = {
          jurorType: 'availablePools',
          noJurors: '7',
        };
  
        validatorResult = validate(mockRequest, validator());

        expect(validatorResult).toBeUndefined();
      });
  
      it('should try to validate an invalid request - missing all fields', function() {
        var mockRequest = {
            jurorType: '',
            noJurors: '',
          };

        validatorResult = validate(mockRequest, validator());

        expect(validatorResult).toEqual(expect.any(Object));
        expect(validatorResult.jurorType[0]).toHaveProperty('summary');
        expect(validatorResult.jurorType[0].summary).toEqual('Select which group of jurors you want to generate a panel from');

        expect(validatorResult).toEqual(expect.any(Object));
        expect(validatorResult.noJurors[0]).toHaveProperty('summary');
        expect(validatorResult.noJurors[0].summary).toEqual('Enter how many jurors are needed on this panel');

      });
  
    });
  
  })();
  