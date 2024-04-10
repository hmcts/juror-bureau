(function() {
  'use strict';

  const validate = require('validate.js');
  const { jurorsToDismiss, completeService } = require('./dismiss-jurors');
  const dateFilter = require('../../components/filters').dateFilter;

  describe('Dismiss jurors validators:', function() {
    it('should validate jurors to dismiss and selected pools - happy path', function() {
      const mockRequest = {
        jurorsToDismiss: '50',
        'checked-pools': ['123123123'],
      };

      const validatorResult = validate(mockRequest, jurorsToDismiss(50));

      expect(validatorResult).toBeUndefined();
    });

    it('should validate jurors to dismiss and selected pools - unhappy path', function() {
      const mockRequest = {
        jurorsToDismiss: '',
        'checked-pools': [],
      };

      const validatorResult = validate(mockRequest, jurorsToDismiss(50));

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult).toHaveProperty('jurorsToDismiss');
      expect(validatorResult.jurorsToDismiss[0]).toHaveProperty('details');
      expect(validatorResult.jurorsToDismiss[0].details).toEqual('Enter how many jurors you want to dismiss');
      expect(validatorResult.jurorsToDismiss[1]).toHaveProperty('details');
      expect(validatorResult.jurorsToDismiss[1].details).toEqual('Amount of jurors to dismiss must be 1 or more');
      expect(validatorResult).toHaveProperty('checked-pools');
      expect(validatorResult['checked-pools'][0]).toHaveProperty('details');
      expect(validatorResult['checked-pools'][0].details).toEqual('Select at least one pool');
    });

    it('should validate the complete service date - happy path', function() {
      const today = new Date();
      const mockRequest = {
        dateToCheck: dateFilter(today, null, 'DD/MM/YYYY'),
      };

      const validatorResult = validate(mockRequest, completeService());

      expect(validatorResult).toBeUndefined();
    });

    it('should validate the complete service date - unhappy path', function() {
      const mockRequest = {
        dateToCheck: '',
      };

      const validatorResult = validate(mockRequest, completeService());

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult).toHaveProperty('dateToCheck');
      expect(validatorResult.dateToCheck[0]).toHaveProperty('details');
      expect(validatorResult.dateToCheck[0].details).toEqual('Enter date they completed their service');
    });

    it('should validate the complete service date - unhappy path - future date', function() {
      // eslint-disable-next-line newline-after-var
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const mockRequest = {
        dateToCheck: dateFilter(tomorrow, null, 'DD/MM/YYYY'),
      };

      const validatorResult = validate(mockRequest, completeService());

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult).toHaveProperty('dateToCheck');
      expect(validatorResult.dateToCheck[0]).toHaveProperty('details');
      expect(validatorResult.dateToCheck[0].details).toEqual('Enter a completion date in the past');
    });
  });

})();
