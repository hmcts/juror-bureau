const { postDraftExpenseDAO } = require('./expense-record');

(function() {
  'use strict';

  var excusalObject = require('./expense-record').postDraftExpenseDAO
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
          'pay_cash': false,
          'time': { 'pay_attendance': 'FULL_DAY', 'travel_time': '00:40' },
          'travel': {
            'traveled_by_car': true,
            'traveled_by_motorcycle': false,
            'traveled_by_bicycle': false,
            'jurors_taken_by_car': '1',
            'miles_traveled': '15',
            'parking': '2.50',
            'public_transport': '0.00',
            'taxi': '0.00',
          },
          'food_and_drink': { 'food_and_drink_claim_type': 'NONE', 'smart_card_amount': '10.00' },
          'financial_loss': {
            'loss_of_earnings': '10.00',
            'extra_care_cost': '',
            'other_cost': '10.00',
            'other_cost_description': '',
          },
          'date_of_expense': '2023-01-05',
          'pool_number': '415230101',
        }
        , jurorNumber = '641500022'
        , testObj = postDraftExpenseDAO.post(appStub, reqStub, jurorNumber, body, false)
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
          'pay_cash': false,
          'time': { 'pay_attendance': 'FULL_DAY', 'travel_time': '00:40' },
          'travel': {
            'traveled_by_car': true,
            'traveled_by_motorcycle': false,
            'traveled_by_bicycle': false,
            'jurors_taken_by_car': '1',
            'miles_traveled': '15',
            'parking': '2.50',
            'public_transport': '0.00',
            'taxi': '0.00',
          },
          'food_and_drink': { 'food_and_drink_claim_type': 'NONE', 'smart_card_amount': '10.00' },
          'financial_loss': {
            'loss_of_earnings': '10.00',
            'extra_care_cost': '',
            'other_cost': '10.00',
            'other_cost_description': '',
          },
          'date_of_expense': '2023-01-05',
          'pool_number': '415230101',
        }
        , jurorNumber = '641500022'
        , testObj = postDraftExpenseDAO.post(appStub, reqStub, jurorNumber, body, true)
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
