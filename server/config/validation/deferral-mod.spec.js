/* eslint-disable */
(function() {
  'use strict';

  var validate = require('validate.js')
    , moment = require('moment')
    , allocationValidator = require('./deferral-mod').deferralReasonAndDecision
    , deferralDateAndReason = require('./deferral-mod').deferralDateAndReason
    , deferralDateAndPool = require('./deferral-mod').deferralDateAndPool
    , validatorResult = null;

  describe('Excusal form validators:', function() {

    beforeEach(function() {
      validatorResult = null;
    });

    it('should validate a valid request', function() {
      var mockRequest = {
        deferralReason: "REFUSE",
        deferralDecision: "A",
      };

      validatorResult = validate(mockRequest, allocationValidator());

      expect(validatorResult).to.be.undefined;
    });

    it('should try to validate an invalid request - empty fields', function() {
      var mockRequest = {
        deferralReason: "",
        deferralDecision: "",
      };

      validatorResult = validate(mockRequest, allocationValidator());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('deferralReason');
      expect(validatorResult.deferralReason[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.deferralReason[0].details).to.equal('Select a reason for this deferral request');
      expect(validatorResult).to.have.ownPropertyDescriptor('deferralDecision');
      expect(validatorResult.deferralDecision[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.deferralDecision[0].details).to.equal('Select whether you want to grant or refused this deferral');
    });

    it('should try to validate an invalid request - missing deferral code', function() {
      var mockRequest = {
        deferralReason: "REFUSE",
        deferralDecision: "",
      };

      validatorResult = validate(mockRequest, allocationValidator());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('deferralDecision');
      expect(validatorResult.deferralDecision[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.deferralDecision[0].details).to.equal('Select whether you want to grant or refused this deferral');
      });

      it('should try to validate an invalid request - missing deferral decision', function() {
        var mockRequest = {
          deferralReason: "",
          deferralDecision: "A",
        };
  
        validatorResult = validate(mockRequest, allocationValidator());
  
        expect(validatorResult).to.be.an('object');
        expect(validatorResult).to.have.ownPropertyDescriptor('deferralReason');
        expect(validatorResult.deferralReason[0]).to.have.ownPropertyDescriptor('details');
        expect(validatorResult.deferralReason[0].details).to.equal('Select a reason for this deferral request');
      });

  });

  describe('Deferral date and reason validator', () => {

    let minDate = new Date('12/12/2022'),
      maxDate = moment(minDate).add(12, 'M');

    beforeEach(function() {
      validatorResult = null;
    });

    it('should validate a valid request', () => {
      let mockRequest = {
        deferralDate: '01/01/2023',
        deferralReason: 'A',
      };

      validatorResult = validate(mockRequest, deferralDateAndReason(minDate, maxDate));

      expect(validatorResult).to.be.undefined;
      
    });

    it('should validate an invalid request - empty fields', () => {
      let mockRequest = {
        deferralDate: '',
        deferralReason: '',
      };      

      validatorResult = validate(mockRequest, deferralDateAndReason(minDate, maxDate));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('deferralDate');
      expect(validatorResult.deferralDate[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.deferralDate[0].details).to.equal('Enter a date to defer this juror to');
      expect(validatorResult).to.have.ownPropertyDescriptor('deferralReason');
      expect(validatorResult.deferralReason[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.deferralReason[0].details).to.equal('Select a reason for the deferral request');
   
    });

    it('should validate an invalid request - missing deferral date', () => {
      let mockRequest = {
        deferralDate: '',
        deferralReason: 'A',
      };      

      validatorResult = validate(mockRequest, deferralDateAndReason(minDate, maxDate));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('deferralDate');
      expect(validatorResult.deferralDate[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.deferralDate[0].details).to.equal('Enter a date to defer this juror to');
   
    });

    it('should validate an invalid request - missing deferral reason', () => {
      let mockRequest = {
        deferralDate: '01/01/2023',
        deferralReason: '',
      };      

      validatorResult = validate(mockRequest, deferralDateAndReason(minDate, maxDate));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('deferralReason');
      expect(validatorResult.deferralReason[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.deferralReason[0].details).to.equal('Select a reason for the deferral request');
   
    });

  });

  describe('Deferral date and pool validator', () => {

    beforeEach(function() {
      validatorResult = null;
    });

    it('should validate a valid request', () => {
      let mockRequest = {
        deferralDateAndPool: '01/01/2023_123456789',
      };

      validatorResult = validate(mockRequest, deferralDateAndPool());

      expect(validatorResult).to.be.undefined;
    });

    it('should validate a invalid request - empty field', () => {
      let mockRequest = {
        deferralDateAndPool: '',
      };

      validatorResult = validate(mockRequest, deferralDateAndPool());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('deferralDateAndPool');
      expect(validatorResult.deferralDateAndPool[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.deferralDateAndPool[0].details).to.equal('Select a pool for this date');
    });

  })

})();
