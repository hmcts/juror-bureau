/* eslint-disable */
(function() {
  'use strict';

  var validate = require('validate.js')
    , requestPoolVal = require('./request-pool')
    , validatorResult = null;

  describe('Pool request validators:', function() {

    beforeEach(function() {
      validatorResult = null;
    });

    it('should validate the pool details - happy path', function() {
      var mockRequest = {
        poolType: 'CRO',
        numberOfJurorsRequired: 100,
      };

      validatorResult = validate(mockRequest, requestPoolVal.poolDetails(mockRequest));

      expect(validatorResult).to.be.undefined;
    });

    it('should validate the pool details - empty pool type', function() {
      var mockRequest = {
        numberOfJurorsRequired: 100,
      };

      validatorResult = validate(mockRequest, requestPoolVal.poolDetails(mockRequest));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('poolType');
      expect(validatorResult.poolType).to.be.an.instanceof(Array);
      expect(validatorResult.poolType).to.be.of.length(1);
      expect(validatorResult.poolType[0]).to.be.an('object');
      expect(validatorResult.poolType[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.poolType[0]).to.have.ownPropertyDescriptor('fields');
      expect(validatorResult.poolType[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.poolType[0].summary).to.equal('Pool type is missing');
      expect(validatorResult.poolType[0].fields).to.be.of.length(1);
      expect(validatorResult.poolType[0].fields[0]).to.equal('poolType');
      expect(validatorResult.poolType[0].details).to.be.of.length(1);
      expect(validatorResult.poolType[0].details[0]).to.equal('Select a pool type');
    });

    it('should validate the pool details - empty number of jurors required', function() {
      var mockRequest = {
        poolType: 'CRO',
        numberOfJurorsRequired: ''
      };

      validatorResult = validate(mockRequest, requestPoolVal.poolDetails(mockRequest));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('numberOfJurorsRequired');
      expect(validatorResult.numberOfJurorsRequired).to.be.an.instanceof(Array);
      expect(validatorResult.numberOfJurorsRequired).to.be.of.length(1);
      expect(validatorResult.numberOfJurorsRequired[0]).to.be.an('object');
      expect(validatorResult.numberOfJurorsRequired[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.numberOfJurorsRequired[0]).to.have.ownPropertyDescriptor('fields');
      expect(validatorResult.numberOfJurorsRequired[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.numberOfJurorsRequired[0].summary).to.equal('Number of jurors required is missing');
      expect(validatorResult.numberOfJurorsRequired[0].fields).to.be.of.length(1);
      expect(validatorResult.numberOfJurorsRequired[0].fields[0]).to.equal('numberOfJurorsRequired');
      expect(validatorResult.numberOfJurorsRequired[0].details).to.be.of.length(1);
      expect(validatorResult.numberOfJurorsRequired[0].details[0]).to.equal('Enter the number of jurors required');
    });

    it('should validate the pool details - invalid number of jurors required', function() {
      var mockRequest = {
        poolType: 'CRO',
        numberOfJurorsRequired: 'hello'
      };

      validatorResult = validate(mockRequest, requestPoolVal.poolDetails(mockRequest));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('numberOfJurorsRequired');
      expect(validatorResult.numberOfJurorsRequired).to.be.an.instanceof(Array);
      expect(validatorResult.numberOfJurorsRequired).to.be.of.length(1);
      expect(validatorResult.numberOfJurorsRequired[0]).to.be.an('object');
      expect(validatorResult.numberOfJurorsRequired[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.numberOfJurorsRequired[0]).to.have.ownPropertyDescriptor('fields');
      expect(validatorResult.numberOfJurorsRequired[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.numberOfJurorsRequired[0].summary).to.equal('Number of jurors required is wrong');
      expect(validatorResult.numberOfJurorsRequired[0].fields).to.be.of.length(1);
      expect(validatorResult.numberOfJurorsRequired[0].fields[0]).to.equal('numberOfJurorsRequired');
      expect(validatorResult.numberOfJurorsRequired[0].details).to.be.of.length(1);
      expect(validatorResult.numberOfJurorsRequired[0].details[0]).to.equal('Number of pool members must be a number');
    });

    it('should validate the pool details - high number of jurors required', function() {
      var mockRequest = {
        poolType: 'CRO',
        numberOfJurorsRequired: 3001
      };

      validatorResult = validate(mockRequest, requestPoolVal.poolDetails(mockRequest));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('numberOfJurorsRequired');
      expect(validatorResult.numberOfJurorsRequired).to.be.an.instanceof(Array);
      expect(validatorResult.numberOfJurorsRequired).to.be.of.length(1);
      expect(validatorResult.numberOfJurorsRequired[0]).to.be.an('object');
      expect(validatorResult.numberOfJurorsRequired[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.numberOfJurorsRequired[0]).to.have.ownPropertyDescriptor('fields');
      expect(validatorResult.numberOfJurorsRequired[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.numberOfJurorsRequired[0].summary).to.equal('Number of jurors required is too high');
      expect(validatorResult.numberOfJurorsRequired[0].fields).to.be.of.length(1);
      expect(validatorResult.numberOfJurorsRequired[0].fields[0]).to.equal('numberOfJurorsRequired');
      expect(validatorResult.numberOfJurorsRequired[0].details).to.be.of.length(1);
      expect(validatorResult.numberOfJurorsRequired[0].details[0]).to.equal('Enter a number that is less than 3,000');
    });

    it('should validate the pool details - low number of jurors required', function() {
      var mockRequest = {
        poolType: 'CRO',
        numberOfJurorsRequired: -1
      };

      validatorResult = validate(mockRequest, requestPoolVal.poolDetails(mockRequest));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('numberOfJurorsRequired');
      expect(validatorResult.numberOfJurorsRequired).to.be.an.instanceof(Array);
      expect(validatorResult.numberOfJurorsRequired).to.be.of.length(1);
      expect(validatorResult.numberOfJurorsRequired[0]).to.be.an('object');
      expect(validatorResult.numberOfJurorsRequired[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.numberOfJurorsRequired[0]).to.have.ownPropertyDescriptor('fields');
      expect(validatorResult.numberOfJurorsRequired[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.numberOfJurorsRequired[0].summary).to.equal('Number of jurors required is wrong');
      expect(validatorResult.numberOfJurorsRequired[0].fields).to.be.of.length(1);
      expect(validatorResult.numberOfJurorsRequired[0].fields[0]).to.equal('numberOfJurorsRequired');
      expect(validatorResult.numberOfJurorsRequired[0].details).to.be.of.length(1);
      expect(validatorResult.numberOfJurorsRequired[0].details[0]).to.equal('Number of pool members cannot be negative');
    });

    it('should validate the pool type alone - happy path', function() {
      var mockRequest = {
        poolType: 'CRO'
      };

      validatorResult = validate(mockRequest, requestPoolVal.poolType(mockRequest));

      expect(validatorResult).to.be.undefined;
    });

    it('should validate the court name or location - happy path', function() {
      var mockRequest = {
        courtNameOrLocation: '100'
      };

      validatorResult = validate(mockRequest, requestPoolVal.courtNameOrLocation(mockRequest));

      expect(validatorResult).to.be.undefined;
    });

    it('should validate the court name or location - empty court name or location', function() {
      var mockRequest = {};

      validatorResult = validate(mockRequest, requestPoolVal.courtNameOrLocation(mockRequest));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('courtNameOrLocation');
      expect(validatorResult.courtNameOrLocation).to.be.instanceof(Array);
      expect(validatorResult.courtNameOrLocation).to.be.of.length(1);
      expect(validatorResult.courtNameOrLocation[0]).to.be.an('object');
      expect(validatorResult.courtNameOrLocation[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.courtNameOrLocation[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.courtNameOrLocation[0].summary).to.equal('Enter the name or location code for a court');
      expect(validatorResult.courtNameOrLocation[0].details).to.equal('Court name or location is missing');
    });

    it('should validate the pool number - happy path', function() {
      var mockRequest = {
        session: {
          poolDetails: {
            courtCode: '100',
            attendanceDate: '01/01/2024',
          },
          poolNumbers: []
        },
        body: {
          poolNumber: '100240101'
        }
      };

      validatorResult = validate(mockRequest.body, requestPoolVal.poolNumber(mockRequest));

      expect(validatorResult).to.be.undefined;
    });

    it('should validate the pool number - pool number exists', function() {
      var mockRequest = {
        session: {
          poolDetails: {
            courtCode: '100',
            attendanceDate: '01/01/2024',
          },
          poolNumbers: [{
            poolNumber: '100240101'
          }]
        },
        body: {
          poolNumber: '100240101'
        }
      };

      validatorResult = validate(mockRequest.body, requestPoolVal.poolNumber(mockRequest));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('poolNumber');
      expect(validatorResult.poolNumber).to.be.an.instanceof(Array);
      expect(validatorResult.poolNumber).to.be.of.length(1);
      expect(validatorResult.poolNumber[0]).to.be.an('object');
      expect(validatorResult.poolNumber[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.poolNumber[0]).to.have.ownPropertyDescriptor('fields');
      expect(validatorResult.poolNumber[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.poolNumber[0].summary).to.equal('Pool number is wrong');
      expect(validatorResult.poolNumber[0].fields).to.be.of.length(1);
      expect(validatorResult.poolNumber[0].fields[0]).to.equal('poolNumber');
      expect(validatorResult.poolNumber[0].details).to.be.of.length(1);
      expect(validatorResult.poolNumber[0].details[0]).to.equal('Pool number is already being used');
    });

    it('should validate the pool number - pool number is empty', function() {
      var mockRequest = {
        session: {
          poolDetails: {
            courtCode: '100',
            attendanceDate: '01/01/2024',
          },
          poolNumbers: []
        },
        body: {
          poolNumber: ''
        }
      };

      validatorResult = validate(mockRequest.body, requestPoolVal.poolNumber(mockRequest));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('poolNumber');
      expect(validatorResult.poolNumber).to.be.an.instanceof(Array);
      expect(validatorResult.poolNumber).to.be.of.length(1);
      expect(validatorResult.poolNumber[0]).to.be.an('object');
      expect(validatorResult.poolNumber[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.poolNumber[0]).to.have.ownPropertyDescriptor('fields');
      expect(validatorResult.poolNumber[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.poolNumber[0].summary).to.equal('Pool number is wrong');
      expect(validatorResult.poolNumber[0].fields).to.be.of.length(1);
      expect(validatorResult.poolNumber[0].fields[0]).to.equal('poolNumber');
      expect(validatorResult.poolNumber[0].details).to.be.of.length(1);
      expect(validatorResult.poolNumber[0].details[0]).to.equal('Please enter a pool number');
    });

    it('should validate the pool number - pool number is less than the required length of 9', function() {
      var mockRequest = {
        session: {
          poolDetails: {
            courtCode: '100',
            attendanceDate: '01/01/2024',
          },
          poolNumbers: []
        },
        body: {
          poolNumber: '10024010'
        }
      };

      validatorResult = validate(mockRequest.body, requestPoolVal.poolNumber(mockRequest));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('poolNumber');
      expect(validatorResult.poolNumber).to.be.an.instanceof(Array);
      expect(validatorResult.poolNumber).to.be.of.length(1);
      expect(validatorResult.poolNumber[0]).to.be.an('object');
      expect(validatorResult.poolNumber[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.poolNumber[0]).to.have.ownPropertyDescriptor('fields');
      expect(validatorResult.poolNumber[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.poolNumber[0].summary).to.equal('Pool number is wrong');
      expect(validatorResult.poolNumber[0].fields).to.be.of.length(1);
      expect(validatorResult.poolNumber[0].fields[0]).to.equal('poolNumber');
      expect(validatorResult.poolNumber[0].details).to.be.of.length(1);
      expect(validatorResult.poolNumber[0].details[0]).to.equal('Pool number must have a minimum of 9 characters');
    });

    it('should validate the pool number - pool number is more than the required length of 9', function() {
      var mockRequest = {
        session: {
          poolDetails: {
            courtCode: '100',
            attendanceDate: '01/01/2024',
          },
          poolNumbers: []
        },
        body: {
          poolNumber: '1002401010'
        }
      };

      validatorResult = validate(mockRequest.body, requestPoolVal.poolNumber(mockRequest));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('poolNumber');
      expect(validatorResult.poolNumber).to.be.an.instanceof(Array);
      expect(validatorResult.poolNumber).to.be.of.length(1);
      expect(validatorResult.poolNumber[0]).to.be.an('object');
      expect(validatorResult.poolNumber[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.poolNumber[0]).to.have.ownPropertyDescriptor('fields');
      expect(validatorResult.poolNumber[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.poolNumber[0].summary).to.equal('Pool number is wrong');
      expect(validatorResult.poolNumber[0].fields).to.be.of.length(1);
      expect(validatorResult.poolNumber[0].fields[0]).to.equal('poolNumber');
      expect(validatorResult.poolNumber[0].details).to.be.of.length(1);
      expect(validatorResult.poolNumber[0].details[0]).to.equal('Pool number must have a maximum of 9 characters');
    });

    it('should validate the pool number - pool number does not match the court code', function() {
      var mockRequest = {
        session: {
          poolDetails: {
            courtCode: '101',
            attendanceDate: '01/01/2024',
          },
          poolNumbers: []
        },
        body: {
          poolNumber: '100240101'
        }
      };

      validatorResult = validate(mockRequest.body, requestPoolVal.poolNumber(mockRequest));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('poolNumber');
      expect(validatorResult.poolNumber).to.be.an.instanceof(Array);
      expect(validatorResult.poolNumber).to.be.of.length(1);
      expect(validatorResult.poolNumber[0]).to.be.an('object');
      expect(validatorResult.poolNumber[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.poolNumber[0]).to.have.ownPropertyDescriptor('fields');
      expect(validatorResult.poolNumber[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.poolNumber[0].summary).to.equal('Pool number is wrong');
      expect(validatorResult.poolNumber[0].fields).to.be.of.length(1);
      expect(validatorResult.poolNumber[0].fields[0]).to.equal('poolNumber');
      expect(validatorResult.poolNumber[0].details).to.be.of.length(1);
      expect(validatorResult.poolNumber[0].details[0]).to.equal('Pool number must use court location code');
    });

    it('should validate the pool number - pool number does not match the year of attendance', function() {
      var mockRequest = {
        session: {
          poolDetails: {
            courtCode: '100',
            attendanceDate: '01/01/2024',
          },
          poolNumbers: []
        },
        body: {
          poolNumber: '100230101'
        }
      };

      validatorResult = validate(mockRequest.body, requestPoolVal.poolNumber(mockRequest));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('poolNumber');
      expect(validatorResult.poolNumber).to.be.an.instanceof(Array);
      expect(validatorResult.poolNumber).to.be.of.length(1);
      expect(validatorResult.poolNumber[0]).to.be.an('object');
      expect(validatorResult.poolNumber[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.poolNumber[0]).to.have.ownPropertyDescriptor('fields');
      expect(validatorResult.poolNumber[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.poolNumber[0].summary).to.equal('Pool number is wrong');
      expect(validatorResult.poolNumber[0].fields).to.be.of.length(1);
      expect(validatorResult.poolNumber[0].fields[0]).to.equal('poolNumber');
      expect(validatorResult.poolNumber[0].details).to.be.of.length(1);
      expect(validatorResult.poolNumber[0].details[0]).to.equal('Pool number must use year of attendance date');
    });

    it('should validate the pool number - pool number does not match the month of attendance', function() {
      var mockRequest = {
        session: {
          poolDetails: {
            courtCode: '100',
            attendanceDate: '01/01/2024',
          },
          poolNumbers: []
        },
        body: {
          poolNumber: '100240201'
        }
      };

      validatorResult = validate(mockRequest.body, requestPoolVal.poolNumber(mockRequest));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('poolNumber');
      expect(validatorResult.poolNumber).to.be.an.instanceof(Array);
      expect(validatorResult.poolNumber).to.be.of.length(1);
      expect(validatorResult.poolNumber[0]).to.be.an('object');
      expect(validatorResult.poolNumber[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.poolNumber[0]).to.have.ownPropertyDescriptor('fields');
      expect(validatorResult.poolNumber[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.poolNumber[0].summary).to.equal('Pool number is wrong');
      expect(validatorResult.poolNumber[0].fields).to.be.of.length(1);
      expect(validatorResult.poolNumber[0].fields[0]).to.equal('poolNumber');
      expect(validatorResult.poolNumber[0].details).to.be.of.length(1);
      expect(validatorResult.poolNumber[0].details[0]).to.equal('Pool number must use month of attendance date');
    });

    it('should validate the pool number - invalid pool number sequence', function() {
      var mockRequest = {
        session: {
          poolDetails: {
            courtCode: '100',
            attendanceDate: '01/01/2024',
          },
          poolNumbers: []
        },
        body: {
          poolNumber: '100240100'
        }
      };

      validatorResult = validate(mockRequest.body, requestPoolVal.poolNumber(mockRequest));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('poolNumber');
      expect(validatorResult.poolNumber).to.be.an.instanceof(Array);
      expect(validatorResult.poolNumber).to.be.of.length(1);
      expect(validatorResult.poolNumber[0]).to.be.an('object');
      expect(validatorResult.poolNumber[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.poolNumber[0]).to.have.ownPropertyDescriptor('fields');
      expect(validatorResult.poolNumber[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.poolNumber[0].summary).to.equal('Pool number is wrong');
      expect(validatorResult.poolNumber[0].fields).to.be.of.length(1);
      expect(validatorResult.poolNumber[0].fields[0]).to.equal('poolNumber');
      expect(validatorResult.poolNumber[0].details).to.be.of.length(1);
      expect(validatorResult.poolNumber[0].details[0]).to.equal('Pool number sequence must be between 00 and 99');
    });

    it('should validate the attendance time - happy path', function() {
      var mockRequest = {
        attendanceTimeHour: '10',
        attendanceTimeMinute: '30'
      };

      validatorResult = validate(mockRequest, requestPoolVal.attendanceTime(mockRequest));

      expect(validatorResult).to.be.undefined;
    });

    it('should validate the attendance time - empty hour and empty minute', function() {
      var mockRequest = {
        attendanceTimeHour: '',
        attendanceTimeMinute: ''
      };

      validatorResult = validate(mockRequest, requestPoolVal.attendanceTime(mockRequest));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('attendanceTimeHour');
      expect(validatorResult.attendanceTimeHour).to.be.instanceof(Array);
      expect(validatorResult.attendanceTimeHour[0]).to.be.an('object');
      expect(validatorResult.attendanceTimeHour[0].summary).to.equal('Please enter an attendance hour');
      expect(validatorResult.attendanceTimeHour[0].details).to.equal('Please enter an attendance hour');
      expect(validatorResult).to.have.ownPropertyDescriptor('attendanceTimeMinute');
      expect(validatorResult.attendanceTimeMinute).to.be.instanceof(Array);
      expect(validatorResult.attendanceTimeMinute[0]).to.be.an('object');
      expect(validatorResult.attendanceTimeMinute[0].summary).to.equal('Please enter an attendance minute');
      expect(validatorResult.attendanceTimeMinute[0].details).to.equal('Please enter an attendance minute');
    });

    it('should validate the attendance time - invalid hour and invalid minute', function() {
      var mockRequest = {
        attendanceTimeHour: 'hh',
        attendanceTimeMinute: 'mm'
      };

      validatorResult = validate(mockRequest, requestPoolVal.attendanceTime(mockRequest));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('attendanceTimeHour');
      expect(validatorResult.attendanceTimeHour).to.be.instanceof(Array);
      expect(validatorResult.attendanceTimeHour[0]).to.be.an('object');
      expect(validatorResult.attendanceTimeHour[0].summary).to.equal('Please check your attendance hour');
      expect(validatorResult.attendanceTimeHour[0].details).to.equal('Please enter the hour as a number. For example, 6 for 6am or 18 for 6pm');
      expect(validatorResult).to.have.ownPropertyDescriptor('attendanceTimeMinute');
      expect(validatorResult.attendanceTimeMinute).to.be.instanceof(Array);
      expect(validatorResult.attendanceTimeMinute[0]).to.be.an('object');
      expect(validatorResult.attendanceTimeMinute[0].summary).to.equal('Please check your attendance minute');
      expect(validatorResult.attendanceTimeMinute[0].details).to.equal('Please enter the minute as a number. For example, 15');
    });

    it('should validate the attendance time - out of range', function() {
      var mockRequest = {
        attendanceTimeHour: '24',
        attendanceTimeMinute: '60'
      };

      validatorResult = validate(mockRequest, requestPoolVal.attendanceTime(mockRequest));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('attendanceTimeHour');
      expect(validatorResult.attendanceTimeHour).to.be.instanceof(Array);
      expect(validatorResult.attendanceTimeHour[0]).to.be.an('object');
      expect(validatorResult.attendanceTimeHour[0].summary).to.equal('Please check your attendance hour');
      expect(validatorResult.attendanceTimeHour[0].details).to.equal('Please enter an hour between 0 and 23');
      expect(validatorResult).to.have.ownPropertyDescriptor('attendanceTimeMinute');
      expect(validatorResult.attendanceTimeMinute).to.be.instanceof(Array);
      expect(validatorResult.attendanceTimeMinute[0]).to.be.an('object');
      expect(validatorResult.attendanceTimeMinute[0].summary).to.equal('Please check your attendance minute');
      expect(validatorResult.attendanceTimeMinute[0].details).to.equal('Please enter a minute between 0 and 59');
    });

    it('should validate the number of deferrals - happy path', function() {
      var mockRequest = {
        numberOfDeferrals: 50,
      };

      validatorResult = validate({ numberOfDeferrals: 100 }, requestPoolVal.numberOfDeferrals(mockRequest));

      expect(validatorResult).to.be.undefined;
    });

    it('should validate the number of deferrals - number of deferrals is missing', function() {
      var mockRequest = {
        numberOfDeferrals: ''
      };

      validatorResult = validate({ numberOfDeferrals: 100 }, requestPoolVal.numberOfDeferrals(mockRequest));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('numberOfDeferrals');
      expect(validatorResult.numberOfDeferrals).to.be.instanceof(Array);
      expect(validatorResult.numberOfDeferrals[0]).to.be.an('object');
      expect(validatorResult.numberOfDeferrals[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.numberOfDeferrals[0].summary).to.equal('Number of deferrals is missing');
      expect(validatorResult.numberOfDeferrals[0]).to.have.ownPropertyDescriptor('fields');
      expect(validatorResult.numberOfDeferrals[0].fields).to.equal('numberOfDeferrals');
      expect(validatorResult.numberOfDeferrals[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.numberOfDeferrals[0].details).to.be.length(1);
      expect(validatorResult.numberOfDeferrals[0].details[0]).to.equal('Enter the number of deferrals to be included. For no deferrals enter 0');
    });

    it('should validate the number of deferrals - invalid number of deferrals', function() {
      var mockRequest = {
        numberOfDeferrals: 'xx'
      };

      validatorResult = validate({ numberOfDeferrals: 100 }, requestPoolVal.numberOfDeferrals(mockRequest));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('numberOfDeferrals');
      expect(validatorResult.numberOfDeferrals).to.be.instanceof(Array);
      expect(validatorResult.numberOfDeferrals[0]).to.be.an('object');
      expect(validatorResult.numberOfDeferrals[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.numberOfDeferrals[0].summary).to.equal('Number of deferrals is wrong');
      expect(validatorResult.numberOfDeferrals[0]).to.have.ownPropertyDescriptor('fields');
      expect(validatorResult.numberOfDeferrals[0].fields).to.equal('numberOfDeferrals');
      expect(validatorResult.numberOfDeferrals[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.numberOfDeferrals[0].details).to.be.length(1);
      expect(validatorResult.numberOfDeferrals[0].details[0]).to.equal('Enter only numbers, not letters');
    });

    it('should validate the number of deferrals - negative number of deferrals', function() {
      var mockRequest = {
        numberOfDeferrals: '-10'
      };

      validatorResult = validate({ numberOfDeferrals: 100 }, requestPoolVal.numberOfDeferrals(mockRequest));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('numberOfDeferrals');
      expect(validatorResult.numberOfDeferrals).to.be.instanceof(Array);
      expect(validatorResult.numberOfDeferrals[0]).to.be.an('object');
      expect(validatorResult.numberOfDeferrals[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.numberOfDeferrals[0].summary).to.equal('Number of deferrals cannot be negative');
      expect(validatorResult.numberOfDeferrals[0]).to.have.ownPropertyDescriptor('fields');
      expect(validatorResult.numberOfDeferrals[0].fields).to.equal('numberOfDeferrals');
      expect(validatorResult.numberOfDeferrals[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.numberOfDeferrals[0].details).to.be.length(1);
      expect(validatorResult.numberOfDeferrals[0].details[0]).to.equal('Number of deferrals cannot be negative');
    });

    it('should validate the number of deferrals - number of deferrals too high', function() {
      var mockRequest = {
        numberOfDeferrals: '120'
      };

      validatorResult = validate({ numberOfDeferrals: 100 }, requestPoolVal.numberOfDeferrals(mockRequest));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('numberOfDeferrals');
      expect(validatorResult.numberOfDeferrals).to.be.instanceof(Array);
      expect(validatorResult.numberOfDeferrals[0]).to.be.an('object');
      expect(validatorResult.numberOfDeferrals[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.numberOfDeferrals[0].summary).to.equal('Number of deferrals is too high');
      expect(validatorResult.numberOfDeferrals[0]).to.have.ownPropertyDescriptor('fields');
      expect(validatorResult.numberOfDeferrals[0].fields).to.equal('numberOfDeferrals');
      expect(validatorResult.numberOfDeferrals[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.numberOfDeferrals[0].details).to.be.length(1);
      expect(validatorResult.numberOfDeferrals[0].details[0]).to.equal('Enter the same  or less than the number available');
    });

    it('should validate the attendance date - happy path', function() {
      var mockRequest = {
        attendanceDate: '21/11/2030',
      };

      validatorResult = validate(mockRequest, requestPoolVal.validateDate(mockRequest));

      expect(validatorResult).to.be.undefined;
    });

    it('should validate the attendance date - in the past', function() {
      var mockRequest = {
        attendanceDate: '23/12/2022',
      };

      validatorResult = validate(mockRequest, requestPoolVal.validateDate(mockRequest));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('attendanceDate');
      expect(validatorResult.attendanceDate).to.be.instanceof(Array);
      expect(validatorResult.attendanceDate[0]).to.be.an('object');
      expect(validatorResult.attendanceDate[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.attendanceDate[0].summary).to.equal('Service start date must be in the future');
      expect(validatorResult.attendanceDate[0]).to.have.ownPropertyDescriptor('fields');
      expect(validatorResult.attendanceDate[0].fields).to.be.length(1);
      expect(validatorResult.attendanceDate[0].fields[0]).to.equal('attendanceDate');
      expect(validatorResult.attendanceDate[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.attendanceDate[0].details).to.be.length(1);
      expect(validatorResult.attendanceDate[0].details[0]).to.equal('Service start date must be in the future');
    });

    it('should validate the attendance date - missing date', function() {
      var mockRequest = {
        attendanceDate: '',
      };

      validatorResult = validate(mockRequest, requestPoolVal.validateDate(mockRequest));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('attendanceDate');
      expect(validatorResult.attendanceDate).to.be.instanceof(Array);
      expect(validatorResult.attendanceDate[0]).to.be.an('object');
      expect(validatorResult.attendanceDate[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.attendanceDate[0].summary).to.equal('Enter a new service start date for this pool');
      expect(validatorResult.attendanceDate[0]).to.have.ownPropertyDescriptor('fields');
      expect(validatorResult.attendanceDate[0].fields).to.be.length(1);
      expect(validatorResult.attendanceDate[0].fields[0]).to.equal('attendanceDate');
      expect(validatorResult.attendanceDate[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.attendanceDate[0].details).to.be.length(1);
      expect(validatorResult.attendanceDate[0].details[0]).to.equal('Enter a new service start date for this pool');
    });

    it('should validate the coroner pool postcode selected values - happy path', function() {
      var mockRequest = {
          CH1: '10',
          CH2: '20',
          CH3: '',
        }
        , liveDataMock = [
          {
            postCodePart: 'CH1',
            total: 20,
          },
          {
            postCodePart: 'CH2',
            total: 20,
          },
          {
            postCodePart: 'CH3',
            total: 10,
          },
        ]
        , postcodeAndNumbers = [];

      validatorResult = validate(mockRequest, requestPoolVal.coronerPoolPostcodes(liveDataMock, postcodeAndNumbers));

      expect(validatorResult).to.be.undefined;
    });

    it('should validate the coroner pool postcode selected values - over the limit single', function() {
      var mockRequest = {
          CH1: '30',
          CH2: '20',
          CH3: '',
        }
        , liveDataMock = [
          {
            postCodePart: 'CH1',
            total: 20,
          },
          {
            postCodePart: 'CH2',
            total: 20,
          },
          {
            postCodePart: 'CH3',
            total: 10,
          },
        ]
        , postcodeAndNumbers = [];

      validatorResult = validate(mockRequest, requestPoolVal.coronerPoolPostcodes(liveDataMock, postcodeAndNumbers, 0));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('coronerPostcodes');
      expect(validatorResult.coronerPostcodes).to.be.instanceof(Array);
      expect(validatorResult.coronerPostcodes[0]).to.be.an('object');
      expect(validatorResult.coronerPostcodes[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.coronerPostcodes[0].summary).to.be.instanceof(Array);
      expect(validatorResult.coronerPostcodes[0].summary[0]).to.equal('The number of citizens you can enter for postcode CH1 must be 20 or fewer');
      expect(validatorResult.coronerPostcodes[0]).to.have.ownPropertyDescriptor('fields');
      expect(validatorResult.coronerPostcodes[0].fields).to.be.instanceof(Array);
      expect(validatorResult.coronerPostcodes[0].fields[0]).to.equal('CH1');
      expect(validatorResult.coronerPostcodes[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.coronerPostcodes[0].details).to.be.instanceof(Array);
      expect(validatorResult.coronerPostcodes[0].details[0]).to.equal('The number of citizens you can enter for postcode CH1 must be 20 or fewer');
    });

    it('should validate the coroner pool postcode selected values - over the limit multiple', function() {
      var mockRequest = {
          CH1: '30',
          CH2: '30',
          CH3: '',
        }
        , liveDataMock = [
          {
            postCodePart: 'CH1',
            total: 20,
          },
          {
            postCodePart: 'CH2',
            total: 20,
          },
          {
            postCodePart: 'CH3',
            total: 10,
          },
        ]
        , postcodeAndNumbers = [];

      validatorResult = validate(mockRequest, requestPoolVal.coronerPoolPostcodes(liveDataMock, postcodeAndNumbers, 0));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('coronerPostcodes');
      expect(validatorResult.coronerPostcodes).to.be.instanceof(Array);
      expect(validatorResult.coronerPostcodes[0]).to.be.an('object');
      expect(validatorResult.coronerPostcodes[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.coronerPostcodes[0].summary).to.be.instanceof(Array);
      expect(validatorResult.coronerPostcodes[0].summary).to.include('The number of citizens you can enter for postcode CH1 must be 20 or fewer');
      expect(validatorResult.coronerPostcodes[0].summary).to.include('The number of citizens you can enter for postcode CH2 must be 20 or fewer');
      expect(validatorResult.coronerPostcodes[0]).to.have.ownPropertyDescriptor('fields');
      expect(validatorResult.coronerPostcodes[0].fields).to.be.instanceof(Array);
      expect(validatorResult.coronerPostcodes[0].fields).to.include('CH1');
      expect(validatorResult.coronerPostcodes[0].fields).to.include('CH2');
      expect(validatorResult.coronerPostcodes[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.coronerPostcodes[0].details).to.be.instanceof(Array);
      expect(validatorResult.coronerPostcodes[0].details).to.include('The number of citizens you can enter for postcode CH1 must be 20 or fewer');
      expect(validatorResult.coronerPostcodes[0].details).to.include('The number of citizens you can enter for postcode CH2 must be 20 or fewer');
    });

    it('should validate the coroner pool postcode selected values - nothing selected', function() {
      var mockRequest = {
          CH1: '30',
          CH2: '30',
          CH3: '',
        }
        , liveDataMock = [
        ]
        , postcodeAndNumbers = [];

      validatorResult = validate(mockRequest, requestPoolVal.coronerPoolPostcodes(liveDataMock, postcodeAndNumbers, 0));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('coronerPostcodes');
      expect(validatorResult.coronerPostcodes).to.be.instanceof(Array);
      expect(validatorResult.coronerPostcodes[0]).to.be.an('object');
      expect(validatorResult.coronerPostcodes[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.coronerPostcodes[0].summary).to.be.instanceof(Array);
      expect(validatorResult.coronerPostcodes[0].summary).to.include('Please enter the amount of citizens you need from each postcode below');
      expect(validatorResult.coronerPostcodes[0]).to.have.ownPropertyDescriptor('fields');
      expect(validatorResult.coronerPostcodes[0].fields).to.be.instanceof(Array);
      expect(validatorResult.coronerPostcodes[0].fields).to.include('postcodesList');
    });

    it('should validate the coroner pool postcode selected values - max jurors reached', function() {
      var mockRequest = {
          CH1: '30',
          CH2: '30',
          CH3: '',
        }
        , liveDataMock = [
        ]
        , postcodeAndNumbers = [
          { postcode: 'CH1', numberToAdd: '200' },
          { postcode: 'CH2', numberToAdd: '31' },
        ];

      validatorResult = validate(mockRequest, requestPoolVal.coronerPoolPostcodes(liveDataMock, postcodeAndNumbers, 20));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('coronerPostcodes');
      expect(validatorResult.coronerPostcodes).to.be.instanceof(Array);
      expect(validatorResult.coronerPostcodes[0]).to.be.an('object');
      expect(validatorResult.coronerPostcodes[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.coronerPostcodes[0].summary).to.be.instanceof(Array);
      expect(validatorResult.coronerPostcodes[0].summary).to.include('You cannot enter more than ' + (250 - 20) + ' citizens in total across all postcodes');
      expect(validatorResult.coronerPostcodes[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.coronerPostcodes[0].details).to.be.instanceof(Array);
      expect(validatorResult.coronerPostcodes[0].details).to.include('You cannot enter more than ' + (250 - 20) + ' citizens in total across all postcodes');
    });

    it('should validate the court location or name and pool type values are present', function() {
      let mockRequest = {
        courtNameOrLocation: 'Test Location (100)',
        poolType: 'CRO',
      };

      validatorResult = validate(mockRequest, requestPoolVal.poolTypeAndCourtNameOrLocation(mockRequest));

      expect(validatorResult).to.be.undefined;
    });

    it('should return an error when courtNameOrLocation is empty', function() {
      let mockRequest = {
        poolType: 'CRO',
      };

      validatorResult = validate(mockRequest, requestPoolVal.poolTypeAndCourtNameOrLocation(mockRequest));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('courtNameOrLocation');
      expect(validatorResult.courtNameOrLocation).to.be.instanceof(Array);
      expect(validatorResult.courtNameOrLocation).to.be.of.length(1);
      expect(validatorResult.courtNameOrLocation[0]).to.be.an('object');
      expect(validatorResult.courtNameOrLocation[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.courtNameOrLocation[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.courtNameOrLocation[0].summary).to.equal('Enter the name or location code for a court');
      expect(validatorResult.courtNameOrLocation[0].details).to.equal('Court name or location is missing');
    });

    it('should return an error when poolType is missing', function() {
      let mockRequest = {
        courtNameOrLocation: 'Test location (100)',
      };

      validatorResult = validate(mockRequest, requestPoolVal.poolTypeAndCourtNameOrLocation(mockRequest));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('poolType');
      expect(validatorResult.poolType).to.be.an.instanceof(Array);
      expect(validatorResult.poolType).to.be.of.length(1);
      expect(validatorResult.poolType[0]).to.be.an('object');
      expect(validatorResult.poolType[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.poolType[0]).to.have.ownPropertyDescriptor('fields');
      expect(validatorResult.poolType[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.poolType[0].summary).to.equal('Pool type is missing');
      expect(validatorResult.poolType[0].fields).to.be.of.length(1);
      expect(validatorResult.poolType[0].fields[0]).to.equal('poolType');
      expect(validatorResult.poolType[0].details).to.be.of.length(1);
      expect(validatorResult.poolType[0].details[0]).to.equal('Select a pool type');
    });

    it('should return an error when poolType and courtNameOrLocation is empty', function() {
      let mockRequest = {};

      validatorResult = validate(mockRequest, requestPoolVal.poolTypeAndCourtNameOrLocation(mockRequest));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('courtNameOrLocation');
      expect(validatorResult.courtNameOrLocation).to.be.instanceof(Array);
      expect(validatorResult.courtNameOrLocation).to.be.of.length(1);
      expect(validatorResult.courtNameOrLocation[0]).to.be.an('object');
      expect(validatorResult.courtNameOrLocation[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.courtNameOrLocation[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.courtNameOrLocation[0].summary).to.equal('Enter the name or location code for a court');
      expect(validatorResult.courtNameOrLocation[0].details).to.equal('Court name or location is missing');
      expect(validatorResult).to.have.ownPropertyDescriptor('poolType');
      expect(validatorResult.poolType).to.be.an.instanceof(Array);
      expect(validatorResult.poolType).to.be.of.length(1);
      expect(validatorResult.poolType[0]).to.be.an('object');
      expect(validatorResult.poolType[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.poolType[0]).to.have.ownPropertyDescriptor('fields');
      expect(validatorResult.poolType[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.poolType[0].summary).to.equal('Pool type is missing');
      expect(validatorResult.poolType[0].fields).to.be.of.length(1);
      expect(validatorResult.poolType[0].fields[0]).to.equal('poolType');
      expect(validatorResult.poolType[0].details).to.be.of.length(1);
      expect(validatorResult.poolType[0].details[0]).to.equal('Select a pool type');

    })
  });
})();
