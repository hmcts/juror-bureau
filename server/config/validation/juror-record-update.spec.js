/* eslint-disable */
(function() {
    'use strict';
  
    var validate = require('validate.js')
      , jurorUpdateValidator = require('./juror-record-update')
      , validatorResult = null;
  
    describe('Update juror record options:', function() {
  
      beforeEach(function() {
        validatorResult = null;
      });
  
      it('should validate a valid request', function() {
        var mockRequest = {
          jurorRecordUpdate: 'Deferral',
          jurorDeceased: 'Juror is deceased',
        };
  
        validatorResult = validate(mockRequest, jurorUpdateValidator.updateOptions());

        expect(validatorResult).toBeUndefined();
      });
  
      it('should try to validate an invalid request - no options chosen', function() {
        var mockRequest = {
          jurorRecordUpdate: '',
          jurorDeceased: 'Juror is deceased',
        };

        validatorResult = validate(mockRequest, jurorUpdateValidator.updateOptions());
  
        expect(validatorResult).toEqual(expect.any(Object));
        expect(validatorResult.jurorRecordUpdate[0]).toHaveProperty('summary');
        expect(validatorResult.jurorRecordUpdate[0]).toHaveProperty('details');
        expect(validatorResult.jurorRecordUpdate[0].summary).toEqual('Select how you want to update the juror record');
        expect(validatorResult.jurorRecordUpdate[0].details).toEqual('Select how you want to update the juror record');
      });

      it('should try to validate an invalid request - no deceased comment', function() {
        var mockRequest = {
          jurorRecordUpdate: 'Deferral',
          jurorDeceased: '',
        };

        validatorResult = validate(mockRequest, jurorUpdateValidator.deceasedComment());
  
        expect(validatorResult).toEqual(expect.any(Object));
        expect(validatorResult.jurorDeceased[0]).toHaveProperty('summary');
        expect(validatorResult.jurorDeceased[0]).toHaveProperty('details');
        expect(validatorResult.jurorDeceased[0].summary).toEqual('Enter comments to record in the juror’s history');
        expect(validatorResult.jurorDeceased[0].details).toEqual('Enter comments to record in the juror’s history');
      });
  
    });
  
  })();
  