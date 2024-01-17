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

      const validatorResult = validate(mockRequest, jurorsToDismiss());

      expect(validatorResult).to.be.undefined;
    });

    it('should validate jurors to dismiss and selected pools - unhappy path', function() {
      const mockRequest = {
        jurorsToDismiss: '',
        'checked-pools': [],
      };

      const validatorResult = validate(mockRequest, jurorsToDismiss());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownProperty('jurorsToDismiss');
      expect(validatorResult.jurorsToDismiss[0]).to.have.ownProperty('details');
      expect(validatorResult.jurorsToDismiss[0].details).to.be.equal('Enter how many jurors you want to dismiss');
      expect(validatorResult.jurorsToDismiss[1]).to.have.ownProperty('details');
      expect(validatorResult.jurorsToDismiss[1].details).to.be.equal('Amount of jurors to dismiss must be 1 or more');
      expect(validatorResult).to.have.ownProperty('checked-pools');
      expect(validatorResult['checked-pools'][0]).to.have.ownProperty('details');
      expect(validatorResult['checked-pools'][0].details).to.be.equal('Select at least one pool');
    });

    it('should validate the complete service date - happy path', function() {
      const today = new Date();
      const mockRequest = {
        dateToCheck: dateFilter(today, null, 'DD/MM/YYYY'),
      };

      const validatorResult = validate(mockRequest, completeService());

      expect(validatorResult).to.be.undefined;
    });

    it('should validate the complete service date - unhappy path', function() {
      const mockRequest = {
        dateToCheck: '',
      };

      const validatorResult = validate(mockRequest, completeService());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownProperty('dateToCheck');
      expect(validatorResult.dateToCheck[0]).to.have.ownProperty('details');
      expect(validatorResult.dateToCheck[0].details).to.be.equal('Enter date they completed their service');
    });

    it('should validate the complete service date - unhappy path - future date', function() {
      // eslint-disable-next-line newline-after-var
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const mockRequest = {
        dateToCheck: dateFilter(tomorrow, null, 'DD/MM/YYYY'),
      };

      const validatorResult = validate(mockRequest, completeService());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownProperty('dateToCheck');
      expect(validatorResult.dateToCheck[0]).to.have.ownProperty('details');
      expect(validatorResult.dateToCheck[0].details).to.be.equal('Enter a completion date in the past');
    });
  });

})();
