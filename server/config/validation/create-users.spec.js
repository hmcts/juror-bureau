(function() {
  'use strict';
  var validate = require('validate.js')
    , validator = require('./create-users')
    , validatorResult = null;

  describe('Staff Management - Create user validators:', function() {

    beforeEach(function() {
      validatorResult = null;
    });

    it('should successfully validate selected user type', function() {
      const mockRequest = {
        userType: 'bureau',
      };

      validatorResult = validate(mockRequest, validator.userType());
      expect(validatorResult).to.be.undefined;
    });

    it('should try to validate an invalid request - no user type selected', function() {
      var mockRequest = {
        userType: [],
      };

      validatorResult = validate(mockRequest, validator.userType());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult.userType[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.userType[0].summary).to.equal('Select a user type');
      expect(validatorResult.userType[0].details).to.equal('Select a user type');
    });

    it('should successfully validate entered user details', function() {
      const mockRequest = {
        name: 'Test Name',
        email: 'test@email.com',
      };

      validatorResult = validate(mockRequest, validator.userDetails());
      expect(validatorResult).to.be.undefined;
    });

    it('should try to validate an invalid request - no user details entered', function() {
      var mockRequest = {
        name: '',
        email: '',
      };

      validatorResult = validate(mockRequest, validator.userDetails());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult.name[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.name[0].summary).to.equal('Enter the user\'s full name');
      expect(validatorResult.name[0].details).to.equal('Enter the user\'s full name');
      expect(validatorResult.email[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.email[0].summary).to.equal('Enter the user\'s email');
      expect(validatorResult.email[0].details).to.equal('Enter the user\'s email');
    });

    it('should try to validate an invalid request - invalid email entered', function() {
      var mockRequest = {
        name: 'Test Name',
        email: 'testem,ail',
      };

      validatorResult = validate(mockRequest, validator.userDetails());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult.email[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.email[0].summary).to.equal(
        'Enter the email address in the correct format, like name@email.com'
      );
    });
  });

})();
