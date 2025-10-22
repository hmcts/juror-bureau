;(function() {
  'use strict';

  var disqualifyObject = require('./disqualify-mod')
    , urljoin = require('url-join').default
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

  describe('Get Disqualification Reasons API Object:', function() {

    it('Should call the correct endpoint to retrieve a valid list of disqualification reasons',
      function() {
        let testUri = disqualifyObject.getDisqualificationReasons.get(rpStub, appStub, 'test-token')
          , realUri = urljoin(
            'http://localhost:8080/api/v1',
            'moj/disqualify/reasons'
          );

        expect(testUri.uri).to.equal(realUri);
        expect(testUri.method).to.equal('GET');
      });

  });

  describe('Disqualify Juror API Object:', function() {

    it('Should call the correct endpoint to process the disqualification for a juror',
      function() {
        let jurorNumber = '123456789'
          , disqualifyCode = 'A'
          , replyMethod = 'paper'
          , testObj = disqualifyObject.disqualifyJuror.patch(rpStub, appStub, 'test-token',
            jurorNumber, disqualifyCode, replyMethod)
          , realUri = urljoin(
            'http://localhost:8080/api/v1',
            'moj/disqualify/juror/' + jurorNumber
          );

        expect(testObj.uri).to.equal(realUri);
        expect(testObj.method).to.equal('PATCH');

        expect(testObj.body.hasOwnProperty('code')).to.equal(true);
        expect(testObj.body.code).to.equal('A');

        expect(testObj.body.hasOwnProperty('replyMethod')).to.equal(true);
        expect(testObj.body.replyMethod).to.equal('PAPER');
      });

  });

})();
