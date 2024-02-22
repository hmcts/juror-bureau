/* eslint-disable */
(function() {
    'use strict';
  
    var validate = require('validate.js')
      , transferValidator = require('./juror-bulk-transfer')
      , validatorResult = null
      , moment = require('moment');
  
    // TODO Not yet implemented
    describe('Juror bulk transfer validators:', function() {
  
      beforeEach(function() {
        validatorResult = null;
      });
  
      it('should validate a valid request', function() {
        var mockRequest = {
          courtNameOrLocation: 'Liverpool (433)',
          attendanceDate: moment().format('DD/MM/yyyy'),
          selectedJurors: ['415230701'], 
          jurorDates: [[ 2023, 5, 30 ]]
        };
  
        validatorResult = validate(mockRequest, transferValidator());

        expect(validatorResult).to.be.undefined;
      });
  
      it('should validate a valid request with mutiple entries', function() {
        var mockRequest = {
          courtNameOrLocation: 'Liverpool (433)',
          attendanceDate: moment().format('DD/MM/yyyy'),
          selectedJurors: ['415230701', '415230702'], 
          jurorDates: [[ 2023, 5, 30 ], [ 2023, 5, 28 ]]
        };
  
        validatorResult = validate(mockRequest, transferValidator());

        expect(validatorResult).to.be.undefined;
      });
  
      it('should try to validate an invalid request - missing all fields', function() {
        var mockRequest = {
          courtNameOrLocation: '',
          attendanceDate: '',
          selectedJurors: ['415230701'], 
          jurorDates: [[ 2023, 5, 30 ]]
        };

        validatorResult = validate(mockRequest, transferValidator());

        expect(validatorResult).to.be.an('object');
        expect(validatorResult.courtNameOrLocation[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.courtNameOrLocation[0].summary).to.equal('Enter a court name or location code to transfer to');

        expect(validatorResult).to.be.an('object');
        expect(validatorResult.jurorTransferDate[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.jurorTransferDate[0].summary).to.equal('Enter a transfer date in the correct format, for example, 31/01/2023');

      });

      it('should try to validate an invalid request - missing new start date DAY', function() {
        var mockRequest = {
          courtNameOrLocation: 'Liverpool (433)',
          attendanceDate: '/12/2023',
          selectedJurors: ['415230701'], 
          jurorDates: [[ 2023, 5, 30 ]]
        };

        validatorResult = validate(mockRequest, transferValidator());
  
        expect(validatorResult).to.be.an('object');
        expect(validatorResult.jurorTransferDate[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.jurorTransferDate[0].summary).to.equal('Enter a transfer date in the correct format, for example, 31/01/2023');

      });

      it('should try to validate an invalid request - missing new start date MONTH', function() {
        var mockRequest = {
          courtNameOrLocation: 'Liverpool (433)',
          attendanceDate: '12//2023',
          selectedJurors: ['415230701'], 
          jurorDates: [[ 2023, 5, 30 ]]
        };

        validatorResult = validate(mockRequest, transferValidator());
  
        expect(validatorResult).to.be.an('object');
        expect(validatorResult.jurorTransferDate[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.jurorTransferDate[0].summary).to.equal('Enter a transfer date in the correct format, for example, 31/01/2023');

      });

      it('should try to validate an invalid request - missing new start date YEAR', function() {
        var mockRequest = {
          courtNameOrLocation: 'Liverpool (433)',
          attendanceDate: '12/12/',
          selectedJurors: ['415230701'], 
          jurorDates: [[ 2023, 5, 30 ]]
        };

        validatorResult = validate(mockRequest, transferValidator());
  
        expect(validatorResult).to.be.an('object');
        expect(validatorResult.jurorTransferDate[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.jurorTransferDate[0].summary).to.equal('Enter a transfer date in the correct format, for example, 31/01/2023');

      });

      it('should try to validate an invalid request - missing new start date DAY and MONTH', function() {
        var mockRequest = {
          courtNameOrLocation: 'Liverpool (433)',
          attendanceDate: '//2023',
          selectedJurors: ['415230701'], 
          jurorDates: [[ 2023, 5, 30 ]]
        };

        validatorResult = validate(mockRequest, transferValidator());
  
        expect(validatorResult).to.be.an('object');
        expect(validatorResult.jurorTransferDate[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.jurorTransferDate[0].summary).to.equal('Enter a transfer date in the correct format, for example, 31/01/2023');

      });

      it('should try to validate an invalid request - missing new start date DAY and YEAR', function() {
        var mockRequest = {
          courtNameOrLocation: 'Liverpool (433)',
          attendanceDate: '/12/',
          selectedJurors: ['415230701'], 
          jurorDates: [[ 2023, 5, 30 ]]
        };

        validatorResult = validate(mockRequest, transferValidator());
  
        expect(validatorResult).to.be.an('object');
        expect(validatorResult.jurorTransferDate[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.jurorTransferDate[0].summary).to.equal('Enter a transfer date in the correct format, for example, 31/01/2023');

      });

      it('should try to validate an invalid request - missing new start date DAY and YEAR', function() {
        var mockRequest = {
          courtNameOrLocation: 'Liverpool (433)',
          attendanceDate: '12//',
          selectedJurors: ['415230701'], 
          jurorDates: [[ 2023, 5, 30 ]]
        };

        validatorResult = validate(mockRequest, transferValidator());
  
        expect(validatorResult).to.be.an('object');
        expect(validatorResult.jurorTransferDate[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.jurorTransferDate[0].summary).to.equal('Enter a transfer date in the correct format, for example, 31/01/2023');

      });

      it('should try to validate an invalid request - invalid DAY input ', function() {
        var mockRequest = {
          courtNameOrLocation: 'Liverpool (433)',
          attendanceDate: '33/12/2023',
          selectedJurors: ['415230701'], 
          jurorDates: [[ 2023, 5, 30 ]]
        };

        validatorResult = validate(mockRequest, transferValidator());
  
        expect(validatorResult).to.be.an('object');
        expect(validatorResult.jurorTransferDate[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.jurorTransferDate[0].summary).to.equal('Enter a date in the correct format, for example, 31/01/2023');

      });

      it('should try to validate an invalid request - invalid MONTH input ', function() {
        var mockRequest = {
          courtNameOrLocation: 'Liverpool (433)',
          attendanceDate: '12/15/2023',
          selectedJurors: ['415230701'], 
          jurorDates: [[ 2023, 5, 30 ]]
        };

        validatorResult = validate(mockRequest, transferValidator());
  
        expect(validatorResult).to.be.an('object');
        expect(validatorResult.jurorTransferDate[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.jurorTransferDate[0].summary).to.equal('Enter a date in the correct format, for example, 31/01/2023');

      });

      it('should try to validate an invalid request - invalid YEAR input ', function() {
        var mockRequest = {
          courtNameOrLocation: 'Liverpool (433)',
          attendanceDate: '12/12/202',
          selectedJurors: ['415230701'], 
          jurorDates: [[ 2023, 5, 30 ]]
        };

        validatorResult = validate(mockRequest, transferValidator());

        expect(validatorResult).to.be.an('object');
        expect(validatorResult.jurorTransferDate[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.jurorTransferDate[0].summary).to.equal('Year must have 4 numbers');

      });

      it('should try to validate an invalid request - impossible date (> 29/02) ', function() {
        var mockRequest = {
          courtNameOrLocation: 'Liverpool (433)',
          attendanceDate: '30/02/2024',
          selectedJurors: ['415230701'], 
          jurorDates: [[ 2023, 5, 30 ]]
        };

        validatorResult = validate(mockRequest, transferValidator());
  
        expect(validatorResult).to.be.an('object');
        expect(validatorResult.jurorTransferDate[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.jurorTransferDate[0].summary).to.equal('Enter a date in the correct format, for example, 31/01/2023');

      });

      it('should try to validate an invalid request - new date is more than 12 months in the future ', function() {
        var mockRequest = {
          courtNameOrLocation: 'Liverpool (433)',
          attendanceDate: moment().set('year', moment().get('year') + 2).format('DD/MM/yyyy'),
          selectedJurors: ['415230701'], 
          jurorDates: [[ 2023, 5, 30 ]]
        };

        validatorResult = validate(mockRequest, transferValidator());
  
        expect(validatorResult).to.be.an('object');
        expect(validatorResult.jurorTransferDate[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.jurorTransferDate[0].summary).to.equal('Service start date must be within the next 12 months');

      });

      it('should try to validate an invalid request - new date is earlier than the original date', function() {
        var mockRequest = {
          courtNameOrLocation: 'Liverpool (433)',
          attendanceDate: '12/12/2022',
          selectedJurors: ['415230701'], 
          jurorDates: [[ 2023, 5, 30 ]]
        };

        validatorResult = validate(mockRequest, transferValidator());

        expect(validatorResult).to.be.an('object');
        expect(validatorResult.jurorTransferDate[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.jurorTransferDate[0].summary).to.equal('You cannot enter a date that’s earlier than the original service start date');

      });
  
      it('should try to validate an invalid request - new date is earlier than the original date for only one bulk juror', function() {
        var mockRequest = {
          courtNameOrLocation: 'Liverpool (433)',
          attendanceDate: '12/12/2022',
          selectedJurors: ['415230701', '415230702'], 
          jurorDates: [[ 2023, 5, 30 ], [ 2022, 10, 19 ]]
        };

        validatorResult = validate(mockRequest, transferValidator());

        expect(validatorResult).to.be.an('object');
        expect(validatorResult.jurorTransferDate).to.have.length(1);
        expect(validatorResult.jurorTransferDate[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.jurorTransferDate[0].summary).to.equal('You cannot enter a date that’s earlier than the original service start date');

      });

      it('should try to validate an invalid request - new date is earlier than the original date for multiple bulk juror', function() {
        var mockRequest = {
          courtNameOrLocation: 'Liverpool (433)',
          attendanceDate: '12/12/2022',
          selectedJurors: ['415230701', '415230702'], 
          jurorDates: [[ 2023, 5, 30 ], [2023, 5, 28 ]]
        };

        validatorResult = validate(mockRequest, transferValidator());

        expect(validatorResult).to.be.an('object');
        expect(validatorResult.jurorTransferDate).to.have.length(2);
        expect(validatorResult.jurorTransferDate[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.jurorTransferDate[0].summary).to.equal('You cannot enter a date that’s earlier than the original service start date');
        expect(validatorResult.jurorTransferDate[1].summary).to.equal('You cannot enter a date that’s earlier than the original service start date');

      });
  
    });
  
  })();
  