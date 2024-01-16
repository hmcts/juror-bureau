/* eslint-disable */
(function() {
    'use strict';
  
    var validate = require('validate.js')
      , allocationValidator = require('./allocation')
      , validatorResult = null;
  
    describe('Assign replies validators:', function() {
  
      beforeEach(function() {
        validatorResult = null;
      });
  
      it('should validate a request', function() {
        var mockRequest = {
            allocateSuperUrgent: '3',
            allocateUrgent: '0',
            allocateNonUrgent: '30',
            selectedstaff: 'JOE',
        };
  
        validatorResult = validate(mockRequest, allocationValidator());

        expect(validatorResult).to.be.undefined;
      });
  
      it('should try to validate an invalid request - empty replies', function() {
        var mockRequest = {
            allocateSuperUrgent: '',
            allocateUrgent: '',
            allocateNonUrgent: '',
            selectedstaff: 'JOE',
        };

        validatorResult = validate(mockRequest, allocationValidator());
  
        expect(validatorResult).to.be.an('object');
        expect(validatorResult.replies[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.replies[0].summary).to.equal('Enter how many replies you want to assign to each selected officer - you must enter a number in at least one box');
      });
      
      it('should try to validate an invalid request - staff not selected', function() {
        var mockRequest = {
            allocateSuperUrgent: '3',
            allocateUrgent: '0',
            allocateNonUrgent: '30',
        };

        validatorResult = validate(mockRequest, allocationValidator());
  
        expect(validatorResult).to.be.an('object');
        expect(validatorResult.staff[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.staff[0].summary).to.equal('Select at least 1 officer to assign replies to');
      });
  
    });
  
  })();
  