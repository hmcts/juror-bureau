(function() {
  'use strict';

  var { postEditedExpensesDAO } = require('./expense-record')
    , urljoin = require('url-join')
    , rpStub = function(options) {
      return options;
    }
    , reqStub = {
      session: {
        authorization: 'test-token',
      },
    }
    , appStub = {
      logger: {
        info: function() {
          return;
        },
      },
    };

  describe('Update draft expenses:', function() {

    it('should send call the correct endpoint to submit an attendance day draft expense', function() {
      var body = {
          'paymentMethod': 'BACS',
          'time': { 'payAttendance': 'FULL_DAY', 'travelTime': '00:40' },
          'travel': {
            'traveledByCar': true,
            'traveledByMotorcycle': false,
            'traveledByBicycle': false,
            'jurorsTakenByCar': '1',
            'milesTraveled': '15',
            'parking': '2.50',
            'publicTransport': '0.00',
            'taxi': '0.00',
          },
          'foodAndDrink': { 'foodAndDrinkClaimType': 'NONE', 'smartCardAmount': '10.00' },
          'financialLoss': {
            'lossOfEarnings': '10.00',
            'extraCareCost': '',
            'otherCost': '10.00',
            'otherCostDescription': '',
          },
          'dateOfExpense': '2023-01-05',
          'poolNumber': '415230101',
        }
        , jurorNumber = '641500022'
        , testObj = postEditedExpensesDAO.put(appStub, reqStub, jurorNumber, body, false)
        , realUri = urljoin(
          'http://localhost:8080/api/v1',
          'moj/expenses',
          jurorNumber,
          'draft/attended_day'
        );

      expect(testObj.uri.href).to.equal(realUri);
      expect(testObj.method).to.equal('POST');
    });

    it('should send call the correct endpoint to submit a non-attendance day draft expense', function() {
      var body = {
          'paymentMethod': 'BACS',
          'time': { 'payAttendance': 'FULL_DAY', 'travelTime': '00:40' },
          'travel': {
            'traveledByCar': true,
            'traveledByMotorcycle': false,
            'traveledByBicycle': false,
            'jurorsTakenByCar': '1',
            'milesTraveled': '15',
            'parking': '2.50',
            'publicTransport': '0.00',
            'taxi': '0.00',
          },
          'foodAndDrink': { 'foodAndDrinkClaimType': 'NONE', 'smartCardAmount': '10.00' },
          'financialLoss': {
            'lossOfEarnings': '10.00',
            'extraCareCost': '',
            'otherCost': '10.00',
            'otherCostDescription': '',
          },
          'dateOfExpense': '2023-01-05',
          'poolNumber': '415230101',
        }
        , jurorNumber = '641500022'
        , testObj = postEditedExpensesDAO.post(appStub, reqStub, jurorNumber, body, true)
        , realUri = urljoin(
          'http://localhost:8080/api/v1',
          'moj/expenses',
          jurorNumber,
          'draft/non_attended_day'
        );

      expect(testObj.uri.href).to.equal(realUri);
      expect(testObj.method).to.equal('POST');
    });
  });

})();
