(function() {
  'use strict';
  var validate = require('validate.js')
    , validator = require('./create-courtroom');

  describe('Administration - Create courtroom validators:', function() {

    it('should successfully validate entered courtroom details', function() {
      const mockRequest = {
        roomName: 'roomName',
        roomDescription: 'roomDescription',
      };

      const validatorResult = validate(mockRequest, validator.roomDetails());

      expect(validatorResult).toBeUndefined();
    });

    it('should try to validate an invalid request - no user details entered', function() {
      var mockRequest = {
        roomName: '',
        roomDescription: '',
      };

      const validatorResult = validate(mockRequest, validator.roomDetails());

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult.roomName[0]).toHaveProperty('summary');
      expect(validatorResult.roomName[0].summary).toEqual('Enter room name');
      expect(validatorResult.roomName[0].details).toEqual('Enter room name');
      expect(validatorResult.roomDescription[0]).toHaveProperty('summary');
      expect(validatorResult.roomDescription[0].summary).toEqual('Enter room description');
      expect(validatorResult.roomDescription[0].details).toEqual('Enter room description');
    });
  });

})();
