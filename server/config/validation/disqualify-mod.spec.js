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
  
        expect(validatorResult).to.be.undefined;
      });
  
      it('should return an error when disqualify reason is missing', function() {
        var mockRequest = {
          disqualifyReason: ''
        };
  
        validatorResult = validate(mockRequest, disqualifyValidator());
  
        expect(validatorResult).to.be.an('object');
        expect(validatorResult).to.have.ownPropertyDescriptor('disqualifyReason');
        expect(validatorResult.disqualifyReason[0]).to.have.ownPropertyDescriptor('details');
        expect(validatorResult.disqualifyReason[0].details).to.equal('Select the reason why you\'re disqualifying this juror');
      });
    })
  })();
  