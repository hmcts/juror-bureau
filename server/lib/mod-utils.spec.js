(function() {
  'use strict';

  var modUtils = require('./mod-utils')
    , dateFilter = require('../components/filters').dateFilter;

  describe('Modernisation Util Component:', function() {

    it('should transform court names to be used on the autocomplete dropdown list', function() {
      var courtList = [
          { locationCode: 100, locationName: 'Test Court' },
          { locationCode: 101, locationName: 'Test Court' },
          { locationCode: 102, locationName: 'Test Court' },
        ]
        , transformedCourtNames;

      transformedCourtNames = modUtils.transformCourtNames(courtList);

      expect(transformedCourtNames).to.be.of.length(3);
      expect(transformedCourtNames[0]).to.equal('Test Court (100)');
      expect(transformedCourtNames[1]).to.equal('Test Court (101)');
      expect(transformedCourtNames[2]).to.equal('Test Court (102)');
    });

    it('should return a court if the current user court matches any court of the list', function(done) {
      var courtsStub = [
          {
            locationCode: '100',
            locationName: 'The Test Court',
            attendanceTime: '10:00',
          },
        ]
        , bodyStub = {
          courtNameOrLocation: 100,
        }
        , matchedCourt;

      modUtils.matchUserCourt(courtsStub, bodyStub)
        .then(function(response) {
          matchedCourt = response;

          expect(matchedCourt.locationName).to.equal('The Test Court');
          expect(Number(matchedCourt.locationCode)).to.equal(Number(bodyStub.courtNameOrLocation));
          expect(matchedCourt.attendanceTime).to.equal('10:00');

          done();
        })
        .catch(done);
    });

    // eslint-disable-next-line max-len
    it('should return a court if the current user court matches any court of the list even if time has AM or PM', function(done) {
      var courtsStub = [
          {
            locationCode: '100',
            locationName: 'The Test Court',
            attendanceTime: '10:00AM',
          },
        ]
        , bodyStub = {
          courtNameOrLocation: 100,
        }
        , matchedCourt;

      modUtils.matchUserCourt(courtsStub, bodyStub)
        .then(function(response) {
          matchedCourt = response;

          expect(matchedCourt.locationName).to.equal('The Test Court');
          expect(Number(matchedCourt.locationCode)).to.equal(Number(bodyStub.courtNameOrLocation));
          expect(matchedCourt.attendanceTime).to.equal('10:00');

          done();
        })
        .catch(done);
    });

    it('should reject if the user court is not valid or the user does not have one (ie: bureau user)', function(done) {
      var courtsStub = [
          {
            locationCode: '100',
            locationName: 'The Test Court',
            attendanceTime: '10:00',
          },
        ]
        , bodyStub = {
          courtNameOrLocation: 101,
        }
        , matchedCourt;

      modUtils.matchUserCourt(courtsStub, bodyStub)
        .catch(function(response) {
          matchedCourt = response;

          expect(matchedCourt).to.equal(false);

          done();
        });
    });

    it('should return the correct pool status', function() {
      var statusCreated = 'created'
        , statusRequested = 'requested';

      expect(modUtils.poolStatus[statusCreated]).to.equal('CREATED');
      expect(modUtils.poolStatus[statusRequested]).to.equal('REQUESTED');
    });

    it('should return the correct pool type', function() {
      var crownCourt = 'cro'
        , coronersCourt = 'cor'
        , civilCourt = 'civ'
        , highCourt = 'hgh';

      expect(modUtils.poolType[crownCourt]).to.equal('CRO');
      expect(modUtils.poolType[coronersCourt]).to.equal('COR');
      expect(modUtils.poolType[civilCourt]).to.equal('CIV');
      expect(modUtils.poolType[highCourt]).to.equal('HGH');
    });

    it('should transform the pool list before rendering: requested pools', function() {
      var poolList = [
          {
            attendanceDate: '2023-01-01',
            courtName: 'COURT NAME',
            numberRequested: 100,
            poolNumber: '415230101',
            poolType: 'CRO',
          },
        ]
        , transformedPools;

      transformedPools = modUtils.transformPoolList(poolList);

      expect(transformedPools.head).to.be.length(5);
      expect(transformedPools.rows).to.be.length(1);
      expect(transformedPools.rows[0]).to.be.length(5);
      expect(transformedPools.rows[0][0].hasOwnProperty('html')).to.be.true;
      expect(transformedPools.rows[0][0].html).to.equal(
        '<a href="/pool-management/pool-overview/415230101" class="govuk-link">415230101</a>');
      expect(transformedPools.rows[0][1].hasOwnProperty('text')).to.be.true;
      expect(transformedPools.rows[0][1].text).to.equal(100);
      expect(transformedPools.rows[0][2].hasOwnProperty('text')).to.be.true;
      expect(transformedPools.rows[0][2].text).to.equal('Court Name');
      expect(transformedPools.rows[0][3].hasOwnProperty('text')).to.be.true;
      expect(transformedPools.rows[0][3].text).to.equal('Crown court');
      expect(transformedPools.rows[0][4].hasOwnProperty('text')).to.be.true;
      expect(transformedPools.rows[0][4].hasOwnProperty('classes')).to.be.true;
      expect(transformedPools.rows[0][4].text).to.equal('Sun 01 Jan 2023');
    });

    it('should transform the pool list before rendering: active pools and bureau tab', function() {
      var poolList = [
          {
            attendanceDate: '2023-01-01',
            courtName: 'COURT NAME',
            jurorsRequested: 100,
            confirmedJurors: 50,
            poolNumber: '415230101',
            poolType: 'CROWN COURT',
          },
        ]
        , transformedPools;

      transformedPools = modUtils.transformPoolList(poolList, 'created', 'bureau');

      expect(transformedPools.head).to.be.length(6);
      expect(transformedPools.rows).to.be.length(1);
      expect(transformedPools.rows[0]).to.be.length(6);
      expect(transformedPools.rows[0][0].hasOwnProperty('html')).to.be.true;
      expect(transformedPools.rows[0][0].html).to.equal(
        '<a href="/pool-management/pool-overview/415230101" class="govuk-link">415230101</a>');
      expect(transformedPools.rows[0][1].hasOwnProperty('text')).to.be.true;
      expect(transformedPools.rows[0][1].text).to.equal(100);
      expect(transformedPools.rows[0][2].hasOwnProperty('text')).to.be.true;
      expect(transformedPools.rows[0][2].text).to.equal(50);
      expect(transformedPools.rows[0][3].hasOwnProperty('text')).to.be.true;
      expect(transformedPools.rows[0][3].text).to.equal('Court Name');
      expect(transformedPools.rows[0][4].hasOwnProperty('text')).to.be.true;
      expect(transformedPools.rows[0][4].text).to.equal('Crown Court');
      expect(transformedPools.rows[0][5].hasOwnProperty('text')).to.be.true;
      expect(transformedPools.rows[0][5].hasOwnProperty('classes')).to.be.true;
      expect(transformedPools.rows[0][5].text).to.equal('Sun 01 Jan 2023');
    });

    it('should transform the pool list before rendering: active pools and court tab', function() {
      var poolList = [
          {
            attendanceDate: '2023-01-01',
            courtName: 'COURT NAME',
            poolCapacity: 100,
            jurorsInPool: 50,
            poolNumber: '415230101',
            poolType: 'CROWN COURT',
          },
        ]
        , transformedPools;

      transformedPools = modUtils.transformPoolList(poolList, 'created', 'court');

      expect(transformedPools.head).to.be.length(6);
      expect(transformedPools.rows).to.be.length(1);
      expect(transformedPools.rows[0]).to.be.length(6);
      expect(transformedPools.rows[0][0].hasOwnProperty('html')).to.be.true;
      expect(transformedPools.rows[0][0].html).to.equal(
        '<a href="/pool-management/pool-overview/415230101" class="govuk-link">415230101</a>');
      expect(transformedPools.rows[0][1].hasOwnProperty('text')).to.be.true;
      expect(transformedPools.rows[0][1].text).to.equal(100);
      expect(transformedPools.rows[0][2].hasOwnProperty('text')).to.be.true;
      expect(transformedPools.rows[0][2].text).to.equal(50);
      expect(transformedPools.rows[0][3].hasOwnProperty('text')).to.be.true;
      expect(transformedPools.rows[0][3].text).to.equal('Court Name');
      expect(transformedPools.rows[0][4].hasOwnProperty('text')).to.be.true;
      expect(transformedPools.rows[0][4].text).to.equal('Crown Court');
      expect(transformedPools.rows[0][5].hasOwnProperty('text')).to.be.true;
      expect(transformedPools.rows[0][5].hasOwnProperty('classes')).to.be.true;
      expect(transformedPools.rows[0][5].text).to.equal('Sun 01 Jan 2023');
    });

    it('should transform the unpaid attendance list before rendering', function() {
      var unpaidAttendanceList = [
        {
          'juror_number': '123456',
          'pool_number': '12345',
          'first_name': 'First',
          'last_name': 'Last',
          'total_unapproved': '80',
        },
      ];

      const transformedUnpaidAttendance = modUtils.transformUnpaidAttendanceList(unpaidAttendanceList);

      expect(transformedUnpaidAttendance.head).to.be.length(6);
      expect(transformedUnpaidAttendance.rows).to.be.length(1);
      expect(transformedUnpaidAttendance.rows[0][0].hasOwnProperty('html')).to.be.true;
      expect(transformedUnpaidAttendance.rows[0][0].html).to.equal(
        '<a href="/juror-management/record/123456/finance" class="govuk-link">123456</a>');
      expect(transformedUnpaidAttendance.rows[0][1].hasOwnProperty('text')).to.be.true;
      expect(transformedUnpaidAttendance.rows[0][1].text).to.equal('12345');
      expect(transformedUnpaidAttendance.rows[0][2].hasOwnProperty('text')).to.be.true;
      expect(transformedUnpaidAttendance.rows[0][2].text).to.equal('First');
      expect(transformedUnpaidAttendance.rows[0][3].hasOwnProperty('text')).to.be.true;
      expect(transformedUnpaidAttendance.rows[0][3].text).to.equal('Last');
      expect(transformedUnpaidAttendance.rows[0][4].hasOwnProperty('text')).to.be.true;
      expect(transformedUnpaidAttendance.rows[0][4].text).to.equal('£80.00');
      expect(transformedUnpaidAttendance.rows[0][5].hasOwnProperty('html')).to.be.true;
      // eslint-disable-next-line max-len
      expect(transformedUnpaidAttendance.rows[0][5].html).to.equal('<a href="/juror-management/unpaid-attendance/expense-record/123456/12345" class="govuk-link">View expenses</a>');
    });

    it('should pad the time unit if single numeric values are input', function() {
      var testTimePadBoth = {
          attendanceTimeHour: '8',
          attendanceTimeMinute: '5',
        },
        testTimePadNone = {
          attendanceTimeHour: '10',
          attendanceTimeMinute: '15',
        },
        testTimePadHour = {
          attendanceTimeHour: '8',
          attendanceTimeMinute: '15',
        },
        testTimePadMinute = {
          attendanceTimeHour: '10',
          attendanceTimeMinute: '5',
        }
        , finalTimePadBoth
        , finalTimePadNone
        , finalTimePadHour
        , finalTimePadMinute;

      finalTimePadBoth = modUtils.padTime(testTimePadBoth);
      finalTimePadNone = modUtils.padTime(testTimePadNone);
      finalTimePadHour = modUtils.padTime(testTimePadHour);
      finalTimePadMinute = modUtils.padTime(testTimePadMinute);

      expect(finalTimePadBoth).to.deep.equal({ hour: '08', minute: '05' });
      expect(finalTimePadNone).to.deep.equal({ hour: '10', minute: '15' });
      expect(finalTimePadHour).to.deep.equal({ hour: '08', minute: '15' });
      expect(finalTimePadMinute).to.deep.equal({ hour: '10', minute: '05' });
    });

    it('should transform the pool numbers response into key.html and value.text objects', function() {
      var poolNumbersStub = [
          { poolNumber: '415220101', attendanceDate: '2022-01-01' },
          { poolNumber: '415220102', attendanceDate: '2022-01-10' },
          { poolNumber: '415220103', attendanceDate: '2022-01-21' },
        ]
        , transformedPoolNumbers;

      transformedPoolNumbers = modUtils.transformPoolNumbers(poolNumbersStub);

      expect(transformedPoolNumbers).to.be.of.length(3);
      expect(Object.keys(transformedPoolNumbers[0])).to.be.of.length(2);
      expect(transformedPoolNumbers[0].hasOwnProperty('key')).to.equal(true);
      expect(transformedPoolNumbers[0].hasOwnProperty('value')).to.equal(true);
      expect(transformedPoolNumbers[1]['key'].hasOwnProperty('html')).to.equal(true);
      expect(transformedPoolNumbers[1]['value'].hasOwnProperty('text')).to.equal(true);
    });

    it('should return an empty array if there are no pool numbers to transform', function() {
      var poolNumbersStub = []
        , transformedPoolNumbers;

      transformedPoolNumbers = modUtils.transformPoolNumbers(poolNumbersStub);

      expect(transformedPoolNumbers).to.be.of.length(0);
    });

    it('should return the correct day type if the key passed in is valid', function() {
      var holiday = 'HOLIDAY'
        , businessDay = 'BUSINESS_DAY'
        , weekend = 'WEEKEND';

      expect(modUtils.dayTypes[holiday]).to.equal(holiday);

      expect(modUtils.dayTypes[businessDay]).to.equal(businessDay);

      expect(modUtils.dayTypes[weekend]).to.equal(weekend);
    });

    it('should return true if a legacy (juror-digital) module is visited by a court user', function() {
      var pathParts = ['inbox', 'pending', 'completed', 'search', 'new-replies', 'staff', 'response', 'whatever'];

      expect(modUtils.jurorDigitalPath[pathParts[0]]).to.be.true; // /inbox
      expect(modUtils.jurorDigitalPath[pathParts[1]]).to.be.true; // /pending
      expect(modUtils.jurorDigitalPath[pathParts[2]]).to.be.true; // /completed
      expect(modUtils.jurorDigitalPath[pathParts[3]]).to.be.true; // /search
      expect(modUtils.jurorDigitalPath[pathParts[4]]).to.be.true; // /new-replies
      expect(modUtils.jurorDigitalPath[pathParts[5]]).to.be.true; // /staff
      // expect(modUtils.jurorDigitalPath[pathParts[6]]).to.be.true; // /response
      expect(modUtils.jurorDigitalPath[pathParts[7]]).to.be.undefined;  // /everything-else
    });

    it('should transform postcodes to expected format, sorted and with total court yield', function() {
      var dataStub = [
          { postCodePart: 'PC1', total: 10 },
          { postCodePart: 'PC3', total: 12 },
          { postCodePart: 'PC2', total: 6 },
        ]
        , transformedPostcodes = modUtils.transformPostcodes(dataStub);

      expect(transformedPostcodes).to.be.length(2);
      expect(transformedPostcodes[0]).to.be.length(3);
      expect(transformedPostcodes[1]).to.be.a('number');
      expect(transformedPostcodes[1]).to.equal(28);

      expect(transformedPostcodes[0][0].id).to.equal('PC1');
      expect(transformedPostcodes[0][0].value).to.equal('PC1');
      expect(transformedPostcodes[0][0].text).to.equal('PC1 (10)');
      expect(transformedPostcodes[0][0].checked).to.be.true;

      expect(transformedPostcodes[0][1].id).to.equal('PC2');
      expect(transformedPostcodes[0][1].value).to.equal('PC2');
      expect(transformedPostcodes[0][1].text).to.equal('PC2 (6)');
      expect(transformedPostcodes[0][1].checked).to.be.true;

      expect(transformedPostcodes[0][2].id).to.equal('PC3');
      expect(transformedPostcodes[0][2].value).to.equal('PC3');
      expect(transformedPostcodes[0][2].text).to.equal('PC3 (12)');
      expect(transformedPostcodes[0][2].checked).to.be.true;
    });

    it('should convert postcodes to array and transform as expected if single postcode object is passed', function() {
      var dataStub = {
          postCodePart:
          'PC1',
          total: 10,
        }
        , transformedPostcode = modUtils.transformPostcodes(dataStub);

      expect(transformedPostcode).to.be.length(2);
      expect(transformedPostcode[0]).to.be.length(1);
      expect(transformedPostcode[1]).to.be.a('number');
      expect(transformedPostcode[1]).to.equal(10);

      expect(transformedPostcode[0][0].id).to.equal('PC1');
      expect(transformedPostcode[0][0].value).to.equal('PC1');
      expect(transformedPostcode[0][0].text).to.equal('PC1 (10)');
      expect(transformedPostcode[0][0].checked).to.be.true;
    });

    it('should generate a date 9 weeks in the future', function() {
      var testDate = '2022-11-15'
        , generatedDate;

      generatedDate = modUtils.buildSuggestedDate('2022-09-13');

      expect(dateFilter(generatedDate, null, 'YYYY-MM-DD')).to.equal(testDate);
    });

    /* eslint-disable max-len */
    it('should build the correct pagination items - no query params and page 1', function() {
      var totalResults = 100
        , currentPage = 1
        , url = '/some-url'
        , paginationItems;

      paginationItems = modUtils.paginationBuilder(totalResults, currentPage, url);

      expect(paginationItems.prev).to.be.undefined;
      expect(paginationItems.next).to.equal('/some-url?page=2');
      expect(paginationItems.items).to.be.length(4);

      expect(paginationItems.items[0]).to.be.an('object');
      expect(paginationItems.items[0].hasOwnProperty('number')).to.be.true;
      expect(paginationItems.items[0].number).to.equal(1);
      expect(paginationItems.items[1].number).to.equal(2);
      expect(paginationItems.items[3].number).to.equal(4);

      expect(paginationItems.items[0].hasOwnProperty('href')).to.be.true;
      expect(paginationItems.items[0].href).to.equal('/some-url?page=1');
      expect(paginationItems.items[1].href).to.equal('/some-url?page=2');
      expect(paginationItems.items[3].href).to.equal('/some-url?page=4');

      expect(paginationItems.items[0].hasOwnProperty('current')).to.be.true;
      expect(paginationItems.items[0].current).to.be.true;
      expect(paginationItems.items[1].current).to.be.false;
      expect(paginationItems.items[3].current).to.be.false;

      // test for an ellipsis
      expect(paginationItems.items[2].hasOwnProperty('ellipsis')).to.be.true;
      expect(paginationItems.items[2].ellipsis).to.be.true;
    });

    it('should build the correct pagination items - query params and page 4', function() {
      var totalResults = 100
        , currentPage = 4
        , url = '/some-url?search=this&page=4'
        , paginationItems;

      paginationItems = modUtils.paginationBuilder(totalResults, currentPage, url);

      expect(paginationItems.prev).to.equal('/some-url?search=this&page=3');
      expect(paginationItems.next).to.be.undefined;
      expect(paginationItems.items).to.be.length(4);

      // ellipsis should be on index 1
      expect(paginationItems.items[1].hasOwnProperty('ellipsis')).to.be.true;
      expect(paginationItems.items[1].ellipsis).to.be.true;
    });

    it('should build the correct pagination items - query params and page 2', function() {
      var totalResults = 100
        , currentPage = 2
        , url = '/some-url?search=this&page=2'
        , paginationItems;

      paginationItems = modUtils.paginationBuilder(totalResults, currentPage, url);

      expect(paginationItems.prev).to.equal('/some-url?search=this&page=1');
      expect(paginationItems.next).to.equal('/some-url?search=this&page=3');
      expect(paginationItems.items).to.be.length(4);

      // this one does not generate ellipsis so all items elements have a number
      expect(paginationItems.items[0].hasOwnProperty('number')).to.be.true;
      expect(paginationItems.items[1].hasOwnProperty('number')).to.be.true;
      expect(paginationItems.items[2].hasOwnProperty('number')).to.be.true;
      expect(paginationItems.items[3].hasOwnProperty('number')).to.be.true;

      expect(paginationItems.items[0].number).to.equal(1);
      expect(paginationItems.items[1].number).to.equal(2);
      expect(paginationItems.items[2].number).to.equal(3);
      expect(paginationItems.items[3].number).to.equal(4);
    });

    it('should return a correct hash for a given string', function() {
      var string = 'some-string'
        , hashedString = 'a3635c09bda7293ae1f144a240f155cf151451f2420d11ac385d13cce4eb5fa2';

      expect(hashedString).to.equal(modUtils.hash(string));
    });

    it('should resolve the date format based on input: DD/MM/YYYY (double digit day & month)', function() {
      var mockDate = '31/12/2023'
        , expectedFormat = 'DD/MM/YYYY';

      expect(modUtils.resolveDateFormat(mockDate)).to.equal(expectedFormat);
    });

    it('should resolve the date format based on input: DD/MM/YYYY (single digit day & month)', function() {
      var mockDate = '2/2/2023'
        , expectedFormat = 'DD/MM/YYYY';

      expect(modUtils.resolveDateFormat(mockDate)).to.equal(expectedFormat);
    });

    it('should resolve the date format based on input: YYYY/MM/DD (double digit day & month)', function() {
      var mockDate = '2023/12/31'
        , expectedFormat = 'YYYY/MM/DD';

      expect(modUtils.resolveDateFormat(mockDate)).to.equal(expectedFormat);
    });

    it('should resolve the date format based on input: YYYY/MM/DD (single digit day & month)', function() {
      var mockDate = '2023/2/2'
        , expectedFormat = 'YYYY/MM/DD';

      expect(modUtils.resolveDateFormat(mockDate)).to.equal(expectedFormat);
    });

    it('should resolve the date format based on input: YYYY-MM-DD (double digit day & month)', function() {
      var mockDate = '2023-12-31'
        , expectedFormat = 'YYYY-MM-DD';

      expect(modUtils.resolveDateFormat(mockDate)).to.equal(expectedFormat);
    });

    it('should resolve the date format based on input: YYYY-MM-DD (single digit day & month)', function() {
      var mockDate = '2023-2-2'
        , expectedFormat = 'YYYY-MM-DD';

      expect(modUtils.resolveDateFormat(mockDate)).to.equal(expectedFormat);
    });

    it('should build the correct optic reference redirect url: paper', function() {
      var jurorNumber = '123456789'
        , replyType = 'paper'
        , namedRoutes = {
          pathsMapping: {
            'response.paper.details.get': 'some/paper/path',
            'response.detail.get': 'some/digital/path',
          }
          , build: (name, params) => {
            return [namedRoutes.pathsMapping[name], ...Object.values(params)].join('/');
          },
        }
        , output;

      output = modUtils.opticReferenceRedirectUrl(jurorNumber, namedRoutes, replyType);

      expect(output).to.be.equal('some/paper/path/123456789/paper');
    });

    it('should build the correct optic reference redirect url: digital', function() {
      var jurorNumber = '123456789'
        , replyType = 'digital'
        , namedRoutes = {
          pathsMapping: {
            'response.paper.details.get': 'some/paper/path',
            'response.detail.get': 'some/digital/path',
          }
          , build: (name, params) => {
            return [namedRoutes.pathsMapping[name], ...Object.values(params)].join('/');
          },
        }
        , output;

      output = modUtils.opticReferenceRedirectUrl(jurorNumber, namedRoutes, replyType);

      expect(output).to.be.equal('some/digital/path/123456789/digital');
    });

    it('should resolve the correct reply status', function() {
      var responseStatus = 'Closed'
        , output;

      output = modUtils.resolveReplyStatus(responseStatus);
      expect(output).to.be.equal('Completed');

      output = modUtils.resolveReplyStatus('To Do');
      expect(output).to.be.equal('To Do');

      output = modUtils.resolveReplyStatus('Ineligible');
      expect(output).to.be.equal('Ineligible');
    });

    it('should resolve and build the correct processing outcome', function() {
      var resolvedHtml = '<span class="mod-flex mod-items-center mod-gap-x-2">Excusal refused (child care) <div class="icon mod-icon-urgent"></div></span>'
        , output;

      output = modUtils.resolveProcessingOutcome('Responded', 'Y', 'CHILD CARE');
      expect(output).to.be.equal(resolvedHtml);

      output = modUtils.resolveProcessingOutcome('Excused', 'N', 'CHILD CARE');
      expect(output).to.be.equal('Excusal granted (child care)');

      output = modUtils.resolveProcessingOutcome('Responded', null, null);
      expect(output).to.be.equal('Responded');

      output = modUtils.resolveProcessingOutcome('Summoned', null, null);
      expect(output).to.be.equal('-');
    });

    it('should resolve the correct message for the processed banner', function() {
      var jurorStatus = {
          summoned: 'Summoned',
          responded: 'Responded',
          excused: 'Excused',
          deferred: 'Deferred',
        }
        , output;

      output = modUtils.resolveProcessedBannerMessage(jurorStatus.responded, {
        isExcusal: false,
      });
      expect(output).to.equal('Responded');

      output = modUtils.resolveProcessedBannerMessage(jurorStatus.responded, {
        isExcusal: true,
      });
      expect(output).to.equal('Excusal refused');

      output = modUtils.resolveProcessedBannerMessage(jurorStatus.excused, {
        isExcusal: false,
      });
      expect(output).to.equal('Excusal granted');

      output = modUtils.resolveProcessedBannerMessage(jurorStatus.excused, {
        isExcusal: true,
      });
      expect(output).to.equal('Excusal granted');

      output = modUtils.resolveProcessedBannerMessage(jurorStatus.responded, {
        isDeferral: true,
      });
      expect(output).to.equal('Deferral refused');

      output = modUtils.resolveProcessedBannerMessage(jurorStatus.deferred, {
        isDeferral: true,
      });
      expect(output).to.equal('Deferral granted');

      output = modUtils.resolveProcessedBannerMessage(jurorStatus.deferred, {
        isDeferral: false,
      });
      expect(output).to.equal('Deferral granted');

      output = modUtils.resolveProcessedBannerMessage(jurorStatus.excused, {
        isDeceased: true,
      });
      expect(output).to.equal('Deceased');

      // this should never happen if a response is not closed
      output = modUtils.resolveProcessedBannerMessage(jurorStatus.summoned);
      expect(output).to.equal('Summoned');
    });

    it('should transform the court name and location code before rendering', () => {
      let output
        , court = {
          locationName: 'test location',
          locationCode: '100',
        };

      output = modUtils.transformCourtName(court);
      expect(output).to.equal('Test Location (100)');
    });

    it('should trim the court name and return only the 3 digit location code', () => {
      let output
        , courtNameOrLocation = 'Test Location (100)'
        , invalidCourtNameOrLocation = 'Test Location';

      output = modUtils.getLocCodeFromCourtNameOrLocation(courtNameOrLocation);
      expect(output).to.equal('100');

      output = modUtils.getLocCodeFromCourtNameOrLocation(invalidCourtNameOrLocation);
      expect(output).to.equal(null);

      output = modUtils.getLocCodeFromCourtNameOrLocation();
      expect(output).to.equal(null);
    });

    it('should verify if a summons is late given its start date', () => {
      const olderDate = new Date();
      let isBefore;

      isBefore = modUtils.isLateSummons('01-01-2023');
      expect(isBefore).to.be.true;

      olderDate.setDate(olderDate.getDate() + 10);
      isBefore = modUtils.isLateSummons(olderDate);
      expect(isBefore).to.be.false;
    });

    it('should return the correct letter identifier - initial summons', () => {
      const identifier = modUtils.getLetterIdentifier('initial-summons');

      expect(identifier).to.equal('Initial summons');
    });

    it('should return the correct letter identifier - summons reminders', () => {
      const identifier = modUtils.getLetterIdentifier('summons-reminders');

      expect(identifier).to.equal('Summons reminders');
    });

    it('should return the correct letter identifier - further information', () => {
      const identifier = modUtils.getLetterIdentifier('further-information');

      expect(identifier).to.equal('Requests for further information');
    });

    it('should return the correct letter identifier - confirmation', () => {
      const identifier = modUtils.getLetterIdentifier('confirmation');

      expect(identifier).to.equal('Confirmation letters');
    });

    it('should return the correct letter identifier - deferral granted', () => {
      const identifier = modUtils.getLetterIdentifier('deferral-granted');

      expect(identifier).to.equal('Deferral granted letters');
    });

    it('should return the correct letter identifier - deferral refused', () => {
      const identifier = modUtils.getLetterIdentifier('deferral-refused');

      expect(identifier).to.equal('Deferral refused letters');
    });

    it('should return the correct letter identifier - deferral refused', () => {
      const identifier = modUtils.getLetterIdentifier('deferral-refused');

      expect(identifier).to.equal('Deferral refused letters');
    });

    it('should return the correct letter identifier - excusal granted', () => {
      const identifier = modUtils.getLetterIdentifier('excusal-granted');

      expect(identifier).to.equal('Excusal granted letters');
    });

    it('should return the correct letter identifier - excusal refused', () => {
      const identifier = modUtils.getLetterIdentifier('excusal-refused');

      expect(identifier).to.equal('Excusal refused letters');
    });

    it('should return the correct letter identifier - postponement', () => {
      const identifier = modUtils.getLetterIdentifier('postponement');

      expect(identifier).to.equal('Postponement letters');
    });

    it('should return the correct letter identifier - withdrawal', () => {
      const identifier = modUtils.getLetterIdentifier('withdrawal');

      expect(identifier).to.equal('Withdrawal letters');
    });

  });

})();
