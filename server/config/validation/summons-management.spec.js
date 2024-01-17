(function() {
  'use strict';

  var validate = require('validate.js')
    , validator = require('./summons-management')
    , validatorResult = null;

  describe('Summons management validators:', function() {

    beforeEach(function() {
      validatorResult = null;
    });

    it('should validate the process reply action select - happy path', function() {
      var mockBody = {
        processActionType: 'responded',
      };

      validatorResult = validate(mockBody, validator.processAction());

      expect(validatorResult).to.be.undefined;
    });

    it('should validate the process reply action select - unhappy path', function() {
      var mockBody = {};

      validatorResult = validate(mockBody, validator.processAction());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('processActionType');
      expect(validatorResult.processActionType).to.be.an.instanceof(Array);
      expect(validatorResult.processActionType).to.be.of.length(1);
      expect(validatorResult.processActionType[0]).to.be.an('object');
      expect(validatorResult.processActionType[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.processActionType[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.processActionType[0].summary).to.equal('Please select a response process type');
      expect(validatorResult.processActionType[0].details).to.equal('Please select a response process type');
    });

    it('should validate the request more info from juror form - happy path', function() {
      var mockBody = {
        _csrf: 'some-csrf-token',
        'info-jurorDetails': 'dateOfBirth',
      };

      validatorResult = validate(mockBody, validator.requestInfo());

      expect(validatorResult).to.be.undefined;
    });

    it('should validate the request more info from juror form - unhappy path', function() {
      var mockBody = {
        _csrf: 'some-csrf-token',
      };

      validatorResult = validate(mockBody, validator.requestInfo());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('requestInfo');
      expect(validatorResult.requestInfo).to.be.an.instanceof(Array);
      expect(validatorResult.requestInfo).to.be.of.length(1);
      expect(validatorResult.requestInfo[0]).to.be.an('object');
      expect(validatorResult.requestInfo[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.requestInfo[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.requestInfo[0].summary).to.equal('Select what information you need from the juror');
      expect(validatorResult.requestInfo[0].details).to.be.of.length(1);
      expect(validatorResult.requestInfo[0].details[0]).to.equal('Select what information you need from the juror');
    });

  });

})();
