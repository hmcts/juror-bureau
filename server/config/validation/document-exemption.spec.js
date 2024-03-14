/* eslint-disable */
(function() {
  'use strict';

  let validate = require('validate.js'),
      validator = require('./document-exemption'),
      validatorResult = null;

  describe('Exemption document trial validator:', function() {

    beforeEach(function() {
      validatorResult = null;
    });

    it('should validate a valid request', function() {
      let mockRequest = {
        exemptionCaseNumber: 'T10000000'
      };

      validatorResult = validate(mockRequest, validator());

      expect(validatorResult).to.be.undefined;
    });

    it('should validate an invalid request - no trial selected', function() {
      let mockRequest = {
        exemptionCaseNumber: ''
      };

      validatorResult = validate(mockRequest, validator());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('exemptionCaseNumber');
      expect(validatorResult.exemptionCaseNumber[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.exemptionCaseNumber[0].details).to.equal('Select a trial that relates to this exemption');
    });
  });

})();
