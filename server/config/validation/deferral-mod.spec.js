/* eslint-disable max-len */
(function() {
  'use strict';

  const validate = require('validate.js');
  const moment = require('moment');
  const allocationValidator = require('./deferral-mod').deferralReasonAndDecision;
  const deferralDateAndReason = require('./deferral-mod').deferralDateAndReason;
  const deferralDateAndPool = require('./deferral-mod').deferralDateAndPool;

  describe('Excusal form validators:', function() {

    it('should validate a valid request', function() {
      var mockRequest = {
        deferralDecision: 'REFUSE',
        deferralReason: 'A',
      };

      const validatorResult = validate(mockRequest, allocationValidator());

      expect(validatorResult).to.be.undefined;
    });

    it('should try to validate an invalid request - empty fields', function() {
      var mockRequest = {
        deferralReason: '',
        deferralDecision: '',
      };

      const validatorResult = validate(mockRequest, allocationValidator());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('deferralReason');
      expect(validatorResult.deferralReason[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.deferralReason[0].details).to.equal('Select a reason for this deferral request');
      expect(validatorResult).to.have.ownPropertyDescriptor('deferralDecision');
      expect(validatorResult.deferralDecision[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.deferralDecision[0].details).to.equal('Select whether you want to grant or refuse this deferral');
    });

    it('should validate deferral update - granted and deferral date selection checked', function() {
      const mockRequest = {
        deferralReason: 'A',
        deferralDecision: 'GRANT',
        deferralDateSelection: '10/01/2023',
      };

      const validatorResult = validate(mockRequest, allocationValidator());

      expect(validatorResult).to.be.undefined;
    });

    it('should validate deferral update - granted and no deferral date selection checked', function() {
      const mockRequest = {
        deferralReason: 'A',
        deferralDecision: 'GRANT',
        deferralDateSelection: '',
      };

      const validatorResult = validate(mockRequest, allocationValidator());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('deferralDateSelection');
      expect(validatorResult.deferralDateSelection[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.deferralDateSelection[0].details).to.equal('Select a date to defer to');
    });

    it('should validate deferral update - granted and other deferral date checked - and date entered', function() {
      const mockRequest = {
        deferralReason: 'A',
        deferralDecision: 'GRANT',
        deferralDateSelection: 'otherDate',
        deferralDate: '10/01/2023',
      };

      const validatorResult = validate(mockRequest, allocationValidator());

      expect(validatorResult).to.be.undefined;
    });

    it('should validate deferral update - granted and other deferral date checked - and no date entered', function() {
      const mockRequest = {
        deferralReason: 'A',
        deferralDecision: 'GRANT',
        deferralDateSelection: 'otherDate',
        deferralDate: '',
      };

      const validatorResult = validate(mockRequest, allocationValidator());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('deferralDate');
      expect(validatorResult.deferralDate[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.deferralDate[0].details).to.equal('Enter a date to defer to');
    });

    it('should try to validate an invalid request - missing deferral code', function() {
      const mockRequest = {
        deferralReason: '',
        deferralDecision: 'REFUSE',
      };

      const validatorResult = validate(mockRequest, allocationValidator());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('deferralReason');
      expect(validatorResult.deferralReason[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.deferralReason[0].details).to.equal('Select a reason for this deferral request');
    });

    it('should try to validate an invalid request - missing deferral decision', function() {
      const mockRequest = {
        deferralReason: 'A',
        deferralDecision: '',
      };

      const validatorResult = validate(mockRequest, allocationValidator());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('deferralDecision');
      expect(validatorResult.deferralDecision[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.deferralDecision[0].details).to.equal('Select whether you want to grant or refuse this deferral');
    });

  });

  describe('Deferral date and reason validator', () => {

    let minDate = new Date('12/12/2022'),
      maxDate = moment(minDate).add(12, 'M');

    it('should validate a valid request', () => {
      let mockRequest = {
        deferralDate: '01/01/2023',
        deferralReason: 'A',
      };

      const validatorResult = validate(mockRequest, deferralDateAndReason(minDate, maxDate));

      expect(validatorResult).to.be.undefined;
    });

    it('should validate an invalid request - empty fields', () => {
      let mockRequest = {
        deferralDate: '',
        deferralReason: '',
      };

      const validatorResult = validate(mockRequest, deferralDateAndReason(minDate, maxDate));

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

      const validatorResult = validate(mockRequest, deferralDateAndReason(minDate, maxDate));

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

      const validatorResult = validate(mockRequest, deferralDateAndReason(minDate, maxDate));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('deferralReason');
      expect(validatorResult.deferralReason[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.deferralReason[0].details).to.equal('Select a reason for the deferral request');
    });

  });

  describe('Deferral date and pool validator', () => {

    it('should validate a valid request', () => {
      let mockRequest = {
        deferralDateAndPool: '01/01/2023_123456789',
      };

      const validatorResult = validate(mockRequest, deferralDateAndPool());

      expect(validatorResult).to.be.undefined;
    });

    it('should validate a invalid request - empty field', () => {
      let mockRequest = {
        deferralDateAndPool: '',
      };

      const validatorResult = validate(mockRequest, deferralDateAndPool());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('deferralDateAndPool');
      expect(validatorResult.deferralDateAndPool[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.deferralDateAndPool[0].details).to.equal('Select a pool for this date');
    });

  });

})();
