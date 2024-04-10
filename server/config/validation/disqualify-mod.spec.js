/* eslint-disable */
(function() {
    'use strict';
  
    var validate = require('validate.js')
      , disqualifyValidator = require('./disqualify-mod')
      , validatorResult = null;
  
    describe('Disqualify form validators:', function() {
  
      beforeEach(function() {
        validatorResult = null;
      });
  
      it('should validate a valid request', function() {
        var mockRequest = {
            disqualifyReason: 'A'
        };
  
        validatorResult = validate(mockRequest, disqualifyValidator());
  
        expect(validatorResult).toBeUndefined();
      });
  
      it('should return an error when disqualify reason is missing', function() {
        var mockRequest = {
          disqualifyReason: ''
        };
  
        validatorResult = validate(mockRequest, disqualifyValidator());
  
        expect(validatorResult).toEqual(expect.any(Object));
        expect(validatorResult).toHaveProperty('disqualifyReason');
        expect(validatorResult.disqualifyReason[0]).toHaveProperty('details');
        expect(validatorResult.disqualifyReason[0].details).toEqual('Select the reason why you\'re disqualifying this juror');
      });
    })
  })();
  