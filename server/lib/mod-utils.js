(function() {
  'use strict';

  var _ = require('lodash')
    , crypto = require('crypto')
    , transformPoolType = require('../components/filters').transformPoolType
    , dateFilter = require('../components/filters').dateFilter
    , capitalizeFully = require('../components/filters').capitalizeFully
    , moment = require('moment')
    , modUtils = require('../lib/mod-utils')
    , { LaunchDarkly } = require('./launchdarkly');

  module.exports.hasFlagAccess = async function(username, owner, flag) {
    // context object for launchdarkly
    // to verify a string hash we can use https://sha256algorithm.com/
    const context = {
      kind: 'user',
      key: modUtils.hash(username),
      owner,
    };

    return await LaunchDarkly.instance.variation(flag, context, false);
  };

  module.exports.matchUserCourt = function(courts, body) {
    var match = false
      , courtCode;

    courtCode = body.courtNameOrLocation.toString().match(/\d+/g);

    return new Promise(function(resolve, reject) {
      courts.forEach(function(court) {
        if (parseInt(court.locationCode) === parseInt(courtCode[0])) {

          match = true;
          court.attendanceTime = court.attendanceTime.match(/[\d:]+/g)[0];

          resolve(court);
        }
      });
      if (!match) {
        reject(false);
      }
    });
  };

  module.exports.transformCourtNames = function(courts) {
    return courts
      .sort((court1, court2) => court1.locationCode - court2.locationCode)
      .reduce((prev, court) => {
        if (court.locationCode === '400') {
          return prev;
        }

        prev.push(modUtils.transformCourtName(court));
        return prev;
      }, []);
  };

  module.exports.transformCourtName = function(court) {
    return capitalizeFully(court.locationName).trim().replace(',', '') + ' (' + court.locationCode + ')';
  };

  module.exports.getLocCodeFromCourtNameOrLocation = (courtNameOrLocation) => {
    if (!courtNameOrLocation) return null;

    let matches = courtNameOrLocation.match(/\d+/g);

    return matches ? matches[0] : null;
  };

  module.exports.transformPoolList = function(pools, status, tab, sortBy, sortOrder) {
    const table = {
        head: [],
        rows: [],
      }
      , order = sortOrder || 'ascending';

    table.head.push(
      {
        id: 'poolNumber',
        value: 'Pool number',
        sort: sortBy === 'poolNumber' ? order : 'none',
      },
      {
        ...(status === 'created') ?
          (tab === 'court') ?
            {
              id: 'poolCapacity',
              value: 'Pool capacity',
              sort: sortBy === 'poolCapacity' ? order : 'none',
              sortable: false,
            } :
            {
              id: 'jurorsRequested',
              value: 'Jurors requested',
              sort: sortBy === 'jurorsRequested' ? order : 'none',
            } :
          {
            id: 'numberRequested',
            value: 'Jurors requested',
            sort: sortBy === 'numberRequested' ? order : 'none',
          },
      },
      {
        id: 'courtName',
        value: 'Court name',
        sort: sortBy === 'courtName' ? order : 'none',
        sortable: status === 'created',
      },
      {
        id: 'poolType',
        value: 'Pool type',
        sort: sortBy === 'poolType' ? order : 'none',
      },
      {
        id: status === 'requested' ? 'returnDate' : 'serviceStartDate',
        value: 'Service start date',
        format: 'numeric',
        sort: !sortBy || (sortBy === 'returnDate' || sortBy === 'serviceStartDate') ? order : 'none',
      }
    );
    if (status === 'created') {
      table.head.splice(2, 0, {
        ...(tab === 'bureau') ?
          {
            id: 'jurorsConfirmed',
            value: 'Jurors confirmed',
            sort: sortBy === 'jurorsConfirmed' ? order : 'none',
            sortable: false,
          } :
          {
            id: 'jurorsInPool',
            value: 'Jurors in pool',
            sort: sortBy === 'jurorsInPool' ? order : 'none',
          },
      });
    }

    // prepare the table rows
    pools.forEach(function(pool) {
      var item = []
        , getNumberRequested = function() {
          if (tab === 'court') {
            return pool.poolCapacity;
          }
          return (pool.numberRequested) ? pool.numberRequested : pool.jurorsRequested;
        }
        , getNumberConfirmed = function() {
          return (tab === 'bureau') ? pool.confirmedJurors : pool.jurorsInPool;
        };

      // build a row object (each row needs to be its own array)
      item.push(
        {
          html: '<a href="/pool-management/pool-overview/' +
              pool.poolNumber + '" class="govuk-link">' + pool.poolNumber + '</a>',
          attributes: {
            'data-sort-value': pool.poolNumber,
          },
        },
        {
          text: getNumberRequested(),
          attributes: {
            'data-sort-value': getNumberRequested(),
          },
        },
        {
          text: capitalizeFully(pool.courtName),
          attributes: {
            'data-sort-value': pool.courtName,
          },
        },
        {
          text: (pool.poolType.length === 3) ? transformPoolType(pool.poolType) : capitalizeFully(pool.poolType),
          attributes: {
            'data-sort-value': pool.poolType,
          },
        },
        {
          text: dateFilter(pool.attendanceDate, null, 'ddd DD MMM YYYY'),
          attributes: {
            'data-sort-value': pool.attendanceDate,
          },
          classes: 'govuk-!-text-align-right',
        }
      );

      if (status === 'created') {
        item.splice(2, 0, {
          text: getNumberConfirmed(),
          attributes: {
            'data-sort-value': getNumberConfirmed(),
          },
        });
      }

      table.rows.push(item);
    });

    return table;
  };

  module.exports.transformSearchPoolList = function(pools) {
    var list = [];

    pools.forEach(function(pool) {
      list.push([{
        html: '<a href="/pool-management/pool-overview/' +
            pool.poolNumber + '" class="govuk-link">' + pool.poolNumber + '</a>',
        attributes: {
          'data-sort-value': pool.poolNumber,
        },
      },
      {
        text: pool.courtName,
        attributes: {
          'data-sort-value': pool.courtName,
        },
      },
      {
        text: pool.poolStage,
        attributes: {
          'data-sort-value': pool.poolStage,
        },
      },
      {
        text: pool.poolStatus,
        attributes: {
          'data-sort-value': pool.poolStatus,
        },
      },
      {
        text: pool.poolType,
        attributes: {
          'data-sort-value': pool.poolType,
        },
      },
      {
        text: dateFilter(pool.serviceStartDate, null, 'ddd DD MMM YYYY'),
        attributes: {
          'data-sort-value': pool.serviceStartDate,
        },
      }]);
    });

    return list;
  };

  module.exports.transformUnpaidAttendanceList = (unpaidAttendance, sortBy, sortOrder) => {
    const order = sortOrder || 'ascending';
    const table = {
      head: [{
        id: 'jurorNumber',
        value: 'Juror Number',
        sort: sortBy === 'jurorNumber' ? order : 'none',
        sortable: true,
      },
      {
        id: 'poolNumber',
        value: 'Pool Number',
        sort: sortBy === 'poolNumber' ? order : 'none',
        sortable: true,
      },
      {
        id: 'FirstName',
        value: 'First Name',
        sort: sortBy === 'firstName' ? order : 'none',
        sortable: true,
      },
      {
        id: 'lastName',
        value: 'Last Name',
        sort: sortBy === 'lastName' ? order : 'none',
        sortable: true,
      },
      {
        id: 'unpaidTotal',
        value: 'Total unapproved',
        sort: sortBy === 'unpaidTotal' ? order : 'none',
        sortable: true,
      },
      {
        id: 'viewExpenses',
        value: '',
        sortable: false,
      }],
      rows: [],
    };

    unpaidAttendance.forEach((unpaid) => {
      let item = [];

      item.push(
        {
          html: '<a href="/juror-management/record/' +
            unpaid.juror_number + '/finance" class="govuk-link">' + unpaid.juror_number + '</a>',
          attributes: {
            'data-sort-value': unpaid.juror_number,
          },
        },
        {
          text: unpaid.pool_number,
          attributes: {
            'data-sort-value': unpaid.pool_number,
          },
        },
        {
          text: unpaid.first_name,
          attributes: {
            'data-sort-value': unpaid.first_name,
          },
        },
        {
          text: unpaid.last_name,
          attributes: {
            'data-sort-value': unpaid.last_name,
          },
        },
        {
          text: unpaid.total_unapproved,
          attributes: {
            'data-sort-value': unpaid.total_unapproved,
          },
        },
        {
          html: '<a href="/juror-management/unpaid-attendance/expense-record/' +
            unpaid.juror_number + '" class="govuk-link">' + 'View expenses' + '</a>',
          attributes: {
            'data-sort-value': unpaid.total_unapproved,
          },
        }
      );

      table.rows.push(item);
    });
    return table;
  };


  // used to pad the pool request time with an extra 0 in case the user sets
  // 1 - 9... for example 8:5 would be padded to 08:05
  module.exports.padTime = function(time) {
    var tmpTime = _.clone(time);

    if (time.attendanceTimeHour.length === 1) {
      tmpTime.attendanceTimeHour = '0' + time.attendanceTimeHour;
    }

    if (time.attendanceTimeMinute.length === 1) {
      tmpTime.attendanceTimeMinute = '0' + time.attendanceTimeMinute;
    }

    return {
      hour: tmpTime.attendanceTimeHour,
      minute: tmpTime.attendanceTimeMinute,
    };
  };

  // this function is related to change-pool-number screen
  module.exports.transformPoolNumbers = function(pools) {
    var transformedPoolNumbers = [];

    pools.forEach(function(el) {
      transformedPoolNumbers.push(
        {
          key: {
            html: '<a class="govuk-link govuk-body" href="#">'+ el.poolNumber +'</a>',
          },
          value: {
            text: dateFilter(el.attendanceDate, 'yyyy-MM-DD', 'ddd DD MMM YYYY'),
          },
        },
      );
    });

    return transformedPoolNumbers;
  };

  module.exports.constants = {
    PAGE_SIZE: 25,
    MAX_CORONER_JURORS: 250,
  };

  module.exports.poolStatus = {
    requested: 'REQUESTED',
    created: 'CREATED',
  };

  module.exports.poolType = {
    cro: 'CRO',
    cor: 'COR',
    civ: 'CIV',
    hgh: 'HGH',
  };

  module.exports.adjustmentsReasons = {
    C: 'C - Childcare problems',
    D: 'D - Diet',
    H: 'H - Hearing impairment',
    I: 'I - Diabetic',
    L: 'L - Limited mobility',
    M: 'M - Multiple',
    O: 'O - Other',
    P: 'P - Pregnancy',
    R: 'R - Reading',
    U: 'U - Drug dependent',
    V: 'V - Visual impairment',
    W: 'W - Wheelchair access',
  };

  module.exports.deferralReasons = {
    '': 'Select a reason...',
    A: 'A-Moved from the area',
    B: 'B-Student',
    C: 'C-Childcare',
    F: 'F-Forces',
    G: 'G-Financial hardship',
    I: 'I-Ill',
    J: 'J-Excused by bureau, too many jurors',
    K: 'K-Criminal record',
    L: 'L-Language difficulties',
    M: 'M-Medical',
    N: 'N-Mental health',
    O: 'O-Other',
    R: 'R-Religious reason',
    S: 'S-Recently served',
    T: 'T-Travelling difficulties',
    W: 'W-Work related',
    X: 'X-Carer',
    Y: 'Y-Holiday',
    Z: 'Z-Bereavement',
  };

  module.exports.buildSuggestedDate = function(date) {
    var tempDate = new Date();

    // this is to allow for testing
    if (typeof date !== 'undefined') {
      tempDate = new Date(date);
    }

    tempDate.setDate(tempDate.getDate() + 9 * 7);
    return dateFilter(tempDate, null, 'YYYY-MM-DD');
  };

  module.exports.transformPostcodes = function(data) {
    var postcodes = []
      , transformedPostcodes
      , courtYeld = 0;

    // if we get only 1 postcode we need to convert it to an array first
    if (data instanceof Array) {
      postcodes = data;
    } else {
      postcodes = [data];
    }

    transformedPostcodes = postcodes.map(function(postcode) {
      courtYeld = courtYeld + postcode.total;
      return {
        id: postcode.postCodePart.toLocaleUpperCase(),
        value: postcode.postCodePart.toLocaleUpperCase(),
        text: (postcode.postCodePart + ' (' + postcode.total + ')').toLocaleUpperCase(),
        checked: true,
      };
    });
    transformedPostcodes = _.sortBy(transformedPostcodes, ['value']);

    return [
      transformedPostcodes,
      courtYeld,
    ];
  };

  // Enum emulation for types of days
  module.exports.dayTypes = {
    'BUSINESS_DAY': 'BUSINESS_DAY',
    HOLIDAY: 'HOLIDAY',
    WEEKEND: 'WEEKEND',
  };

  module.exports.jurorDigitalPath = {
    inbox: true,
    pending: true,
    completed: true,
    search: true,
    'new-replies': true,
    staff: true,
  };

  module.exports.membersRows = function(membersList, namedRoutes) {
    var list = []
      , jurorRecordUrl;

    membersList.forEach(function(member) {
      jurorRecordUrl = namedRoutes.build('juror-record.overview.get', {
        jurorNumber: member.jurorNumber,
      });

      list.push([{
        html: '<a href="' + jurorRecordUrl + '" class="govuk-link">' + member.jurorNumber + '</a>',
        attributes: {
          'data-sort-value': member.jurorNumber,
        },
      },
      {
        text: capitalizeFully(member.firstName),
        attributes: {
          'data-sort-value': member.firstName,
        },
      },
      {
        text: capitalizeFully(member.lastname),
        attributes: {
          'data-sort-value': member.lastname,
        },
      },
      {
        text: member.postCode,
        attributes: {
          'data-sort-value': member.postCode,
        },
      },
      {
        text: member.owner,
        attributes: {
          'data-sort-value': member.owner,
        },
      },
      {
        text: member.status,
        attributes: {
          'data-sort-value': member.status,
        },
      }]);
    });

    return list;
  };

  module.exports.transformMembers = function(members) {
    var list = [];

    members.forEach(function(member) {
      list.push([
        {
          html: '<a href="#" class="govuk-link">' + member.jurorNumber + '</a>',
          attributes: {
            'data-sort-value': member.jurorNumber,
          },
        },
        {
          text: capitalizeFully(member.firstName),
          attributes: {
            'data-sort-value': member.firstName,
          },
        },
        {
          text: capitalizeFully(member.lastName),
          attributes: {
            'data-sort-value': member.lastName,
          },
        },
        {
          text: member.postCode,
          attributes: {
            'data-sort-value': member.postCode,
          },
        },
      ]);
    });

    return list;
  };

  // need a quick dirty check on a juror number
  // it needs to be a number and 9 ints long
  module.exports.isJurorNumber = function(jurorNumber) {
    return jurorNumber.length === 9 && !isNaN(jurorNumber);
  };

  /**
  *
  * @param {number} totalResults the number of results to calculate how many pages
  * @param {number} currentPage the current page the user is visiting
  * @param {string} url the current page url
  * @returns {object} The pagination object for the pagination component
  */
  module.exports.paginationBuilder = function(totalResults, currentPage, url) {
    var pageItems = []
      , totalPages = Math.ceil(totalResults / this.constants.PAGE_SIZE)
      , routePart = url.split('?')[0]
      , params = new URLSearchParams(url.split('?')[1] || '')
      , previousLink
      , nextLink
      , pageItem
      , i;

    // if the user navigates onto the page that needs pagination there won't be an &page=x parameter yet
    // so we need to add one on the list of params to then workout the urls
    if (!params.has('page')) {
      params.append('page', 1);
    }

    for (i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || i >= +currentPage - 1 && i <= +currentPage + 1) {
        params.set('page', i);
        pageItem = {
          number: i,
          href: routePart + '?' + params.toString(),
          current: +currentPage === i,
        };
        pageItems.push(pageItem);
      }
    }

    if (pageItems[1].number - pageItems[0].number > 1) {
      pageItems.splice(1, 0, { ellipsis: true });
    }

    if (pageItems[pageItems.length - 1].number - pageItems[pageItems.length - 2].number > 1) {
      pageItems.splice(-1, 0, { ellipsis: true });
    }

    if (+currentPage > 1) {
      params.set('page', +currentPage - 1);
      previousLink =  routePart + '?' + params.toString();
    }

    if (+currentPage < totalPages) {
      params.set('page', +currentPage + 1);
      nextLink =  routePart + '?' + params.toString();
    }

    return {
      prev: previousLink,
      next: nextLink,
      items: pageItems,
    };
  };

  module.exports.hash = function(string) {
    var hash = crypto.createHash('sha256');

    return hash.update(string).digest('hex');
  };

  module.exports.checkConvertArray = function(arr) {
    if ((typeof arr !== 'undefined') && !Array.isArray(arr)) {
      return [arr];
    } else if (typeof arr === 'undefined') {
      return [];
    }
    return arr;
  };

  module.exports.resolveDateFormat = function(dateStr) {
    var pattern1 = /(\d{1,2}\/)(\d{1,2}\/)(\d{4})/g
      , pattern2 = /(\d{4}\/)(\d{1,2}\/)(\d{1,2})/g
      , pattern3 = /(\d{4}-)(\d{1,2}-)(\d{1,2})/g;

    if (pattern1.test(dateStr)) {
      return 'DD/MM/YYYY';
    }

    if (pattern2.test(dateStr)) {
      return 'YYYY/MM/DD';
    }

    if (pattern3.test(dateStr)) {
      return 'YYYY-MM-DD';
    }

    return null;
  };

  module.exports.opticReferenceRedirectUrl = function(jurorNumber, namedRoutes, replyType) {
    var targetUrlMapping = {
      paper: 'response.paper.details.get',
      digital: 'response.detail.get',
    };

    return namedRoutes.build(targetUrlMapping[replyType], {
      id: jurorNumber,
      type: replyType,
    });
  };

  module.exports.resolveReplyStatus = function(status) {
    if (status === 'Closed') return 'Completed';

    return status;
  };

  // probably need to map something in case description is a single letter 'C' or 'B' or 'M'... whatever
  module.exports.resolveProcessingOutcome = function(status, rejected, description) {
    if (status === 'Responded' && rejected === 'Y') {
      return '<span class="mod-flex mod-items-center mod-gap-x-2">Excusal refused ('
        + description.toLowerCase() + ') <div class="icon mod-icon-urgent"></div></span>';
    }

    if (status === 'Excused') {
      return 'Excusal granted (' + description.toLowerCase() + ')';
    }

    if (status === 'Responded') {
      return status;
    }

    return '-';
  };

  module.exports.resolveProcessedBannerMessage = function(jurorStatus, options) {
    if (jurorStatus === 'Responded') {
      if (options.isExcusal) {
        return 'Excusal refused';
      }
      if (options.isDeferral) {
        return 'Deferral refused';
      }
    }

    if (jurorStatus === 'Excused' && options.isDeceased) {
      return 'Deceased';
    }

    if (jurorStatus === 'Excused') {
      return 'Excusal granted';
    }

    if (jurorStatus === 'Deferred') {
      return 'Deferral granted';
    }

    return jurorStatus;
  };

  module.exports.dateDifference = function(date1, date2, timeUnit) {
    var unit = timeUnit;

    if (!timeUnit) {
      unit = 'years';
    }
    return moment(date1, 'DD/MM/YYYY').diff(moment(date2, 'DD/MM/YYYY'), unit);
  };

  module.exports.isLateSummons = function(startDate) {
    return moment(startDate, 'YYYY-MM-DD').isBefore(new Date(), 'YYYY-MM-DD');
  };

  module.exports.getJurorStatus = function(statusInt) {
    switch (statusInt) {
    case 1:
      return 'Summoned';
    case 2:
      return 'Responded';
    case 3:
      return 'Panel';
    case 4:
      return 'Juror';
    case 5:
      return 'Excused';
    case 6:
      return 'Disqualified';
    case 7:
      return 'Deferred';
    case 8:
      return 'Reassigned';
    case 10:
      return 'Transferred';
    case 11:
      return 'Additional info';
    }
  };

  module.exports.padTimeForApi = function(time) {
    let [hour, minute] = time.split(':');

    if (hour.toString().length === 1) {
      hour = `0${hour}`;
    }
    if (minute.toString().length === 1) {
      minute = `0${minute}`;
    }

    return `${hour}:${minute}`;
  };

  module.exports.buildMovementProblems = function(data, sessionDetails) {
    if (data.unavailableForMove.length){
      let unavailableReasons = {ageIneligible: [], invalidStatus: [], noActiveRecord: []};
      const reasons = data.unavailableForMove.reduce((accumulator, currentValue) => {
        let jurorDetails = {
          jurorNumber: currentValue.jurorNumber,
          firstName: sessionDetails[currentValue.jurorNumber].firstName,
          lastName: sessionDetails[currentValue.jurorNumber].lastname,
        };

        if (currentValue.failureReason.includes('maximum age')){
          accumulator.ageIneligible.push(jurorDetails);
        } else if (currentValue.failureReason.includes('active record')){
          accumulator.noActiveRecord.push(jurorDetails);
        } else if (currentValue.failureReason.includes('Invalid Status')){
          jurorDetails.status = currentValue.failureReason.slice(currentValue.failureReason.indexOf(':') + 2);
          accumulator.invalidStatus.push(jurorDetails);
        }
        return accumulator;
      }
        , unavailableReasons);

      return reasons;
    }
  };

  module.exports.splitPostCode = (postcode) => {
    const digit = postcode.match(/\d/g).pop();
    const index = postcode.lastIndexOf(digit);
    const part = postcode.slice(0, index);

    return part.trim();
  };

})();
