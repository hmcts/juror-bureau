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

        expect(validatorResult).to.be.undefined;
      });
  
      it('should try to validate an invalid request - no options chosen', function() {
        var mockRequest = {
          jurorRecordUpdate: '',
          jurorDeceased: 'Juror is deceased',
        };

        validatorResult = validate(mockRequest, jurorUpdateValidator.updateOptions());
  
        expect(validatorResult).to.be.an('object');
        expect(validatorResult.jurorRecordUpdate[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.jurorRecordUpdate[0]).to.have.ownPropertyDescriptor('details');
        expect(validatorResult.jurorRecordUpdate[0].summary).to.equal('Select how you want to update the juror record');
        expect(validatorResult.jurorRecordUpdate[0].details).to.equal('Select how you want to update the juror record');
      });

      it('should try to validate an invalid request - no deceased comment', function() {
        var mockRequest = {
          jurorRecordUpdate: 'Deferral',
          jurorDeceased: '',
        };

        validatorResult = validate(mockRequest, jurorUpdateValidator.deceasedComment());
  
        expect(validatorResult).to.be.an('object');
        expect(validatorResult.jurorDeceased[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.jurorDeceased[0]).to.have.ownPropertyDescriptor('details');
        expect(validatorResult.jurorDeceased[0].summary).to.equal('Enter comments to record in the juror’s history');
        expect(validatorResult.jurorDeceased[0].details).to.equal('Enter comments to record in the juror’s history');
      });
  
    });
  
  })();
  