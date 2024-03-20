(function() {
  'use strict';
  var validate = require('validate.js')
    , validator = require('./create-courtroom')
    , validatorResult = null;

  describe('Administration - Create courtroom validators:', function() {

    beforeEach(function() {
      validatorResult = null;
    });

    it('should successfully validate entered courtroom details', function() {
      const mockRequest = {
        roomName: 'roomName',
        roomDescription: 'roomDescription',
      };

      validatorResult = validate(mockRequest, validator.roomDetails());
      expect(validatorResult).to.be.undefined;
    });

    it('should try to validate an invalid request - no user details entered', function() {
      var mockRequest = {
        roomName: '',
        roomDescription: '',
      };

      validatorResult = validate(mockRequest, validator.roomDetails());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult.roomName[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.roomName[0].summary).to.equal('Enter room name');
      expect(validatorResult.roomName[0].details).to.equal('Enter room name');
      expect(validatorResult.roomDescription[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.roomDescription[0].summary).to.equal('Enter room description');
      expect(validatorResult.roomDescription[0].details).to.equal('Enter room description');
    });
  });

})();
