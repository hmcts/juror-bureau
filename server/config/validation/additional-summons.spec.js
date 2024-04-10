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

      expect(validatorResult).toBeUndefined();
    });

    it('should validate the additional summons form - happy path single postcode', function() {
      var mockRequest = {
        citizensToSummon: 10,
        postcodes: 'CH1'
      };

      validatorResult = validate(mockRequest, additionalSummonsVal(50));

      expect(validatorResult).toBeUndefined();
    });

    it('should validate the additional summons form - missing postcodes', function() {
      var mockRequest = {
        citizensToSummon: 10
      };

      validatorResult = validate(mockRequest, additionalSummonsVal(50));

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult).toHaveProperty('postcodes');
      expect(validatorResult.postcodes).toBeInstanceOf(Array);
      expect(validatorResult.postcodes).toHaveLength(1);
      expect(validatorResult.postcodes[0]).toHaveProperty('summary');
      expect(validatorResult.postcodes[0]).toHaveProperty('details');
      expect(validatorResult.postcodes[0].summary).toEqual('Postcodes to summon from is missing');
      expect(validatorResult.postcodes[0].details).toEqual('Select at least one postcode to summon from');
    });

    it('should validate the additional summons form - missing number of citizens to summon', function() {
      var mockRequest = {
        citizensToSummon: '',
        postcodes: 'CH1'
      };

      validatorResult = validate(mockRequest, additionalSummonsVal(50));

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult).toHaveProperty('citizensToSummon');
      expect(validatorResult.citizensToSummon).toBeInstanceOf(Array);
      expect(validatorResult.citizensToSummon).toHaveLength(1);
      expect(validatorResult.citizensToSummon[0]).toHaveProperty('summary');
      expect(validatorResult.citizensToSummon[0].summary).toEqual('Number of citizens to summon is missing');
      expect(validatorResult.citizensToSummon[0]).toHaveProperty('fields');
      expect(validatorResult.citizensToSummon[0].fields).toHaveLength(1);
      expect(validatorResult.citizensToSummon[0].fields[0]).toEqual('citizensToSummon');
      expect(validatorResult.citizensToSummon[0]).toHaveProperty('details');
      expect(validatorResult.citizensToSummon[0].details).toHaveLength(1);
      expect(validatorResult.citizensToSummon[0].details[0]).toEqual('Enter the number of citizens to summon');
    });

    it('should validate the additional summons form - invalid number of citizens to summon', function() {
      var mockRequest = {
        citizensToSummon: 'aa',
        postcodes: 'CH1'
      };

      validatorResult = validate(mockRequest, additionalSummonsVal(50));

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult).toHaveProperty('citizensToSummon');
      expect(validatorResult.citizensToSummon).toBeInstanceOf(Array);
      expect(validatorResult.citizensToSummon).toHaveLength(1);
      expect(validatorResult.citizensToSummon[0]).toHaveProperty('summary');
      expect(validatorResult.citizensToSummon[0].summary).toEqual('Number of citizens to summon is wrong');
      expect(validatorResult.citizensToSummon[0]).toHaveProperty('fields');
      expect(validatorResult.citizensToSummon[0].fields).toHaveLength(1);
      expect(validatorResult.citizensToSummon[0].fields[0]).toEqual('citizensToSummon');
      expect(validatorResult.citizensToSummon[0]).toHaveProperty('details');
      expect(validatorResult.citizensToSummon[0].details).toHaveLength(1);
      expect(validatorResult.citizensToSummon[0].details[0]).toEqual('Number of citizens to summon is wrong');
    });

    it('should validate the additional summons form - invalid number of citizens to summon', function() {
      var mockRequest = {
        citizensToSummon: 51,
        postcodes: 'CH1'
      };

      validatorResult = validate(mockRequest, additionalSummonsVal(50));

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult).toHaveProperty('citizensToSummon');
      expect(validatorResult.citizensToSummon).toBeInstanceOf(Array);
      expect(validatorResult.citizensToSummon).toHaveLength(1);
      expect(validatorResult.citizensToSummon[0]).toHaveProperty('summary');
      expect(validatorResult.citizensToSummon[0].summary).toEqual('Number of citizens to summon is too high');
      expect(validatorResult.citizensToSummon[0]).toHaveProperty('fields');
      expect(validatorResult.citizensToSummon[0].fields).toHaveLength(1);
      expect(validatorResult.citizensToSummon[0].fields[0]).toEqual('citizensToSummon');
      expect(validatorResult.citizensToSummon[0]).toHaveProperty('details');
      expect(validatorResult.citizensToSummon[0].details).toHaveLength(1);
      expect(validatorResult.citizensToSummon[0].details[0]).toEqual('Number of citizens to summon is too high');
    });

  });

})();
