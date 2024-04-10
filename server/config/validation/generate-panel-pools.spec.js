/* eslint-disable */
(function() {
    'use strict';
  
    var validate = require('validate.js')
      , validator = require('./generate-panel-pools')
      , validatorResult = null;
  
    // TODO Not yet implemented
    describe('Trials - Generate panel - select pool validators:', function() {
  
      beforeEach(function() {
        validatorResult = null;
      });
  
      it('should validate a valid request', function() {
        var mockRequest = {
            selectedPools: ['123456789', '987654321'],
        };
  
        validatorResult = validate(mockRequest, validator());

        expect(validatorResult).toBeUndefined();
      });
  
      it('should try to validate an invalid request - no pools selected', function() {
        var mockRequest = {
            selectedPools: undefined,
          };

        validatorResult = validate(mockRequest, validator());

        expect(validatorResult).toEqual(expect.any(Object));
        expect(validatorResult.selectedPools[0]).toHaveProperty('summary');
        expect(validatorResult.selectedPools[0].summary).toEqual('Select which pools you want to use jurors from');
        
      });
  
    });
  
  })();
  