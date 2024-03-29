/* eslint-disable */
(function() {
  'use strict';

  const validate = require('validate.js');
  const validator = require('./pool-create-court-only');
  const { dateFilter } = require('../../components/filters');
  let validatorResult = null;


  describe('Pool create - court only validators:', function() {

    beforeEach(function() {
      validatorResult = null;
    });

    it('should validate the court only pool details - valid selections', function() {
      const mockRequest = {
        serviceStartDate: dateFilter(new Date(), null, 'DD/MM/YYYY'),
        poolType: 'CRO'
      };

      validatorResult = validate(mockRequest, validator());
      expect(validatorResult).to.be.undefined;
    });

    it('should validate the court only pool details - no pool type selected', function() {
      const mockRequest = {
        serviceStartDate: dateFilter(new Date(), null, 'DD/MM/YYYY'),
        poolType: ''
      };

      validatorResult = validate(mockRequest, validator());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('poolType');
      expect(validatorResult.poolType[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.poolType[0].summary).to.equal('Select the type of pool');
      expect(validatorResult.poolType[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.poolType[0].details).to.equal('Select the type of pool');
    });

    it('should validate the court only pool details - empty date field', function() {
      const mockRequest = {
        serviceStartDate: '',
        poolType: 'CRO'
      };

      validatorResult = validate(mockRequest, validator());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('serviceStartDate');
      expect(validatorResult.serviceStartDate[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.serviceStartDate[0].summary).to.equal('Enter a service start date');
      expect(validatorResult.serviceStartDate[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.serviceStartDate[0].details[0]).to.equal('Enter a service start date');
    });


    it('should validate the court only pool details - date includes invalid chars', function() {
      const mockRequest = {
        serviceStartDate: '11!!12!!2**',
        poolType: 'CRO'
      };

      validatorResult = validate(mockRequest, validator());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('serviceStartDate');
      expect(validatorResult.serviceStartDate[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.serviceStartDate[0].summary).to.equal('Service start date must only include numbers and forward slashes');
      expect(validatorResult.serviceStartDate[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.serviceStartDate[0].details[0]).to.equal('Service start date must only include numbers and forward slashes');
    });

    it('should validate the court only pool details - date in wrong format', function() {
      const year = new Date().getFullYear();
      const mockRequest = {
        serviceStartDate: `01/31/${year}`,
        poolType: 'CRO'
      };

      validatorResult = validate(mockRequest, validator());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('serviceStartDate');
      expect(validatorResult.serviceStartDate[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.serviceStartDate[0].summary).to.equal('Enter a real date in the correct format, for example, 31/01/2023');
      expect(validatorResult.serviceStartDate[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.serviceStartDate[0].details[0]).to.equal('Enter a real date in the correct format, for example, 31/01/2023');
    });

    it('should validate the court only pool details - date in the past', function() {
      const mockRequest = {
        serviceStartDate: '01/01/2020',
        poolType: 'CRO'
      };

      validatorResult = validate(mockRequest, validator());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('serviceStartDate');
      expect(validatorResult.serviceStartDate[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.serviceStartDate[0].summary).to.equal('Service start date must be in the future');
      expect(validatorResult.serviceStartDate[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.serviceStartDate[0].details[0]).to.equal('Service start date must be in the future');
    });

    it('should validate the court only pool details - both fields empty', function() {
      const mockRequest = {
        serviceStartDate: '',
        poolType: ''
      };

      validatorResult = validate(mockRequest, validator());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('serviceStartDate');
      expect(validatorResult.serviceStartDate[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.serviceStartDate[0].summary).to.equal('Enter a service start date');
      expect(validatorResult.serviceStartDate[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.serviceStartDate[0].details[0]).to.equal('Enter a service start date');

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('poolType');
      expect(validatorResult.poolType[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.poolType[0].summary).to.equal('Select the type of pool');
      expect(validatorResult.poolType[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.poolType[0].details).to.equal('Select the type of pool');
    });

  });

})();
