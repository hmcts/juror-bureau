const { capitalise, toSentenceCase } = require('../components/filters');

(function() {
  'use strict';

  var _ = require('lodash')
    , modUtils = require('./mod-utils')
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

      expect(transformedCourtNames).toHaveLength(3);
      expect(transformedCourtNames[0]).toEqual('Test Court (100)');
      expect(transformedCourtNames[1]).toEqual('Test Court (101)');
      expect(transformedCourtNames[2]).toEqual('Test Court (102)');
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

          expect(matchedCourt.locationName).toEqual('The Test Court');
          expect(Number(matchedCourt.locationCode)).toEqual(Number(bodyStub.courtNameOrLocation));
          expect(matchedCourt.attendanceTime).toEqual('10:00');

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

          expect(matchedCourt.locationName).toEqual('The Test Court');
          expect(Number(matchedCourt.locationCode)).toEqual(Number(bodyStub.courtNameOrLocation));
          expect(matchedCourt.attendanceTime).toEqual('10:00');

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

          expect(matchedCourt).toEqual(false);

          done();
        });
    });

    it('should return the correct pool status', function() {
      var statusCreated = 'created'
        , statusRequested = 'requested';

      expect(modUtils.poolStatus[statusCreated]).toEqual('CREATED');
      expect(modUtils.poolStatus[statusRequested]).toEqual('REQUESTED');
    });

    it('should return the correct pool type', function() {
      var crownCourt = 'cro'
        , coronersCourt = 'cor'
        , civilCourt = 'civ'
        , highCourt = 'hgh';

      expect(modUtils.poolType[crownCourt]).toEqual('CRO');
      expect(modUtils.poolType[coronersCourt]).toEqual('COR');
      expect(modUtils.poolType[civilCourt]).toEqual('CIV');
      expect(modUtils.poolType[highCourt]).toEqual('HGH');
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

      expect(transformedPools.head).toHaveLength(5);
      expect(transformedPools.rows).toHaveLength(1);
      expect(transformedPools.rows[0]).toHaveLength(5);
      expect(transformedPools.rows[0][0].hasOwnProperty('html')).toEqual(true);
      expect(transformedPools.rows[0][0].html).toEqual(
        '<a href="/pool-management/pool-overview/415230101" class="govuk-link">415230101</a>');
      expect(transformedPools.rows[0][1].hasOwnProperty('text')).toEqual(true);
      expect(transformedPools.rows[0][1].text).toEqual(100);
      expect(transformedPools.rows[0][2].hasOwnProperty('text')).toEqual(true);
      expect(transformedPools.rows[0][2].text).toEqual('Court Name');
      expect(transformedPools.rows[0][3].hasOwnProperty('text')).toEqual(true);
      expect(transformedPools.rows[0][3].text).toEqual('Crown court');
      expect(transformedPools.rows[0][4].hasOwnProperty('text')).toEqual(true);
      expect(transformedPools.rows[0][4].hasOwnProperty('classes')).toEqual(true);
      expect(transformedPools.rows[0][4].text).toEqual('Sun 01 Jan 2023');
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

      expect(transformedPools.head).toHaveLength(6);
      expect(transformedPools.rows).toHaveLength(1);
      expect(transformedPools.rows[0]).toHaveLength(6);
      expect(transformedPools.rows[0][0].hasOwnProperty('html')).toEqual(true);
      expect(transformedPools.rows[0][0].html).toEqual(
        '<a href="/pool-management/pool-overview/415230101" class="govuk-link">415230101</a>');
      expect(transformedPools.rows[0][1].hasOwnProperty('text')).toEqual(true);
      expect(transformedPools.rows[0][1].text).toEqual(100);
      expect(transformedPools.rows[0][2].hasOwnProperty('text')).toEqual(true);
      expect(transformedPools.rows[0][2].text).toEqual(50);
      expect(transformedPools.rows[0][3].hasOwnProperty('text')).toEqual(true);
      expect(transformedPools.rows[0][3].text).toEqual('Court Name');
      expect(transformedPools.rows[0][4].hasOwnProperty('text')).toEqual(true);
      expect(transformedPools.rows[0][4].text).toEqual('Crown Court');
      expect(transformedPools.rows[0][5].hasOwnProperty('text')).toEqual(true);
      expect(transformedPools.rows[0][5].hasOwnProperty('classes')).toEqual(true);
      expect(transformedPools.rows[0][5].text).toEqual('Sun 01 Jan 2023');
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

      expect(transformedPools.head).toHaveLength(6);
      expect(transformedPools.rows).toHaveLength(1);
      expect(transformedPools.rows[0]).toHaveLength(6);
      expect(transformedPools.rows[0][0].hasOwnProperty('html')).toEqual(true);
      expect(transformedPools.rows[0][0].html).toEqual(
        '<a href="/pool-management/pool-overview/415230101" class="govuk-link">415230101</a>');
      expect(transformedPools.rows[0][1].hasOwnProperty('text')).toEqual(true);
      expect(transformedPools.rows[0][1].text).toEqual(100);
      expect(transformedPools.rows[0][2].hasOwnProperty('text')).toEqual(true);
      expect(transformedPools.rows[0][2].text).toEqual(50);
      expect(transformedPools.rows[0][3].hasOwnProperty('text')).toEqual(true);
      expect(transformedPools.rows[0][3].text).toEqual('Court Name');
      expect(transformedPools.rows[0][4].hasOwnProperty('text')).toEqual(true);
      expect(transformedPools.rows[0][4].text).toEqual('Crown Court');
      expect(transformedPools.rows[0][5].hasOwnProperty('text')).toEqual(true);
      expect(transformedPools.rows[0][5].hasOwnProperty('classes')).toEqual(true);
      expect(transformedPools.rows[0][5].text).toEqual('Sun 01 Jan 2023');
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

      expect(transformedUnpaidAttendance.head).toHaveLength(6);
      expect(transformedUnpaidAttendance.rows).toHaveLength(1);
      expect(transformedUnpaidAttendance.rows[0][0].hasOwnProperty('html')).toEqual(true);
      expect(transformedUnpaidAttendance.rows[0][0].html).toEqual(
        '<a href="/juror-management/record/123456/expenses" class="govuk-link">123456</a>');
      expect(transformedUnpaidAttendance.rows[0][1].hasOwnProperty('text')).toEqual(true);
      expect(transformedUnpaidAttendance.rows[0][1].text).toEqual('12345');
      expect(transformedUnpaidAttendance.rows[0][2].hasOwnProperty('text')).toEqual(true);
      expect(transformedUnpaidAttendance.rows[0][2].text).toEqual('First');
      expect(transformedUnpaidAttendance.rows[0][3].hasOwnProperty('text')).toEqual(true);
      expect(transformedUnpaidAttendance.rows[0][3].text).toEqual('Last');
      expect(transformedUnpaidAttendance.rows[0][4].hasOwnProperty('text')).toEqual(true);
      expect(transformedUnpaidAttendance.rows[0][4].text).toEqual('£80.00');
      expect(transformedUnpaidAttendance.rows[0][5].hasOwnProperty('html')).toEqual(true);
      // eslint-disable-next-line max-len
      expect(transformedUnpaidAttendance.rows[0][5].html).toEqual('<a href="/juror-management/unpaid-attendance/expense-record/123456/12345/draft" class="govuk-link">View expenses</a>');
    });

    it('should transform the messaging trials list before rendering', function() {
      var trialsList = [
        {
          parties: 'Test Defendant',
          judge: 'Judge Test',
          courtroom: 'Large Room',
          court: 'CHESTER',
          trialNumber: 'T100000000',
          trialType: 'Civil',
          courtLocation: '415',
          startDate: [ 2024, 2, 7 ],
          isActive: false,
        },
      ];

      const transforedTrialsTable = modUtils.transformMessagingTrialsList(trialsList);

      expect(transforedTrialsTable.head).toHaveLength(7);
      expect(transforedTrialsTable.rows).toHaveLength(1);
      expect(transforedTrialsTable.rows[0][0].hasOwnProperty('html')).toEqual(true);
      expect(transforedTrialsTable.rows[0][0].html).toEqual(
        '<div class="govuk-radios govuk-radios--small" data-module="govuk-radios">' +
          '<div class="govuk-radios__item">' +
            '<input class="govuk-radios__input" id="T100000000" name="selectedTrial" type="radio" value="T100000000">' +
            '<label class="govuk-label govuk-radios__label">' +
              '<a href="/trial-management/trials/T100000000/415/detail" class="govuk-link">T100000000</a>' +
            '</label>' +
          '</div>' +
        '</div>'
      );
      expect(transforedTrialsTable.rows[0][1].hasOwnProperty('text')).toEqual(true);
      expect(transforedTrialsTable.rows[0][1].text).toEqual('Test Defendant');
      expect(transforedTrialsTable.rows[0][2].hasOwnProperty('text')).toEqual(true);
      expect(transforedTrialsTable.rows[0][2].text).toEqual('Civil');
      expect(transforedTrialsTable.rows[0][3].hasOwnProperty('text')).toEqual(true);
      expect(transforedTrialsTable.rows[0][3].text).toEqual('Chester');
      expect(transforedTrialsTable.rows[0][4].hasOwnProperty('text')).toEqual(true);
      expect(transforedTrialsTable.rows[0][4].text).toEqual('Large Room');
      expect(transforedTrialsTable.rows[0][5].hasOwnProperty('text')).toEqual(true);
      expect(transforedTrialsTable.rows[0][5].text).toEqual('Judge Test');
      expect(transforedTrialsTable.rows[0][6].hasOwnProperty('text')).toEqual(true);
      expect(transforedTrialsTable.rows[0][6].text).toEqual('Wed 07 Feb 2024');
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

      expect(finalTimePadBoth).toEqual({ hour: '08', minute: '05' });
      expect(finalTimePadNone).toEqual({ hour: '10', minute: '15' });
      expect(finalTimePadHour).toEqual({ hour: '08', minute: '15' });
      expect(finalTimePadMinute).toEqual({ hour: '10', minute: '05' });
    });

    it('should transform the pool numbers response into key.html and value.text objects', function() {
      var poolNumbersStub = [
          { poolNumber: '415220101', attendanceDate: '2022-01-01' },
          { poolNumber: '415220102', attendanceDate: '2022-01-10' },
          { poolNumber: '415220103', attendanceDate: '2022-01-21' },
        ]
        , transformedPoolNumbers;

      transformedPoolNumbers = modUtils.transformPoolNumbers(poolNumbersStub);

      expect(transformedPoolNumbers).toHaveLength(3);
      expect(Object.keys(transformedPoolNumbers[0])).toHaveLength(2);
      expect(transformedPoolNumbers[0].hasOwnProperty('key')).toEqual(true);
      expect(transformedPoolNumbers[0].hasOwnProperty('value')).toEqual(true);
      expect(transformedPoolNumbers[1]['key'].hasOwnProperty('html')).toEqual(true);
      expect(transformedPoolNumbers[1]['value'].hasOwnProperty('text')).toEqual(true);
    });

    it('should return an empty array if there are no pool numbers to transform', function() {
      var poolNumbersStub = []
        , transformedPoolNumbers;

      transformedPoolNumbers = modUtils.transformPoolNumbers(poolNumbersStub);

      expect(transformedPoolNumbers).toHaveLength(0);
    });

    it('should return the correct day type if the key passed in is valid', function() {
      var holiday = 'HOLIDAY'
        , businessDay = 'BUSINESS_DAY'
        , weekend = 'WEEKEND';

      expect(modUtils.dayTypes[holiday]).toEqual(holiday);

      expect(modUtils.dayTypes[businessDay]).toEqual(businessDay);

      expect(modUtils.dayTypes[weekend]).toEqual(weekend);
    });

    it('should return true if a legacy (juror-digital) module is visited by a court user', function() {
      var pathParts = ['inbox', 'pending', 'completed', 'search', 'new-replies', 'staff', 'response', 'whatever'];

      expect(modUtils.jurorDigitalPath[pathParts[0]]).toEqual(true); // /inbox
      expect(modUtils.jurorDigitalPath[pathParts[1]]).toEqual(true); // /pending
      expect(modUtils.jurorDigitalPath[pathParts[2]]).toEqual(true); // /completed
      expect(modUtils.jurorDigitalPath[pathParts[3]]).toEqual(true); // /search
      expect(modUtils.jurorDigitalPath[pathParts[4]]).toEqual(true); // /new-replies
      expect(modUtils.jurorDigitalPath[pathParts[5]]).toEqual(true); // /staff
      // expect(modUtils.jurorDigitalPath[pathParts[6]]).toEqual(true); // /response
      expect(modUtils.jurorDigitalPath[pathParts[7]]).toBeUndefined();  // /everything-else
    });

    it('should transform postcodes to expected format, sorted and with total court yield', function() {
      var dataStub = [
          { postCodePart: 'PC1', total: 10 },
          { postCodePart: 'PC3', total: 12 },
          { postCodePart: 'PC2', total: 6 },
        ]
        , transformedPostcodes = modUtils.transformPostcodes(dataStub);

      expect(transformedPostcodes).toHaveLength(2);
      expect(transformedPostcodes[0]).toHaveLength(3);
      expect(typeof transformedPostcodes[1]).toBe('number');
      expect(transformedPostcodes[1]).toEqual(28);

      expect(transformedPostcodes[0][0].id).toEqual('PC1');
      expect(transformedPostcodes[0][0].value).toEqual('PC1');
      expect(transformedPostcodes[0][0].text).toEqual('PC1 (10)');
      expect(transformedPostcodes[0][0].checked).toEqual(true);

      expect(transformedPostcodes[0][1].id).toEqual('PC2');
      expect(transformedPostcodes[0][1].value).toEqual('PC2');
      expect(transformedPostcodes[0][1].text).toEqual('PC2 (6)');
      expect(transformedPostcodes[0][1].checked).toEqual(true);

      expect(transformedPostcodes[0][2].id).toEqual('PC3');
      expect(transformedPostcodes[0][2].value).toEqual('PC3');
      expect(transformedPostcodes[0][2].text).toEqual('PC3 (12)');
      expect(transformedPostcodes[0][2].checked).toEqual(true);
    });

    it('should convert postcodes to array and transform as expected if single postcode object is passed', function() {
      var dataStub = {
          postCodePart:
          'PC1',
          total: 10,
        }
        , transformedPostcode = modUtils.transformPostcodes(dataStub);

      expect(transformedPostcode).toHaveLength(2);
      expect(transformedPostcode[0]).toHaveLength(1);
      expect(typeof transformedPostcode[1]).toBe('number');
      expect(transformedPostcode[1]).toEqual(10);

      expect(transformedPostcode[0][0].id).toEqual('PC1');
      expect(transformedPostcode[0][0].value).toEqual('PC1');
      expect(transformedPostcode[0][0].text).toEqual('PC1 (10)');
      expect(transformedPostcode[0][0].checked).toEqual(true);
    });

    it('should generate a date 9 weeks in the future', function() {
      var testDate = '2022-11-15'
        , generatedDate;

      generatedDate = modUtils.buildSuggestedDate('2022-09-13');

      expect(dateFilter(generatedDate, null, 'YYYY-MM-DD')).toEqual(testDate);
    });

    /* eslint-disable max-len */
    it('should build the correct pagination items - no query params and page 1', function() {
      var totalResults = 100
        , currentPage = 1
        , url = '/some-url'
        , paginationItems;

      paginationItems = modUtils.paginationBuilder(totalResults, currentPage, url);

      expect(paginationItems.prev).toBeUndefined();
      expect(paginationItems.next).toEqual('/some-url?page=2');
      expect(paginationItems.items).toHaveLength(4);

      expect(paginationItems.items[0]).toEqual(expect.any(Object));
      expect(paginationItems.items[0].hasOwnProperty('number')).toEqual(true);
      expect(paginationItems.items[0].number).toEqual(1);
      expect(paginationItems.items[1].number).toEqual(2);
      expect(paginationItems.items[3].number).toEqual(4);

      expect(paginationItems.items[0].hasOwnProperty('href')).toEqual(true);
      expect(paginationItems.items[0].href).toEqual('/some-url?page=1');
      expect(paginationItems.items[1].href).toEqual('/some-url?page=2');
      expect(paginationItems.items[3].href).toEqual('/some-url?page=4');

      expect(paginationItems.items[0].hasOwnProperty('current')).toEqual(true);
      expect(paginationItems.items[0].current).toEqual(true);
      expect(paginationItems.items[1].current).toEqual(false);
      expect(paginationItems.items[3].current).toEqual(false);

      // test for an ellipsis
      expect(paginationItems.items[2].hasOwnProperty('ellipsis')).toEqual(true);
      expect(paginationItems.items[2].ellipsis).toEqual(true);
    });

    it('should build the correct pagination items - query params and page 4', function() {
      var totalResults = 100
        , currentPage = 4
        , url = '/some-url?search=this&page=4'
        , paginationItems;

      paginationItems = modUtils.paginationBuilder(totalResults, currentPage, url);

      expect(paginationItems.prev).toEqual('/some-url?search=this&page=3');
      expect(paginationItems.next).toBeUndefined();
      expect(paginationItems.items).toHaveLength(4);

      // ellipsis should be on index 1
      expect(paginationItems.items[1].hasOwnProperty('ellipsis')).toEqual(true);
      expect(paginationItems.items[1].ellipsis).toEqual(true);
    });

    it('should build the correct pagination items - query params and page 2', function() {
      var totalResults = 100
        , currentPage = 2
        , url = '/some-url?search=this&page=2'
        , paginationItems;

      paginationItems = modUtils.paginationBuilder(totalResults, currentPage, url);

      expect(paginationItems.prev).toEqual('/some-url?search=this&page=1');
      expect(paginationItems.next).toEqual('/some-url?search=this&page=3');
      expect(paginationItems.items).toHaveLength(4);

      // this one does not generate ellipsis so all items elements have a number
      expect(paginationItems.items[0].hasOwnProperty('number')).toEqual(true);
      expect(paginationItems.items[1].hasOwnProperty('number')).toEqual(true);
      expect(paginationItems.items[2].hasOwnProperty('number')).toEqual(true);
      expect(paginationItems.items[3].hasOwnProperty('number')).toEqual(true);

      expect(paginationItems.items[0].number).toEqual(1);
      expect(paginationItems.items[1].number).toEqual(2);
      expect(paginationItems.items[2].number).toEqual(3);
      expect(paginationItems.items[3].number).toEqual(4);
    });

    it('should return a correct hash for a given string', function() {
      var string = 'some-string'
        , hashedString = 'a3635c09bda7293ae1f144a240f155cf151451f2420d11ac385d13cce4eb5fa2';

      expect(hashedString).toEqual(modUtils.hash(string));
    });

    it('should resolve the date format based on input: DD/MM/YYYY (double digit day & month)', function() {
      var mockDate = '31/12/2023'
        , expectedFormat = 'DD/MM/YYYY';

      expect(modUtils.resolveDateFormat(mockDate)).toEqual(expectedFormat);
    });

    it('should resolve the date format based on input: DD/MM/YYYY (single digit day & month)', function() {
      var mockDate = '2/2/2023'
        , expectedFormat = 'DD/MM/YYYY';

      expect(modUtils.resolveDateFormat(mockDate)).toEqual(expectedFormat);
    });

    it('should resolve the date format based on input: YYYY/MM/DD (double digit day & month)', function() {
      var mockDate = '2023/12/31'
        , expectedFormat = 'YYYY/MM/DD';

      expect(modUtils.resolveDateFormat(mockDate)).toEqual(expectedFormat);
    });

    it('should resolve the date format based on input: YYYY/MM/DD (single digit day & month)', function() {
      var mockDate = '2023/2/2'
        , expectedFormat = 'YYYY/MM/DD';

      expect(modUtils.resolveDateFormat(mockDate)).toEqual(expectedFormat);
    });

    it('should resolve the date format based on input: YYYY-MM-DD (double digit day & month)', function() {
      var mockDate = '2023-12-31'
        , expectedFormat = 'YYYY-MM-DD';

      expect(modUtils.resolveDateFormat(mockDate)).toEqual(expectedFormat);
    });

    it('should resolve the date format based on input: YYYY-MM-DD (single digit day & month)', function() {
      var mockDate = '2023-2-2'
        , expectedFormat = 'YYYY-MM-DD';

      expect(modUtils.resolveDateFormat(mockDate)).toEqual(expectedFormat);
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

      expect(output).toEqual('some/paper/path/123456789/paper');
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

      expect(output).toEqual('some/digital/path/123456789/digital');
    });

    it('should resolve the correct reply status', function() {
      var responseStatus = 'Closed'
        , output;

      output = modUtils.resolveReplyStatus(responseStatus);
      expect(output).toEqual('Completed');

      output = modUtils.resolveReplyStatus('To Do');
      expect(output).toEqual('To Do');

      output = modUtils.resolveReplyStatus('Ineligible');
      expect(output).toEqual('Ineligible');
    });

    it('should resolve and build the correct processing outcome', function() {
      var resolvedHtml = '<span class="mod-flex mod-items-center mod-gap-x-2">Excusal refused (child care) <div class="icon mod-icon-urgent"></div></span>'
        , output;

      output = modUtils.resolveProcessingOutcome('Responded', 'Y', 'CHILD CARE');
      expect(output).toEqual(resolvedHtml);

      output = modUtils.resolveProcessingOutcome('Excused', 'N', 'CHILD CARE');
      expect(output).toEqual('Excusal granted (child care)');

      output = modUtils.resolveProcessingOutcome('Responded', null, null);
      expect(output).toEqual('Responded');

      output = modUtils.resolveProcessingOutcome('Summoned', null, null);
      expect(output).toEqual('-');
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
      expect(output).toEqual('Responded');

      output = modUtils.resolveProcessedBannerMessage(jurorStatus.responded, {
        isExcusal: true,
      });
      expect(output).toEqual('Excusal refused');

      output = modUtils.resolveProcessedBannerMessage(jurorStatus.excused, {
        isExcusal: false,
      });
      expect(output).toEqual('Excusal granted');

      output = modUtils.resolveProcessedBannerMessage(jurorStatus.excused, {
        isExcusal: true,
      });
      expect(output).toEqual('Excusal granted');

      output = modUtils.resolveProcessedBannerMessage(jurorStatus.responded, {
        isDeferral: true,
      });
      expect(output).toEqual('Deferral refused');

      output = modUtils.resolveProcessedBannerMessage(jurorStatus.deferred, {
        isDeferral: true,
      });
      expect(output).toEqual('Deferral granted');

      output = modUtils.resolveProcessedBannerMessage(jurorStatus.deferred, {
        isDeferral: false,
      });
      expect(output).toEqual('Deferral granted');

      output = modUtils.resolveProcessedBannerMessage(jurorStatus.excused, {
        isDeceased: true,
      });
      expect(output).toEqual('Deceased');

      // this should never happen if a response is not closed
      output = modUtils.resolveProcessedBannerMessage(jurorStatus.summoned);
      expect(output).toEqual('Summoned');
    });

    it('should transform the court name and location code before rendering', () => {
      let output
        , court = {
          locationName: 'test location',
          locationCode: '100',
        };

      output = modUtils.transformCourtName(court);
      expect(output).toEqual('Test Location (100)');
    });

    it('should trim the court name and return only the 3 digit location code', () => {
      let output
        , courtNameOrLocation = 'Test Location (100)'
        , invalidCourtNameOrLocation = 'Test Location';

      output = modUtils.getLocCodeFromCourtNameOrLocation(courtNameOrLocation);
      expect(output).toEqual('100');

      output = modUtils.getLocCodeFromCourtNameOrLocation(invalidCourtNameOrLocation);
      expect(output).toEqual(null);

      output = modUtils.getLocCodeFromCourtNameOrLocation();
      expect(output).toEqual(null);
    });

    it('should verify if a summons is late given its start date', () => {
      const olderDate = new Date();
      let isBefore;

      isBefore = modUtils.isLateSummons('01-01-2023');
      expect(isBefore).toEqual(true);

      olderDate.setDate(olderDate.getDate() + 10);
      isBefore = modUtils.isLateSummons(olderDate);
      expect(isBefore).toEqual(false);
    });

    it('should return the correct letter identifier - initial summons', () => {
      const identifier = modUtils.getLetterIdentifier('initial-summons');

      expect(identifier).toEqual('Initial summons');
    });

    it('should return the correct letter identifier - summons reminders', () => {
      const identifier = modUtils.getLetterIdentifier('summons-reminders');

      expect(identifier).toEqual('Summons reminders');
    });

    it('should return the correct letter identifier - further information', () => {
      const identifier = modUtils.getLetterIdentifier('further-information');

      expect(identifier).toEqual('Requests for further information');
    });

    it('should return the correct letter identifier - confirmation', () => {
      const identifier = modUtils.getLetterIdentifier('confirmation');

      expect(identifier).toEqual('Confirmation letters');
    });

    it('should return the correct letter identifier - deferral granted', () => {
      const identifier = modUtils.getLetterIdentifier('deferral-granted');

      expect(identifier).toEqual('Deferral granted letters');
    });

    it('should return the correct letter identifier - deferral refused', () => {
      const identifier = modUtils.getLetterIdentifier('deferral-refused');

      expect(identifier).toEqual('Deferral refused letters');
    });

    it('should return the correct letter identifier - deferral refused', () => {
      const identifier = modUtils.getLetterIdentifier('deferral-refused');

      expect(identifier).toEqual('Deferral refused letters');
    });

    it('should return the correct letter identifier - excusal granted', () => {
      const identifier = modUtils.getLetterIdentifier('excusal-granted');

      expect(identifier).toEqual('Excusal granted letters');
    });

    it('should return the correct letter identifier - excusal refused', () => {
      const identifier = modUtils.getLetterIdentifier('excusal-refused');

      expect(identifier).toEqual('Excusal refused letters');
    });

    it('should return the correct letter identifier - postponement', () => {
      const identifier = modUtils.getLetterIdentifier('postponement');

      expect(identifier).toEqual('Postponement letters');
    });

    it('should return the correct letter identifier - withdrawal', () => {
      const identifier = modUtils.getLetterIdentifier('withdrawal');

      expect(identifier).toEqual('Withdrawal letters');
    });

    it('should format a date for a letter in english', () => {
      const date = '2024-01-01';
      const isWelsh = false;
      const formattedDate = modUtils.formatLetterDate(date, 'dddd D MMMM YYYY', isWelsh);

      expect(formattedDate).toEqual('Monday 1 January 2024');
    });

    it('should format a date for a letter in welsh', () => {
      const date = '2024-01-01';
      const isWelsh = true;
      const formattedDate = modUtils.formatLetterDate(date, 'dddd D MMMM YYYY', isWelsh);

      expect(formattedDate).toEqual('Dydd Llun 1 Ionawr 2024');
    });

    it('should format all keys in a deeply nested object to given case', () => {
      const deeplyNestedObj = {
        id: 1,
        'a b C': { 'd e f': { ghi: 'ghi', jkL: 'jkl' } },
        mno: [ { onm: 'onm' }, { nOm: 'nom' } ],
        'p q r': 'pqr',
        Stu: { vwx: 'vwx', y: { Z: 'z' }},
      };
      let formattedObject;

      formattedObject = modUtils.replaceAllObjKeys(_.cloneDeep(deeplyNestedObj), toSentenceCase);

      expect(formattedObject).toEqual(
        {
          Id: 1,
          'A b c': { 'D e f': { Ghi: 'ghi', 'Jk l': 'jkl' } },
          Mno: [ { Onm: 'onm' }, {'N om': 'nom' } ],
          'P q r': 'pqr',
          Stu: { Vwx: 'vwx', Y: { Z: 'z' } },
        },
      );

      formattedObject = modUtils.replaceAllObjKeys(_.cloneDeep(deeplyNestedObj), capitalise);

      expect(formattedObject).toEqual(
        {
          ID: 1,
          'A B C': { 'D E F': { GHI: 'ghi', JKL: 'jkl' } },
          MNO: [ { ONM: 'onm' }, { NOM: 'nom' } ],
          'P Q R': 'pqr',
          STU: { VWX: 'vwx', Y: { Z: 'z' } },
        },
      );

      formattedObject = modUtils.replaceAllObjKeys(_.cloneDeep(deeplyNestedObj), _.camelCase);

      expect(formattedObject).toEqual(
        {
          id: 1,
          mno: [ { onm: 'onm' }, { nOm: 'nom' } ],
          aBC: { dEF: { ghi: 'ghi', jkL: 'jkl' } },
          pQR: 'pqr',
          stu: { vwx: 'vwx', y: { z: 'z' } },
        },
      );

      formattedObject = modUtils.replaceAllObjKeys(_.cloneDeep(deeplyNestedObj), _.snakeCase);

      expect(formattedObject).toEqual(
        {
          id: 1,
          mno: [ { onm: 'onm' }, { 'n_om': 'nom' } ],
          'a_b_c': { 'd_e_f': { ghi: 'ghi', 'jk_l': 'jkl' } },
          'p_q_r': 'pqr',
          stu: { vwx: 'vwx', y: { z: 'z' } },
        },
      );
    });

    it('Should set the correct previous working day given a day of the week - Monday', () => {
      const date = new Date([2024, 1, 1]);
      const previousWorkingDay = modUtils.setPreviousWorkingDay(date);

      expect(previousWorkingDay.toISOString()).toEqual(new Date([2023, 12, 29]).toISOString());
    });

    it('Should set the correct previous working day given a day of the week - Sunday', () => {
      const date = new Date([2024, 1, 7]);
      const previousWorkingDay = modUtils.setPreviousWorkingDay(date);

      expect(previousWorkingDay.toISOString()).toEqual(new Date([2024, 1, 5]).toISOString());
    });

    it('Should set the correct previous working day given a day of the week - Saturday', () => {
      const date = new Date([2024, 1, 6]);
      const previousWorkingDay = modUtils.setPreviousWorkingDay(date);

      expect(previousWorkingDay.toISOString()).toEqual(new Date([2024, 1, 5]).toISOString());
    });

    it('Should set the correct previous working day given a day of the week - Rest of the week', () => {
      const date = new Date([2024, 1, 5]);
      const previousWorkingDay = modUtils.setPreviousWorkingDay(date);

      expect(previousWorkingDay.toISOString()).toEqual(new Date([2024, 1, 4]).toISOString());
    });

  });

})();
