/* eslint-disable */
(function() {
    'use strict';
  
    let validate = require('validate.js'),
        moment = require('moment'),
        overviewValidator = require('./edit-juror-details-mod').overviewDetails,
        extraSupportValidator = require('./edit-juror-details-mod').extraSupport,
        validatorResult = null;
  
    describe('Edit juror details - overview validator:', function() {
  
      beforeEach(function() {
        validatorResult = null;
      });
  
      it('should validate a valid request', function() {
        let mockRequest = {
          dateOfBirth: '01/01/2023',
          primaryPhone: '0123456789',
          secondaryPhone: '0987654321',
          emailAddress: 'test@test.com',
        };
  
        validatorResult = validate(mockRequest, overviewValidator());
  
        expect(validatorResult).toBeUndefined();
      });

      it('should validate the phone number - primary not valid', function() {
        let mockRequest = {
          dateOfBirth: '01/01/2023',
          primaryPhone: '1234567890',
          secondaryPhone: '0987654321',
          emailAddress: 'test@test.com',
        };

        validatorResult = validate(mockRequest, overviewValidator());

        expect(validatorResult).toEqual(expect.any(Object));
        expect(validatorResult).toHaveProperty('primaryPhone');
        expect(validatorResult.primaryPhone[0]).toHaveProperty('details');
        expect(validatorResult.primaryPhone[0].details[0]).toEqual('Main phone number cannot contain letters or special characters apart from hyphens, dashes, brackets or a plus sign');
      });

      it('should validate a valid request - optional fields are empty', function() {
        let mockRequest = {
          dateOfBirth: '01/01/2023',
          primaryPhone: '',
          secondaryPhone: '',
          emailAddress: '',
        };
  
        validatorResult = validate(mockRequest, overviewValidator());
  
        expect(validatorResult).toBeUndefined();
      });

      it('should validate an invalid request - mandatory fields are empty', function() {
        let mockRequest = {
          dateOfBirth: '',
          primaryPhone: '',
          secondaryPhone: '',
          emailAddress: '',
        };
  
        validatorResult = validate(mockRequest, overviewValidator());
  
        expect(validatorResult).toEqual(expect.any(Object));
        expect(validatorResult).toHaveProperty('dateOfBirth');
        expect(validatorResult.dateOfBirth[0]).toHaveProperty('details');
        expect(validatorResult.dateOfBirth[0].details).toEqual('Date of birth cannot be empty');
      });

      // move this into date-picker spec when created
      // not going to validate date format here, covered in generic date picker(or will be)
      it('should validate an invalid request - date of birth is not in the past', function() {
        let mockRequest = {
          dateOfBirth: moment().format('DD/MM/YYYY'),
          primaryPhone: '',
          secondaryPhone: '',
          emailAddress: '',
        };
  
        validatorResult = validate(mockRequest, overviewValidator());
  
        expect(validatorResult).toEqual(expect.any(Object));
        expect(validatorResult).toHaveProperty('dateOfBirth');
        expect(validatorResult.dateOfBirth[0]).toHaveProperty('details');
        expect(validatorResult.dateOfBirth[0].details).toEqual('Date of birth must be in the past');
      });

      // phone number and email address should be validated centrally.
    });

    describe('Edit juror details - extra support validator:', function() {

      beforeEach(function() {
          validatorResult = null;
      });
    
      it('should validate a valid request', function() {
          let mockRequest = {
              specNeedValue: 'C',
              specNeedMsg: 'some details about extra support required',
              opticReference: '12345678',
          };
      
          validatorResult = validate(mockRequest, extraSupportValidator());
      
          expect(validatorResult).toBeUndefined();
      });

      it('should validate a valid request - optional fields are empty', function() {
        let mockRequest = {
            specNeedValue: 'C',
            specNeedMsg: 'some details about extra support required',
            opticReference: '',
        };
    
        validatorResult = validate(mockRequest, extraSupportValidator());
    
        expect(validatorResult).toBeUndefined();
      });


      it('should validate an invalid request - mandatory fields are empty', function() {
        let mockRequest = {
            specNeedValue: '',
            specNeedMsg: '',
            opticReference: '',
        };
    
        validatorResult = validate(mockRequest, extraSupportValidator());
    
        expect(validatorResult).toEqual(expect.any(Object));

        expect(validatorResult).toHaveProperty('specNeedValue');
        expect(validatorResult.specNeedValue[0]).toHaveProperty('details');
        expect(validatorResult.specNeedValue[0].details).toEqual(
          'Select a reason for the extra support the juror will need');

        expect(validatorResult).toHaveProperty('specNeedMsg');
        expect(validatorResult.specNeedMsg[0]).toHaveProperty('details');
        expect(validatorResult.specNeedMsg[0].details).toEqual(
          'Enter details about the help that the juror will need at court');
      });

    });
  
  })();
  