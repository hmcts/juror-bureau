(function() {
  'use strict';

  var jurorRecordObject = require('./juror-record')
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

  describe('Juror record API Object:', function() {

    it('should call the correct endpoint to fectch juror details', function() {
      var jurorNumber = '123456789'
        , tab = 'detail'
        , locCode = '415'
        , testObj = jurorRecordObject.record.get(rpStub, appStub, 'test-token', tab, jurorNumber, locCode)
        , realUri = urljoin('http://localhost:8080/api/v1',
          'moj/juror-record', tab, jurorNumber, locCode)
        , uriParams;

      uriParams = testObj.uri.split('/');

      expect(testObj.uri).to.equal(realUri);
      expect(testObj.method).to.equal('GET');

      expect(uriParams[uriParams.length - 2]).to.equal(jurorNumber);
      expect(uriParams[uriParams.length - 1]).to.equal(locCode);
    });

    it('should call the correct endpoint to change juror details',
      () => {
        let jurorNumber = '123456789',
          bodyStub = {
            someDetails: 'someDetails',
          },
          testObj = jurorRecordObject.editDetails.patch(rpStub, appStub, 'test-token', bodyStub, jurorNumber,
            '"etag-hash"'),
          realUri = urljoin('http://localhost:8080/api/v1', 'moj/juror-record/edit-juror', jurorNumber);

        expect(testObj.uri).to.equal(realUri);
        expect(testObj.method).to.equal('PATCH');

        expect(testObj.hasOwnProperty('headers')).to.be.true;
        expect(testObj.headers.hasOwnProperty('If-None-Match')).to.be.true;

        expect(testObj.body.hasOwnProperty('some_details')).to.equal(true);
        expect(testObj.body.some_details).to.equal(bodyStub.someDetails);
      }
    );

    it('should call the correct endpoint to search for a juror-record', function() {
      var jurorNumber = '123456789'
        , testObj = jurorRecordObject.search.get(rpStub, appStub, 'test-token', jurorNumber)
        , realUri = urljoin('http://localhost:8080/api/v1',
          'moj/juror-record/single-search',
          '?jurorNumber=' + jurorNumber)
        , searchParams;

      searchParams = new URL(realUri).searchParams;

      expect(testObj.uri).to.equal(realUri);
      expect(testObj.method).to.equal('GET');

      expect(searchParams.has('jurorNumber')).to.be.true;
      expect(searchParams.get('jurorNumber')).to.equal('123456789');
    });

    it('should call the correct endpoint to patch the juror notes', function() {
      var jurorNumber = '123456789'
        , bodyStub = {
          notes: 'some note here',
        }
        , testObj = jurorRecordObject.notes.patch(rpStub, appStub, 'test-token', bodyStub, jurorNumber)
        , realUri = urljoin('http://localhost:8080/api/v1',
          'moj/juror-record/notes', jurorNumber)
        , uriParams;

      uriParams = testObj.uri.split('/');

      expect(testObj.uri).to.equal(realUri);
      expect(testObj.method).to.equal('PATCH');

      expect(uriParams[uriParams.length - 1]).to.equal(jurorNumber);

      expect(testObj.body.hasOwnProperty('notes')).to.be.true;
      expect(testObj.body.notes).to.equal('some note here');
    });

    it('should call the correct endpoint to patch the updated juror attendance date', function() {
      var bodyStub = {
          'next_date': '2023-12-21',
          'on_call': false,
          jurorNumber: '111111111',
        }

        , testObj = jurorRecordObject.changeDate.patch(rpStub, appStub, 'test-token', bodyStub);


      expect(testObj.body.hasOwnProperty('on_call')).to.be.true;
      expect(testObj.body.hasOwnProperty('next_date')).to.be.true;
      expect(testObj.body.hasOwnProperty('jurorNumber')).to.be.true;
      expect(testObj.body.jurorNumber).to.equal('111111111');
      expect(testObj.body.next_date).to.equal('2023-12-21');
      expect(testObj.body.on_call).to.be.false;
    });

    it('should call the correct endpoint to patch juror on call', function() {
      var bodyStub = {
          'next_date': '',
          'on_call': true,
          jurorNumber: '111111111',
        }

        , testObj = jurorRecordObject.changeDate.patch(rpStub, appStub, 'test-token', bodyStub);


      expect(testObj.body.hasOwnProperty('on_call')).to.be.true;
      expect(testObj.body.hasOwnProperty('next_date')).to.be.true;
      expect(testObj.body.hasOwnProperty('jurorNumber')).to.be.true;
      expect(testObj.body.on_call).to.be.true;
      expect(testObj.body.next_date).to.equal('');
      expect(testObj.body.jurorNumber).to.equal('111111111');
    });

    it('should call the correct endpoint to post a new contact log', function() {
      var bodyStub = {
          enquiryType: 'GE',
          jurorNumber: '123456789',
          notes: 'some enquiry log here',
          repeatEnquiry: false,
          startCall: '1970-01-01 00:00',
        }
        , testObj = jurorRecordObject.contactLog.post(rpStub, appStub, 'test-token', bodyStub)
        , realUri = urljoin('http://localhost:8080/api/v1', 'moj/juror-record/create/contact-log');

      expect(testObj.uri).to.equal(realUri);
      expect(testObj.method).to.equal('POST');

      expect(testObj.body.hasOwnProperty('enquiryType')).to.be.true;
      expect(testObj.body.enquiryType).to.equal('GE');

      expect(testObj.body.hasOwnProperty('jurorNumber')).to.be.true;
      expect(testObj.body.jurorNumber).to.equal('123456789');

      expect(testObj.body.hasOwnProperty('notes')).to.be.true;
      expect(testObj.body.notes).to.equal('some enquiry log here');

      expect(testObj.body.hasOwnProperty('repeatEnquiry')).to.be.true;
      expect(testObj.body.repeatEnquiry).to.be.false;

      expect(testObj.body.hasOwnProperty('startCall')).to.be.true;
      expect(testObj.body.startCall).to.equal('1970-01-01 00:00');
    });

    it('should use the includeHeaders transformer', function() {
      var bodyStub = {
          key: 'value',
        }
        , responseStub = {
          headers: {
            'header-key': 'header-value',
          },
        }
        , testObj = jurorRecordObject.record.get(rpStub, appStub, 'test-token', 'test-tab', '123456789', '415')
        , realUri = urljoin('http://localhost:8080/api/v1', 'moj/juror-record', 'test-tab', '123456789', '415');

      expect(testObj.uri).to.equal(realUri);
      expect(typeof testObj.transform(bodyStub, responseStub) === 'object').to.be.true;
      expect(testObj.transform(bodyStub, responseStub).hasOwnProperty('headers')).to.be.true;
      expect(testObj.transform(bodyStub, responseStub).hasOwnProperty('data')).to.be.true;

      expect(testObj.transform(bodyStub, responseStub).data.hasOwnProperty('key')).to.be.true;
      expect(testObj.transform(bodyStub, responseStub).headers.hasOwnProperty('header-key')).to.be.true;

      expect(testObj.transform(bodyStub, responseStub).data.key).to.equal('value');
      expect(testObj.transform(bodyStub, responseStub).headers['header-key']).to.equal('header-value');
    });

    it('should not set "If-None-Match" if etag is not passed in', function() {
      var testObj = jurorRecordObject.record.get(rpStub, appStub, 'test-token', 'test-tab', '123456789', '415')
        , realUri = urljoin('http://localhost:8080/api/v1', 'moj/juror-record', 'test-tab', '123456789', '415');

      expect(testObj.uri).to.equal(realUri);
      expect(testObj.hasOwnProperty('headers')).to.be.true;
      expect(testObj.headers.hasOwnProperty('If-None-Match')).to.be.false;
    });

    it('should set the "If-None-Match" header if an etag is passed in', function() {
      // eslint-disable-next-line max-len
      var testObj = jurorRecordObject.record.get(rpStub, appStub, 'test-token', 'test-tab', '123456789', '415', '"etag-hash"')
        , realUri = urljoin('http://localhost:8080/api/v1', 'moj/juror-record', 'test-tab', '123456789', '415');

      expect(testObj.uri).to.equal(realUri);
      expect(testObj.hasOwnProperty('headers')).to.be.true;
      expect(testObj.headers.hasOwnProperty('If-None-Match')).to.be.true;
    });

    it('should call the correct endpoint to post an optic reference', function() {
      var jurorNumber = '123456789'
        , poolNumber = '987654321'
        , bodyStub = {
          _csrf: 'some-token',
          opticReference: 'some-ref',
        }
        // eslint-disable-next-line max-len
        , testObj = jurorRecordObject.opticReferenceObject.post(rpStub, appStub, 'test-token', bodyStub, jurorNumber, poolNumber)
        // eslint-disable-next-line max-len
        , realUri = urljoin('http://localhost:8080/api/v1', 'moj/juror-record/create/optic-reference');

      expect(testObj.uri).to.be.equal(realUri);
      expect(testObj.method).to.be.equal('POST');
      expect(testObj.hasOwnProperty('body')).to.be.true;
      expect(testObj.body.jurorNumber).to.be.equal(jurorNumber);
      expect(testObj.body.poolNumber).to.be.equal(poolNumber);
      expect(testObj.body.opticReference).to.be.equal(bodyStub.opticReference);
    });

    it('should call the correct endpoint to fetch an optic reference', function() {
      var jurorNumber = '123456789'
        , poolNumber = '987654321'
        // eslint-disable-next-line max-len
        , testObj = jurorRecordObject.opticReferenceObject.get(rpStub, appStub, 'test-token', jurorNumber, poolNumber, true)
        // eslint-disable-next-line max-len
        , realUri = urljoin('http://localhost:8080/api/v1', 'moj/juror-record/optic-reference', jurorNumber, poolNumber);

      expect(testObj.uri).to.be.equal(realUri);
      expect(testObj.method).to.be.equal('GET');
    });

  });

})();
