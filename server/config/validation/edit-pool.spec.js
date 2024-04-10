(function() {
  'use strict';

  var validate = require('validate.js')
    , editPoolVal = require('./edit-pool')
    , validatorResult = null;

  describe('Edit pool validators:', function() {

    beforeEach(function() {
      validatorResult = null;
    });

    it('should validate the edit pool form - happy path', function() {
      var mockRequest = {
        noOfJurors: 10,
        reasonForChange: 'Why not'
      };

      validatorResult = validate(mockRequest, editPoolVal(50, '400', 100));

      expect(validatorResult).toBeUndefined();
    });

    it('should validate the edit pool form - empty for change', function() {
      var mockRequest = {
        noOfJurors: 10,
        reasonForChange: ''
      };

      validatorResult = validate(mockRequest, editPoolVal(50, '400', 100));

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult).toHaveProperty('reasonForChange');
      expect(validatorResult.reasonForChange).toBeInstanceOf(Array);
      expect(validatorResult.reasonForChange).toHaveLength(1);
      expect(validatorResult.reasonForChange[0]).toHaveProperty('summary');
      expect(validatorResult.reasonForChange[0].summary).toEqual('Please enter a reason for this change');
      expect(validatorResult.reasonForChange[0]).toHaveProperty('details');
      expect(validatorResult.reasonForChange[0].details).toEqual('Please enter a reason for this change');
    });

    it('should validate the edit pool form - missing number of jurors', function() {
      var mockRequest = {
        noOfJurors: '',
        reasonForChange: 'Why not'
      };

      validatorResult = validate(mockRequest, editPoolVal(50, '400', 100));

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult).toHaveProperty('noOfJurors');
      expect(validatorResult.noOfJurors).toBeInstanceOf(Array);
      expect(validatorResult.noOfJurors).toHaveLength(1);
      expect(validatorResult.noOfJurors[0]).toHaveProperty('summary');
      expect(validatorResult.noOfJurors[0].summary).toEqual('Number of jurors is missing');
      expect(validatorResult.noOfJurors[0]).toHaveProperty('fields');
      expect(validatorResult.noOfJurors[0].fields).toBeInstanceOf(Array);
      expect(validatorResult.noOfJurors[0].fields).toHaveLength(1);
      expect(validatorResult.noOfJurors[0].fields[0]).toEqual('noOfJurors');
      expect(validatorResult.noOfJurors[0]).toHaveProperty('details');
      expect(validatorResult.noOfJurors[0].details).toBeInstanceOf(Array);
      expect(validatorResult.noOfJurors[0].details).toHaveLength(1);
      expect(validatorResult.noOfJurors[0].details[0]).toEqual('Enter the number of jurors');
    });

    it('should validate the edit pool form - bureau user and number of jurors too high', function() {
      var mockRequest = {
        noOfJurors: 100,
        reasonForChange: 'Why not'
      };

      validatorResult = validate(mockRequest, editPoolVal(50, '400', 100));

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult).toHaveProperty('noOfJurors');
      expect(validatorResult.noOfJurors).toBeInstanceOf(Array);
      expect(validatorResult.noOfJurors).toHaveLength(1);
      expect(validatorResult.noOfJurors[0]).toHaveProperty('summary');
      expect(validatorResult.noOfJurors[0].summary).toEqual('Number of jurors is too high');
      expect(validatorResult.noOfJurors[0]).toHaveProperty('fields');
      expect(validatorResult.noOfJurors[0].fields).toBeInstanceOf(Array);
      expect(validatorResult.noOfJurors[0].fields).toHaveLength(1);
      expect(validatorResult.noOfJurors[0].fields[0]).toEqual('noOfJurors');
      expect(validatorResult.noOfJurors[0]).toHaveProperty('details');
      expect(validatorResult.noOfJurors[0].details).toBeInstanceOf(Array);
      expect(validatorResult.noOfJurors[0].details).toHaveLength(1);
      expect(validatorResult.noOfJurors[0].details[0]).toEqual('Enter a number lower than or equal to 50');
    });

    it('should validate the edit pool form - court user and number of jurors too low', function() {
      var mockRequest = {
        noOfJurors: 50,
        reasonForChange: 'Why not'
      };

      validatorResult = validate(mockRequest, editPoolVal(50, '401', 100));

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult).toHaveProperty('noOfJurors');
      expect(validatorResult.noOfJurors).toBeInstanceOf(Array);
      expect(validatorResult.noOfJurors).toHaveLength(1);
      expect(validatorResult.noOfJurors[0]).toHaveProperty('summary');
      expect(validatorResult.noOfJurors[0].summary).toEqual('Number of jurors is too low');
      expect(validatorResult.noOfJurors[0]).toHaveProperty('fields');
      expect(validatorResult.noOfJurors[0].fields).toBeInstanceOf(Array);
      expect(validatorResult.noOfJurors[0].fields).toHaveLength(1);
      expect(validatorResult.noOfJurors[0].fields[0]).toEqual('noOfJurors');
      expect(validatorResult.noOfJurors[0]).toHaveProperty('details');
      expect(validatorResult.noOfJurors[0].details).toBeInstanceOf(Array);
      expect(validatorResult.noOfJurors[0].details).toHaveLength(1);
      expect(validatorResult.noOfJurors[0].details[0]).toEqual('Enter a number higher than or equal to 100');
    });

    it('should validate the edit pool form - invalid number of jurors', function() {
      var mockRequest = {
        noOfJurors: 'aa',
        reasonForChange: 'Why not'
      };

      validatorResult = validate(mockRequest, editPoolVal(50, '401', 100));

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult).toHaveProperty('noOfJurors');
      expect(validatorResult.noOfJurors).toBeInstanceOf(Array);
      expect(validatorResult.noOfJurors).toHaveLength(1);
      expect(validatorResult.noOfJurors[0]).toHaveProperty('summary');
      expect(validatorResult.noOfJurors[0].summary).toEqual('Number of jurors is wrong');
      expect(validatorResult.noOfJurors[0]).toHaveProperty('fields');
      expect(validatorResult.noOfJurors[0].fields).toBeInstanceOf(Array);
      expect(validatorResult.noOfJurors[0].fields).toHaveLength(1);
      expect(validatorResult.noOfJurors[0].fields[0]).toEqual('noOfJurors');
      expect(validatorResult.noOfJurors[0]).toHaveProperty('details');
      expect(validatorResult.noOfJurors[0].details).toBeInstanceOf(Array);
      expect(validatorResult.noOfJurors[0].details).toHaveLength(1);
      expect(validatorResult.noOfJurors[0].details[0]).toEqual('Number of jurors is wrong');
    });

  });

})();
