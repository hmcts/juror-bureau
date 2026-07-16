/* eslint-disable */
(function() {
  'use strict';

  const validate = require('validate.js');
  const validator = require('./we-are-group-contact');

  describe('We Are Group contact information validators:', function() {
    it('should validate a valid juror number search', function() {
      const mockRequest = {
        searchBy: 'jurorNumber',
        jurorNumber: '123456789',
      };

      const validatorResult = validate(mockRequest, validator.searchJurors(mockRequest));

      expect(validatorResult).to.be.undefined;
    });

    it('should validate an invalid juror number search', function() {
      const mockRequest = {
        searchBy: 'jurorNumber',
        jurorNumber: 'ABC',
      };

      const validatorResult = validate(mockRequest, validator.searchJurors(mockRequest));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult.jurorNumber[0].details).to.equal('Enter a valid juror number');
    });

    it('should validate a valid juror name search', function() {
      const mockRequest = {
        searchBy: 'jurorName',
        firstName: 'Jane',
        lastName: 'Doe',
      };

      const validatorResult = validate(mockRequest, validator.searchJurors(mockRequest));

      expect(validatorResult).to.be.undefined;
    });

    it('should validate a juror name search with missing first name', function() {
      const mockRequest = {
        searchBy: 'jurorName',
        firstName: '',
        lastName: 'Doe',
      };

      const validatorResult = validate(mockRequest, validator.searchJurors(mockRequest));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult.firstName[0].details).to.equal('Enter first name');
    });

    it('should validate a juror name search with missing last name', function() {
      const mockRequest = {
        searchBy: 'jurorName',
        firstName: 'Jane',
        lastName: '',
      };

      const validatorResult = validate(mockRequest, validator.searchJurors(mockRequest));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult.lastName[0].details).to.equal('Enter last name');
    });

    it('should validate a search without a selected search type', function() {
      const mockRequest = {};

      const validatorResult = validate(mockRequest, validator.searchJurors(mockRequest));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult.searchBy[0].details).to.equal('Select how you want to search for jurors');
    });
  });

})();
