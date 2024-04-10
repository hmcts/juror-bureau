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

        expect(validatorResult).toBeUndefined();
      });
  
      it('should try to validate an invalid request - empty replies', function() {
        var mockRequest = {
            allocateSuperUrgent: '',
            allocateUrgent: '',
            allocateNonUrgent: '',
            selectedstaff: 'JOE',
        };

        validatorResult = validate(mockRequest, allocationValidator());
  
        expect(validatorResult).toEqual(expect.any(Object));
        expect(validatorResult.replies[0]).toHaveProperty('summary');
        expect(validatorResult.replies[0].summary).toEqual('Enter how many replies you want to assign to each selected officer - you must enter a number in at least one box');
      });
      
      it('should try to validate an invalid request - staff not selected', function() {
        var mockRequest = {
            allocateSuperUrgent: '3',
            allocateUrgent: '0',
            allocateNonUrgent: '30',
        };

        validatorResult = validate(mockRequest, allocationValidator());
  
        expect(validatorResult).toEqual(expect.any(Object));
        expect(validatorResult.staff[0]).toHaveProperty('summary');
        expect(validatorResult.staff[0].summary).toEqual('Select at least 1 officer to assign replies to');
      });
  
    });
  
  })();
  