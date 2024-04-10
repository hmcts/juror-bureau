;(function() {
  'use strict';

  var jurorUncompleteObject = require('./uncomplete-juror')
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

  describe('Juror uncomplete search API Object:', function() {

    it('Should call the correct endpoint to pull the completed juror list according to search parameters', function() {
      var searchParams = {
          'juror_number': '641500010',
          'juror_name': '',
          'postcode': '',
          'pool_number': '',
          'page_number': 1,
          'page_limit': 25,
        }
        , testObj = jurorUncompleteObject.uncompleteJurorSearchObject.post(
          rpStub, appStub, 'test-token', searchParams)
        , realUri = urljoin('http://localhost:8080/api/v1', 'moj/complete-service');

      expect(testObj.uri).toEqual(realUri);
      expect(testObj.method).toEqual('POST');

      expect(testObj.body.hasOwnProperty('juror_number')).toEqual(true);
      expect(testObj.body.juror_number).toEqual('641500010');

      expect(testObj.body.hasOwnProperty('page_number')).toEqual(true);
      expect(testObj.body.page_number).toEqual(1);

      expect(testObj.body.hasOwnProperty('page_limit')).toEqual(true);
      expect(testObj.body.page_limit).toEqual(25);
    });

  });

  describe('Juror uncomplete API Object:', function() {

    it('Should call the correct endpoint to patch the details for jurors that are marked as uncompleted', function() {
      var searchParams = {
          'juror_number': '641500010',
          'pool_number': '415220901',
        }
        , testObj = jurorUncompleteObject.uncompleteJurorObject.patch(
          rpStub, appStub, 'test-token', searchParams)
        , realUri = urljoin('http://localhost:8080/api/v1', 'moj/complete-service/uncomplete');

      expect(testObj.uri).toEqual(realUri);
      expect(testObj.method).toEqual('PATCH');

      expect(testObj.body.hasOwnProperty('juror_number')).toEqual(true);
      expect(testObj.body.juror_number).toEqual('641500010');

      expect(testObj.body.hasOwnProperty('pool_number')).toEqual(true);
      expect(testObj.body.pool_number).toEqual('415220901');
    });

  });

})();
