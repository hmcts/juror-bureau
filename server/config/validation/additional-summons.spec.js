/* eslint-disable */
(function() {
  'use strict';

  var validate = require('validate.js')
    , additionalSummonsVal = require('./additional-summons')
    , validatorResult = null;

  describe('Additional summons validators:', function() {

    beforeEach(function() {
      validatorResult = null;
    });

    it('should validate the additional summons form - happy path', function() {
      var mockRequest = {
        citizensToSummon: 10,
        postcodes: ['CH1', 'CH2']
      };

      validatorResult = validate(mockRequest, additionalSummonsVal(50));

      expect(validatorResult).to.be.undefined;
    });

    it('should validate the additional summons form - happy path single postcode', function() {
      var mockRequest = {
        citizensToSummon: 10,
        postcodes: 'CH1'
      };

      validatorResult = validate(mockRequest, additionalSummonsVal(50));

      expect(validatorResult).to.be.undefined;
    });

    it('should validate the additional summons form - missing postcodes', function() {
      var mockRequest = {
        citizensToSummon: 10
      };

      validatorResult = validate(mockRequest, additionalSummonsVal(50));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('postcodes');
      expect(validatorResult.postcodes).to.be.instanceof(Array);
      expect(validatorResult.postcodes).to.be.of.length(1);
      expect(validatorResult.postcodes[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.postcodes[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.postcodes[0].summary).to.equal('Postcodes to summon from is missing');
      expect(validatorResult.postcodes[0].details).to.equal('Select at least one postcode to summon from');
    });

    it('should validate the additional summons form - missing number of citizens to summon', function() {
      var mockRequest = {
        citizensToSummon: '',
        postcodes: 'CH1'
      };

      validatorResult = validate(mockRequest, additionalSummonsVal(50));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('citizensToSummon');
      expect(validatorResult.citizensToSummon).to.be.instanceof(Array);
      expect(validatorResult.citizensToSummon).to.be.of.length(1);
      expect(validatorResult.citizensToSummon[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.citizensToSummon[0].summary).to.equal('Number of citizens to summon is missing');
      expect(validatorResult.citizensToSummon[0]).to.have.ownPropertyDescriptor('fields');
      expect(validatorResult.citizensToSummon[0].fields).to.be.of.length(1);
      expect(validatorResult.citizensToSummon[0].fields[0]).to.equal('citizensToSummon');
      expect(validatorResult.citizensToSummon[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.citizensToSummon[0].details).to.be.of.length(1);
      expect(validatorResult.citizensToSummon[0].details[0]).to.equal('Enter the number of citizens to summon');
    });

    it('should validate the additional summons form - invalid number of citizens to summon', function() {
      var mockRequest = {
        citizensToSummon: 'aa',
        postcodes: 'CH1'
      };

      validatorResult = validate(mockRequest, additionalSummonsVal(50));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('citizensToSummon');
      expect(validatorResult.citizensToSummon).to.be.instanceof(Array);
      expect(validatorResult.citizensToSummon).to.be.of.length(1);
      expect(validatorResult.citizensToSummon[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.citizensToSummon[0].summary).to.equal('Number of citizens to summon is wrong');
      expect(validatorResult.citizensToSummon[0]).to.have.ownPropertyDescriptor('fields');
      expect(validatorResult.citizensToSummon[0].fields).to.be.of.length(1);
      expect(validatorResult.citizensToSummon[0].fields[0]).to.equal('citizensToSummon');
      expect(validatorResult.citizensToSummon[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.citizensToSummon[0].details).to.be.of.length(1);
      expect(validatorResult.citizensToSummon[0].details[0]).to.equal('Number of citizens to summon is wrong');
    });

    it('should validate the additional summons form - invalid number of citizens to summon', function() {
      var mockRequest = {
        citizensToSummon: 51,
        postcodes: 'CH1'
      };

      validatorResult = validate(mockRequest, additionalSummonsVal(50));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('citizensToSummon');
      expect(validatorResult.citizensToSummon).to.be.instanceof(Array);
      expect(validatorResult.citizensToSummon).to.be.of.length(1);
      expect(validatorResult.citizensToSummon[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.citizensToSummon[0].summary).to.equal('Number of citizens to summon is too high');
      expect(validatorResult.citizensToSummon[0]).to.have.ownPropertyDescriptor('fields');
      expect(validatorResult.citizensToSummon[0].fields).to.be.of.length(1);
      expect(validatorResult.citizensToSummon[0].fields[0]).to.equal('citizensToSummon');
      expect(validatorResult.citizensToSummon[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.citizensToSummon[0].details).to.be.of.length(1);
      expect(validatorResult.citizensToSummon[0].details[0]).to.equal('Number of citizens to summon is too high');
    });

  });

})();
