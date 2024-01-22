/* eslint-disable */
(function() {
  'use strict';

  var validate = require('validate.js')
    , validator = require('./enter-expenses')
    , validatorResult = null;

  describe('Expenses - Enter daily expenses validators - attendance day:', function() {

    beforeEach(function() {
      validatorResult = null;
    });

    it('should validate a valid empty form request', function() {
      var mockRequest = {
        'totalTravelTime-hour': '',
        'totalTravelTime-minute': '',
        passengers: '',
        milesTravelled: '',
        parking: '',
        publicTrabsport: '',
        taxi: '',
        lossOfEarnings: '',
        extraCareCosts: '',
        otherCosts: '',
        otherCostsDescription: '',
        smartcardSpend: ''
      };

      validatorResult = validate(mockRequest, validator.attendanceDay());

      expect(validatorResult).to.be.undefined;
    });

    it('should validate a valid request', function() {
      var mockRequest = {
        'totalTravelTime-hour': '1',
        'totalTravelTime-minute': '25',
        passengers: '1',
        milesTravelled: '3',
        parking: '1.20',
        publicTransport: '4.50',
        taxi: '1.10',
        lossOfEarnings: '64',
        extraCareCosts: '10',
        otherCosts: '5',
        otherCostsDescription: 'other costs',
        smartcardSpend: '1.20'
      };

      validatorResult = validate(mockRequest, validator.attendanceDay());

      expect(validatorResult).to.be.undefined;
    });

    it('should try to validate an invalid request - invalid travel time', function() {
      var mockRequest = {
        'totalTravelTime-hour': '0',
        'totalTravelTime-minute': '65',
        passengers: '1',
        milesTravelled: '3',
        parking: '1.20',
        publicTransport: '4.50',
        taxi: '1.10',
        lossOfEarnings: '64',
        extraCareCosts: '10',
        otherCosts: '5',
        otherCostsDescription: 'other costs',
        smartcardSpend: '1.20'
      };

      validatorResult = validate(mockRequest, validator.attendanceDay());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult['totalTravelTime-minute'][0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult['totalTravelTime-minute'][0].details).to.equal('Enter minutes between 0 and 59');
    });

    it('should try to validate an invalid request - special chars / letters in input fields', function() {
      var mockRequest = {
        'totalTravelTime-hour': '%^1',
        'totalTravelTime-minute': '2lsd3',
        passengers: '!1',
        milesTravelled: '3$',
        parking: '1.20^',
        publicTransport: '4&&.50',
        taxi: '1.10***',
        lossOfEarnings: '6££4',
        extraCareCosts: '10@@@',
        otherCosts: '5llll',
        otherCostsDescription: 'other costs',
        smartcardSpend: '1.2sdsdsdew0'
      };

      validatorResult = validate(mockRequest, validator.attendanceDay());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult['totalTravelTime-hour'][0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult['totalTravelTime-hour'][0].details).to.equal('Total travel time can only include numbers');

      expect(validatorResult).to.be.an('object');
      expect(validatorResult['totalTravelTime-minute'][0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult['totalTravelTime-minute'][0].details).to.equal('Total travel time can only include numbers');

      expect(validatorResult).to.be.an('object');
      expect(validatorResult.passengers[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.passengers[0].details).to.equal('Number of other jurors taken as passengers can only include numbers');

      expect(validatorResult).to.be.an('object');
      expect(validatorResult.milesTravelled[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.milesTravelled[0].details).to.equal('Miles travelled can only include numbers');

      expect(validatorResult).to.be.an('object');
      expect(validatorResult.parking[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.parking[0].details).to.equal('Parking amount can only include numbers and a decimal point');

      expect(validatorResult).to.be.an('object');
      expect(validatorResult.publicTransport[0]).to.have.ownPropertyDescriptor('details');
      
      expect(validatorResult).to.be.an('object');
      expect(validatorResult.taxi[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.taxi[0].details).to.equal('Taxi amount can only include numbers and a decimal point');

      expect(validatorResult).to.be.an('object');
      expect(validatorResult.lossOfEarnings[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.lossOfEarnings[0].details).to.equal('Loss of earnings or benefits can only include numbers and a decimal point');

      expect(validatorResult).to.be.an('object');
      expect(validatorResult.extraCareCosts[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.extraCareCosts[0].details).to.equal('Extra care costs can only include numbers and a decimal point');

      expect(validatorResult).to.be.an('object');
      expect(validatorResult.otherCosts[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.otherCosts[0].details).to.equal('Other costs can only include numbers and a decimal point');

      expect(validatorResult).to.be.an('object');
      expect(validatorResult.smartcardSpend[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.smartcardSpend[0].details).to.equal('Amount spent on smartcard can only include numbers and a decimal point');
    });

    it('should validate an invalid request - other costs description too long', function() {
      var mockRequest = {
        'totalTravelTime-hour': '1',
        'totalTravelTime-minute': '25',
        passengers: '1',
        milesTravelled: '3',
        parking: '1.20',
        publicTransport: '4.50',
        taxi: '1.10',
        lossOfEarnings: '64',
        extraCareCosts: '10',
        otherCosts: '5',
        otherCostsDescription: 'othercostsdescriptionhshshshshshshhsahgskausbdodfuefeufbewfbeuwfbfoiwbdfweonbaeofbiweldfiabwofuwbfaoubfweflibewoewbfouwbf',
        smartcardSpend: '1.20'
      };

      validatorResult = validate(mockRequest, validator.attendanceDay());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult.otherCostsDescription[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.otherCostsDescription[0].details).to.equal('Description of other costs must be [x] characters or fewer');
    });

    it('should validate an invalid request - miles travelled not whole number', function() {
      var mockRequest = {
        'totalTravelTime-hour': '1',
        'totalTravelTime-minute': '25',
        passengers: '1',
        milesTravelled: '3.50',
        parking: '1.20',
        publicTransport: '4.50',
        taxi: '1.10',
        lossOfEarnings: '64',
        extraCareCosts: '10',
        otherCosts: '5',
        otherCostsDescription: 'othercostsdescription',
        smartcardSpend: '1.20'
      };

      validatorResult = validate(mockRequest, validator.attendanceDay());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult.milesTravelled[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.milesTravelled[0].details).to.equal('Miles travelled must be a whole number');
    });

  });

  describe('Expenses - Enter daily expenses validators - non-attendance day:', function() {

    beforeEach(function() {
      validatorResult = null;
    });

    it('should validate a valid empty form request', function() {
      var mockRequest = {
        lossOfEarnings: '',
        extraCareCosts: '',
        otherCosts: '',
        otherCostsDescription: '',
      };

      validatorResult = validate(mockRequest, validator.nonAttendanceDay());

      expect(validatorResult).to.be.undefined;
    });

    it('should validate a valid request', function() {
      var mockRequest = {
        lossOfEarnings: '64',
        extraCareCosts: '10',
        otherCosts: '5',
        otherCostsDescription: 'other costs',
      };

      validatorResult = validate(mockRequest, validator.nonAttendanceDay());

      expect(validatorResult).to.be.undefined;
    });

    it('should try to validate an invalid request - special chars / letters in input fields', function() {
      var mockRequest = {
        lossOfEarnings: '6££4',
        extraCareCosts: '10@@@',
        otherCosts: '5llll',
        otherCostsDescription: 'other costs',
      };

      validatorResult = validate(mockRequest, validator.nonAttendanceDay());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult.lossOfEarnings[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.lossOfEarnings[0].details).to.equal('Loss of earnings or benefits can only include numbers and a decimal point');

      expect(validatorResult).to.be.an('object');
      expect(validatorResult.extraCareCosts[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.extraCareCosts[0].details).to.equal('Extra care costs can only include numbers and a decimal point');

      expect(validatorResult).to.be.an('object');
      expect(validatorResult.otherCosts[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.otherCosts[0].details).to.equal('Other costs can only include numbers and a decimal point');

    });

    it('should validate an invalid request - other costs description too long', function() {
      var mockRequest = {
        lossOfEarnings: '64',
        extraCareCosts: '10',
        otherCosts: '5',
        otherCostsDescription: 'othercostsdescriptionhshshshshshshhsahgskausbdodfuefeufbewfbeuwfbfoiwbdfweonbaeofbiweldfiabwofuwbfaoubfweflibewoewbfouwbf',
      };

      validatorResult = validate(mockRequest, validator.nonAttendanceDay());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult.otherCostsDescription[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.otherCostsDescription[0].details).to.equal('Description of other costs must be [x] characters or fewer');
    });

  });

})();
