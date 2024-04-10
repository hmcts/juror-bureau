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

  describe('Trials List API Object:', function() {

    it('Should call the correct endpoint for fetching all trials', function() {
      var opts = {
          pageNumber: 1,
          sortBy: 'trialStartDate',
          sortOrder: 'asc',
          isActive: false,
        }
        , testObj = trialsListObject.get(rpStub, appStub, 'test-token', opts)
        , realUri = urljoin(
          'http://localhost:8080/api/v1', 'moj/trial/list',
          '?page_number=0',
          '&sort_by=trialStartDate',
          '&sort_order=asc',
          '&is_active=false'
        );

      expect(testObj.uri).toEqual(realUri);
      expect(testObj.method).toEqual('GET');
    });

  });

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

      expect(testObj.uri).toEqual(realUri);
      expect(testObj.method).toEqual('GET');
    });

  });

  describe('Courtrooms list API Object:', function() {

    it('Should call the correct endpoint for fetching a a list of available courtrooms', function() {
      var testObj = courtroomsObject.get(rpStub, appStub, 'test-token')
        , realUri = urljoin('http://localhost:8080/api/v1', 'moj/trial/courtrooms/list');

      expect(testObj.uri).toEqual(realUri);
      expect(testObj.method).toEqual('GET');
    });

  });

  describe('Judges list API Object:', function() {

    it('Should call the correct endpoint for fetching a a list of available judges', function() {
      var testObj = judgesObject.get(rpStub, appStub, 'test-token')
        , realUri = urljoin('http://localhost:8080/api/v1', 'moj/trial/judge/list');

      expect(testObj.uri).toEqual(realUri);
      expect(testObj.method).toEqual('GET');
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

      expect(testObj.uri).toEqual(realUri);
      expect(testObj.method).toEqual('POST');

      expect(testObj.body.hasOwnProperty('case_number')).toEqual(true);
      expect(testObj.body.case_number).toEqual('TESTCASE');

      expect(testObj.body.hasOwnProperty('trial_type')).toEqual(true);
      expect(testObj.body.trial_type).toEqual('CRI');

      expect(testObj.body.hasOwnProperty('defendant')).toEqual(true);
      expect(testObj.body.defendant).toEqual('Test Defendant');

      expect(testObj.body.hasOwnProperty('start_date')).toEqual(true);
      expect(testObj.body.start_date).toEqual('2023-11-20');

      expect(testObj.body.hasOwnProperty('judge_id')).toEqual(true);
      expect(testObj.body.judge_id).toEqual(1);

      expect(testObj.body.hasOwnProperty('court_location')).toEqual(true);
      expect(testObj.body.court_location).toEqual('415');

      expect(testObj.body.hasOwnProperty('courtroom_id')).toEqual(true);
      expect(testObj.body.courtroom_id).toEqual(1);

      expect(testObj.body.hasOwnProperty('protected_trial')).toEqual(true);
      expect(testObj.body.protected_trial).toEqual(false);
    });

  });

})();
