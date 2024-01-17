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

      expect(validatorResult).to.be.undefined;
    });

    it('should validate the edit pool form - empty for change', function() {
      var mockRequest = {
        noOfJurors: 10,
        reasonForChange: ''
      };

      validatorResult = validate(mockRequest, editPoolVal(50, '400', 100));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('reasonForChange');
      expect(validatorResult.reasonForChange).to.be.instanceof(Array);
      expect(validatorResult.reasonForChange).to.be.of.length(1);
      expect(validatorResult.reasonForChange[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.reasonForChange[0].summary).to.equal('Please enter a reason for this change');
      expect(validatorResult.reasonForChange[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.reasonForChange[0].details).to.equal('Please enter a reason for this change');
    });

    it('should validate the edit pool form - missing number of jurors', function() {
      var mockRequest = {
        noOfJurors: '',
        reasonForChange: 'Why not'
      };

      validatorResult = validate(mockRequest, editPoolVal(50, '400', 100));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('noOfJurors');
      expect(validatorResult.noOfJurors).to.be.instanceof(Array);
      expect(validatorResult.noOfJurors).to.be.of.length(1);
      expect(validatorResult.noOfJurors[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.noOfJurors[0].summary).to.equal('Number of jurors is missing');
      expect(validatorResult.noOfJurors[0]).to.have.ownPropertyDescriptor('fields');
      expect(validatorResult.noOfJurors[0].fields).to.be.instanceof(Array);
      expect(validatorResult.noOfJurors[0].fields).to.be.of.length(1);
      expect(validatorResult.noOfJurors[0].fields[0]).to.equal('noOfJurors');
      expect(validatorResult.noOfJurors[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.noOfJurors[0].details).to.be.instanceof(Array);
      expect(validatorResult.noOfJurors[0].details).to.be.of.length(1);
      expect(validatorResult.noOfJurors[0].details[0]).to.equal('Enter the number of jurors');
    });

    it('should validate the edit pool form - bureau user and number of jurors too high', function() {
      var mockRequest = {
        noOfJurors: 100,
        reasonForChange: 'Why not'
      };

      validatorResult = validate(mockRequest, editPoolVal(50, '400', 100));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('noOfJurors');
      expect(validatorResult.noOfJurors).to.be.instanceof(Array);
      expect(validatorResult.noOfJurors).to.be.of.length(1);
      expect(validatorResult.noOfJurors[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.noOfJurors[0].summary).to.equal('Number of jurors is too high');
      expect(validatorResult.noOfJurors[0]).to.have.ownPropertyDescriptor('fields');
      expect(validatorResult.noOfJurors[0].fields).to.be.instanceof(Array);
      expect(validatorResult.noOfJurors[0].fields).to.be.of.length(1);
      expect(validatorResult.noOfJurors[0].fields[0]).to.equal('noOfJurors');
      expect(validatorResult.noOfJurors[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.noOfJurors[0].details).to.be.instanceof(Array);
      expect(validatorResult.noOfJurors[0].details).to.be.of.length(1);
      expect(validatorResult.noOfJurors[0].details[0]).to.equal('Enter a number lower than or equal to 50');
    });

    it('should validate the edit pool form - court user and number of jurors too low', function() {
      var mockRequest = {
        noOfJurors: 50,
        reasonForChange: 'Why not'
      };

      validatorResult = validate(mockRequest, editPoolVal(50, '401', 100));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('noOfJurors');
      expect(validatorResult.noOfJurors).to.be.instanceof(Array);
      expect(validatorResult.noOfJurors).to.be.of.length(1);
      expect(validatorResult.noOfJurors[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.noOfJurors[0].summary).to.equal('Number of jurors is too low');
      expect(validatorResult.noOfJurors[0]).to.have.ownPropertyDescriptor('fields');
      expect(validatorResult.noOfJurors[0].fields).to.be.instanceof(Array);
      expect(validatorResult.noOfJurors[0].fields).to.be.of.length(1);
      expect(validatorResult.noOfJurors[0].fields[0]).to.equal('noOfJurors');
      expect(validatorResult.noOfJurors[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.noOfJurors[0].details).to.be.instanceof(Array);
      expect(validatorResult.noOfJurors[0].details).to.be.of.length(1);
      expect(validatorResult.noOfJurors[0].details[0]).to.equal('Enter a number higher than or equal to 100');
    });

    it('should validate the edit pool form - invalid number of jurors', function() {
      var mockRequest = {
        noOfJurors: 'aa',
        reasonForChange: 'Why not'
      };

      validatorResult = validate(mockRequest, editPoolVal(50, '401', 100));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('noOfJurors');
      expect(validatorResult.noOfJurors).to.be.instanceof(Array);
      expect(validatorResult.noOfJurors).to.be.of.length(1);
      expect(validatorResult.noOfJurors[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.noOfJurors[0].summary).to.equal('Number of jurors is wrong');
      expect(validatorResult.noOfJurors[0]).to.have.ownPropertyDescriptor('fields');
      expect(validatorResult.noOfJurors[0].fields).to.be.instanceof(Array);
      expect(validatorResult.noOfJurors[0].fields).to.be.of.length(1);
      expect(validatorResult.noOfJurors[0].fields[0]).to.equal('noOfJurors');
      expect(validatorResult.noOfJurors[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.noOfJurors[0].details).to.be.instanceof(Array);
      expect(validatorResult.noOfJurors[0].details).to.be.of.length(1);
      expect(validatorResult.noOfJurors[0].details[0]).to.equal('Number of jurors is wrong');
    });

  });

})();
