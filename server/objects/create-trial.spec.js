/* eslint-disable camelcase */
(function() {
  'use strict';

  var {
      trialsListObject,
      trialDetailsObject,
      courtroomsObject,
      judgesObject,
      createTrialObject,
    } = require('../objects/create-trial')
    , urljoin = require('url-join')
    , rpStub = function(options) {
      return options;
    }
    , appStub = {
      logger: {
        debug: function() {
          return;
        },
      },
    };

  describe('Trial Detail API Object:', function() {

    it('Should call the correct endpoint for fetching a trials detail summary', function() {
      var trialNumber = '123456789'
        , locationCode= '415'
        , testObj = trialDetailsObject.get(rpStub, appStub, 'test-token', trialNumber, locationCode)
        , realUri = urljoin(
          'http://localhost:8080/api/v1', 'moj/trial/summary',
          '?trial_number=123456789',
          '&location_code=415'
        );

      expect(testObj.uri).to.equal(realUri);
      expect(testObj.method).to.equal('GET');
    });

  });

  describe('Courtrooms list API Object:', function() {

    it('Should call the correct endpoint for fetching a a list of available courtrooms', function() {
      var testObj = courtroomsObject.get(rpStub, appStub, 'test-token')
        , realUri = urljoin('http://localhost:8080/api/v1', 'moj/trial/courtrooms/list');

      expect(testObj.uri).to.equal(realUri);
      expect(testObj.method).to.equal('GET');
    });

  });

  describe('Judges list API Object:', function() {

    it('Should call the correct endpoint for fetching a a list of available judges', function() {
      var testObj = judgesObject.get(rpStub, appStub, 'test-token')
        , realUri = urljoin('http://localhost:8080/api/v1', 'moj/trial/judge/list');

      expect(testObj.uri).to.equal(realUri);
      expect(testObj.method).to.equal('GET');
    });

  });

  describe('Create a trial API Object:', function() {

    it('Should call the correct endpoint for creating a new trial', function() {
      var testPayload = {
          case_number: 'TESTCASE',
          trial_type: 'CRI',
          defendant: 'Test Defendant',
          start_date: '2023-11-20',
          judge_id: 1,
          court_location: '415',
          courtroom_id: 1,
          protected_trial: false,
        }
        , testObj = createTrialObject.post(rpStub, appStub, 'test-token', testPayload)
        , realUri = urljoin('http://localhost:8080/api/v1', 'moj/trial/create');

      expect(testObj.uri).to.equal(realUri);
      expect(testObj.method).to.equal('POST');

      expect(testObj.body.hasOwnProperty('case_number')).to.equal(true);
      expect(testObj.body.case_number).to.equal('TESTCASE');

      expect(testObj.body.hasOwnProperty('trial_type')).to.equal(true);
      expect(testObj.body.trial_type).to.equal('CRI');

      expect(testObj.body.hasOwnProperty('defendant')).to.equal(true);
      expect(testObj.body.defendant).to.equal('Test Defendant');

      expect(testObj.body.hasOwnProperty('start_date')).to.equal(true);
      expect(testObj.body.start_date).to.equal('2023-11-20');

      expect(testObj.body.hasOwnProperty('judge_id')).to.equal(true);
      expect(testObj.body.judge_id).to.equal(1);

      expect(testObj.body.hasOwnProperty('court_location')).to.equal(true);
      expect(testObj.body.court_location).to.equal('415');

      expect(testObj.body.hasOwnProperty('courtroom_id')).to.equal(true);
      expect(testObj.body.courtroom_id).to.equal(1);

      expect(testObj.body.hasOwnProperty('protected_trial')).to.equal(true);
      expect(testObj.body.protected_trial).to.equal(false);
    });

  });

})();
