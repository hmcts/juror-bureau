
(function() {
  'use strict';

  const _ = require('lodash');
  const crypto = require('crypto');
  const transformPoolType = require('../components/filters').transformPoolType;
  const { dateFilter, capitalizeFully, makeDate } = require('../components/filters');
  const moment = require('moment');
  const modUtils = require('../lib/mod-utils');
  const { LaunchDarkly } = require('./launchdarkly');
  const { isBureauUser } = require('../components/auth/user-type');

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
    let match = false;
    let courtCode;

    console.log('Initial payload:', body);

    courtCode = body.courtNameOrLocation.toString().match(/\d+/g);

    console.log('Matched court code:', courtCode);

    return new Promise(function(resolve, reject) {
      courts.forEach(function(court) {
        if (parseInt(court.locationCode) === parseInt(courtCode[0])) {

          match = true;
          if (court.attendanceTime){
            court.attendanceTime = court.attendanceTime.match(/[\d:]+/g)[0] || null;
          }
          resolve(court);
        }
      });
      if (!match) {

        console.log('Did not match court code:', courtCode);

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
          return (pool.numberRequested !== undefined) ? pool.numberRequested : pool.jurorsRequested;
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

  module.exports.transformCoETrialsList = function(trials) {
    const list = [];

    trials.forEach(function(trial) {
      list.push(
        [
          {
            html:
              '<div class="govuk-radios govuk-radios--small" data-module="govuk-radios">' +
                '<div class="govuk-radios__item">' +
                  '<input class="govuk-radios__input" id="' + trial.case_number + '" name="exemptionCaseNumber" ' +
                    'type="radio" value="' + trial.case_number + '">' +
                  '<label class="govuk-label govuk-radios__label" for="' + trial.case_number + '">' + trial.case_number + '</label>' +
                '</div>' +
              '</div>',
            attributes: {
              'data-sort-value': trial.case_number,
            },
          },
          {
            text: trial.parties,
            attributes: {
              'data-sort-value': trial.parties,
            },
            classes: 'mod-middle-align',
          },
          {
            text: capitalizeFully(trial.judge),
            attributes: {
              'data-sort-value': trial.judge,
            },
            classes: 'mod-middle-align',
          },
          {
            text: dateFilter(trial.start_date, 'YYYY,MM,DD', 'ddd DD MMM YYYY'),
            attributes: {
              'data-sort-value': makeDate(trial.start_date),
            },
            classes: 'mod-middle-align',
          },
          {
            text: trial.end_date ? dateFilter(trial.end_date, 'YYYY,MM,DD', 'ddd DD MMM YYYY') : '-',
            attributes: {
              'data-sort-value': trial.end_date ? trial.end_date : '-',
            },
            classes: 'mod-middle-align',
          },
        ]);
    });
    return list;
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

  module.exports.transformUnpaidAttendanceList = (unpaidAttendance, sortBy, sortOrder, locCode) => {
    const order = sortOrder || 'descending';
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
        id: 'firstName',
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
        id: 'totalInDraft',
        value: 'Total in draft',
        sort: sortBy === 'totalInDraft' ? order : 'none',
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
            unpaid.juror_number + '/expenses" class="govuk-link">' + unpaid.juror_number + '</a>',
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
          text: '£' + parseFloat(unpaid.total_unapproved).toFixed(2),
          attributes: {
            'data-sort-value': unpaid.total_unapproved,
          },
        },
        {
          html: '<a href="/juror-management/unpaid-attendance/expense-record/' +
            unpaid.juror_number + '/' + locCode + '/draft" class="govuk-link">' + 'View expenses' + '</a>',
          attributes: {
            'data-sort-value': unpaid.total_unapproved,
          },
        }
      );

      table.rows.push(item);
    });
    return table;
  };

  module.exports.transformCompletedJurorsList = (completedJurors, sortBy, sortOrder, checkedJurors) => {
    const order = sortOrder || 'ascending';
    const table = {
      head: [{
        id: 'jurorNumber',
        value: 'Juror Number',
        sort: sortBy === 'jurorNumber' ? order : 'none',
        sortable: true,
      },
      {
        id: 'firstName',
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
        id: 'postcode',
        value: 'Postcode',
        sort: sortBy === 'postcode' ? order : 'none',
        sortable: true,
      },
      {
        id: 'completionDate',
        value: 'Completion date',
        sort: !sortBy || sortBy === 'completionDate' ? order : 'none',
        sortable: true,
      }],
      rows: [],
    };

    completedJurors.forEach((juror) => {
      let item = [];
      let checked = checkedJurors.some(j => j.juror_number === juror.juror_number) ? 'checked' : '';

      item.push(
        {
          html: '<div class="govuk-checkboxes__item govuk-checkboxes--small moj-multi-select__checkbox">'
            + '<input type="checkbox" class="govuk-checkboxes__input select-check juror-select-check" id="select-'
            + juror.juror_number +'" '
            + 'name="selectedJurors"' + checked + ' value="' + juror.juror_number + '">'
            + '<label class="govuk-label govuk-checkboxes__label" for="select-'+ juror.juror_number +'">'
            + '<span class="govuk-visually-hidden">Select '+ juror.juror_number +'</span> </label> </div>',
          attributes: {
            'data-sort-value': juror.juror_number,
          },
          classes: 'mod-middle-align',
        },
        {
          html: '<a href="/juror-management/record/' +
            juror.juror_number + '/finance" class="govuk-link mod-middle-align">' + juror.juror_number + '</a>',
          attributes: {
            'data-sort-value': juror.juror_number,
          },
          classes: 'mod-middle-align',
        },
        {
          text: capitalizeFully(juror.first_name),
          attributes: {
            'data-sort-value': juror.first_name,
          },
          classes: 'mod-middle-align',
        },
        {
          text: capitalizeFully(juror.last_name),
          attributes: {
            'data-sort-value': juror.last_name,
          },
          classes: 'mod-middle-align',
        },
        {
          text: juror.postcode,
          attributes: {
            'data-sort-value': juror.postcode,
          },
          classes: 'mod-middle-align',
        },
        {
          text: dateFilter(juror.completion_date, null, 'ddd DD MMM YYYY'),
          attributes: {
            'data-sort-value': juror.completion_date,
          },
          classes: 'mod-middle-align',
        },
      );

      table.rows.push(item);
    });
    return table;
  };

  module.exports.transformRadioSelectTrialsList = (trials, sortBy, sortOrder) => {
    const table = {
        head: [],
        rows: [],
      }
      , order = sortOrder || 'ascending';

    table.head.push(
      {
        id: 'trialNumber',
        value: 'Trial number',
        sort: sortBy === 'trialNumber' ? order : 'none',
        classes: 'govuk-!-padding-left-6',
      },
      {
        id: 'names',
        value: 'Names',
        sort: sortBy === 'names' ? order : 'none',
      },
      {
        id: 'trialType',
        value: 'Trial type',
        sort: sortBy === 'trialType' ? order : 'none',
      },
      {
        id: 'courtName',
        value: 'Court',
        sort: sortBy === 'courtName' ? order : 'none',
      },
      {
        id: 'courtroom',
        value: 'Courtroom',
        sort: sortBy === 'courtroom' ? order : 'none',
      },
      {
        id: 'judge',
        value: 'Judge',
        sort: sortBy === 'judge' ? order : 'none',
      },
      {
        id: 'startDate',
        value: 'Start date',
        sort: sortBy === 'startDate' ? order : 'none',
      },
    );

    trials.forEach(function(trial) {
      const item = [];

      item.push(
        {
          html:
            '<div class="govuk-radios govuk-radios--small" data-module="govuk-radios">' +
              '<div class="govuk-radios__item">' +
                '<input class="govuk-radios__input" id="' + trial.trialNumber + '" name="selectedTrial" ' +
                  'type="radio" value="' + trial.trialNumber + '">' +
                '<label class="govuk-label govuk-radios__label">' +
                  '<a href="/trial-management/trials/' + trial.trialNumber + '/'
                  + trial.courtLocation + '/detail'+ '" ' +
                  'class="govuk-link">' + trial.trialNumber + '</a></label>' +
              '</div>' +
            '</div>',
          attributes: {
            'data-sort-value': trial.trialNumber,
          },
        },
        {
          text: trial.parties,
          attributes: {
            'data-sort-value': trial.parties,
          },
          classes: 'mod-middle-align',
        },
        {
          text: capitalizeFully(trial.trialType),
          attributes: {
            'data-sort-value': trial.trialType,
          },
          classes: 'mod-middle-align',
        },
        {
          text: capitalizeFully(trial.court),
          attributes: {
            'data-sort-value': trial.court,
          },
          classes: 'mod-middle-align',
        },
        {
          text: capitalizeFully(trial.courtroom),
          attributes: {
            'data-sort-value': trial.courtroom,
          },
          classes: 'mod-middle-align',
        },
        {
          text: capitalizeFully(trial.judge),
          attributes: {
            'data-sort-value': trial.judge,
          },
          classes: 'mod-middle-align',
        },
        {
          text: dateFilter(makeDate(trial.startDate), 'YYYY,MM,DD', 'ddd DD MMM YYYY'),
          attributes: {
            'data-sort-value': makeDate(trial.startDate),
          },
          classes: 'mod-middle-align',
        },
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
    PHONE_REGEX: /^[04(+][0-9\s-()]{8,14}$/,
    // eslint-disable-next-line max-len
    POSTCODE_REGEX: /^$|(([gG][iI][rR] {0,}0[aA]{2})|((([a-pr-uwyzA-PR-UWYZ][a-hk-yA-HK-Y]?[0-9][0-9]?)|(([a-pr-uwyzA-PR-UWYZ][0-9][a-hjkstuwA-HJKSTUW])|([a-pr-uwyzA-PR-UWYZ][a-hk-yA-HK-Y][0-9][abehmnprv-yABEHMNPRV-Y]))) {0,}[0-9][abd-hjlnp-uw-zABD-HJLNP-UW-Z]{2}))$/,
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

  module.exports.reasonsArrToObj = function(list) {
    let reasonsObject = {};

    list.forEach(reason => {
      if (reason.code === ' ' || reason.code === '') {
        reasonsObject[reason.code] = capitalizeFully(reason.description);
      } else {
        reasonsObject[reason.code] = reason.code + ' - ' + capitalizeFully(reason.description);
      }
      if (reasonsObject[reason.code].includes('Cjs')) {
        reasonsObject[reason.code] = reasonsObject[reason.code].replace('Cjs', 'CJS');
      }
      if (reasonsObject[reason.code].includes('(') && reasonsObject[reason.code].includes(')')) {
        const insideParen = reasonsObject[reason.code].substring(
          (reasonsObject[reason.code].indexOf('(') + 1), reasonsObject[reason.code].indexOf(')'));

        reasonsObject[reason.code] = reasonsObject[reason.code].replace(insideParen, insideParen.toLowerCase());
      }
    });

    return reasonsObject;
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
    const constants = modUtils.constants;

    var pageItems = []
      , totalPages = Math.ceil(totalResults / constants.PAGE_SIZE)
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

    if (pageItems.length > 1) {
      if (pageItems[1].number - pageItems[0].number > 1) {
        pageItems.splice(1, 0, { ellipsis: true });
      }

      if (pageItems[pageItems.length - 1].number - pageItems[pageItems.length - 2].number > 1) {
        pageItems.splice(-1, 0, { ellipsis: true });
      }
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

    if (status === 'Deferred') {
      return 'Deferral granted (' + description.toLowerCase() + ')';
    }

    if (status === 'Disqualified') {
      return 'Disqualified (' + description.toLowerCase() + ')';
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
    case 12:
      return 'Failed to attend';
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

  module.exports.convertTimeToHHMM = function(hour, minute, period) {
    let convertedHours = parseInt(hour, 10);

    if (period.toLowerCase() === 'pm' && convertedHours !== 12) {
      convertedHours += 12;
    } else if (period.toLowerCase() === 'am' && convertedHours === 12) {
      convertedHours = 0;
    }

    const formattedHours = convertedHours.toString().padStart(2, '0');
    const formattedMinutes = minute.toString().padStart(2, '0');

    return `${formattedHours}:${formattedMinutes}`;
  };

  module.exports.buildMovementProblems = function(data) {
    if (data.unavailableForMove.length){
      let unavailableReasons = {ageIneligible: [], invalidStatus: [], noActiveRecord: []};
      const reasons = data.unavailableForMove.reduce((accumulator, currentValue) => {
        let jurorDetails = {
          jurorNumber: currentValue.jurorNumber,
          firstName: currentValue.firstName || currentValue['first_name'],
          lastName: currentValue.lastname || currentValue['last_name'],
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

  module.exports.getLetterIdentifier= function(pageType){
    switch (pageType){
    case 'initial-summons':
      return 'Initial summons';
    case 'summons-reminders':
      return 'Summons reminders';
    case 'further-information':
      return 'Requests for further information';
    case 'confirmation':
      return 'Confirmation letters';
    case 'deferral-granted':
      return 'Deferral granted letters';
    case 'deferral-refused':
      return 'Deferral refused letters';
    case 'excusal-granted':
      return 'Excusal granted letters';
    case 'excusal-refused':
      return 'Excusal refused letters';
    case 'postponement':
      return 'Postponement letters';
    case 'withdrawal':
      return 'Withdrawal letters';
    case 'show-cause':
      return 'Show cause letters';
    case 'certificate-attendance':
      return 'Certificates of attendance';
    case 'failed-to-attend':
      return 'Failed to attend letters';
    default: return '';
    }
  };

  module.exports.LetterType = {
    'initial-summons': 'SUMMONS',
    'summons-reminders': 'SUMMONED_REMINDER',
    'further-information': 'INFORMATION',
    'confirmation': 'CONFIRMATION',
    'deferral-granted': 'DEFERRAL_GRANTED',
    'deferral-refused': 'DEFERRAL_REFUSED',
    'excusal-granted': 'EXCUSAL_GRANTED',
    'excusal-refused': 'EXCUSAL_REFUSED',
    'postponement': 'POSTPONED',
    'withdrawal': 'WITHDRAWAL',
    'show-cause': 'SHOW_CAUSE',
    'certificate-attendance': 'CERTIFICATE_OF_ATTENDANCE',
    'failed-to-attend': 'FAILED_TO_ATTEND',
  };

  module.exports.formatLetterDate = function(date, format, welsh) {
    const _moment = moment(date);

    if (welsh) {
      return _moment.locale('cy').format(format);
    }

    return _moment.format(format);
  };

  /**
  * Recursively calls the function to replace each key,
    if objects are contained within an array it replaces these too
    looping through until every object key is replaced using the string conversion function
  * @param {object} obj the object that you want to convert keys for
  * @param {function} getNewKey the string conversion function to change keys by
                      (i.e. filters (capitialise(),...) or lodash string conversion methods (_.toCamelCase(),...))
  * @returns {object} the given object with all its keys replaced using the supplied string conversion function
    @example
    * // returns {
          ID: 1,
          'A B C': { 'D E F': { GHI: 'ghi', JKL: 'jkl' } },
          MNO: [ { ONM: 'onm' }, { NOM: 'nom' } ],
          'P Q R': 'pqr',
          STU: { VWX: 'vwx', Y: { Z: 'z' } },
        }
    * modUtils.replaceAllObjKeys({
        id: 1,
        'a b C': { 'd e f': { ghi: 'ghi', jkL: 'jkl' } },
        mno: [ { onm: 'onm' }, { nOm: 'nom' } ],
        'p q r': 'pqr',
        Stu: { vwx: 'vwx', y: { Z: 'z' }},
      }, capitalise);
  */
  const replaceAllObjKeys = (obj, getNewKey) => {
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        replaceAllObjKeys(obj[i], getNewKey);
      }
    } else if (typeof obj === 'object') {
      // eslint-disable-next-line guard-for-in
      for (const key in obj) {
        const newKey = getNewKey(key);

        obj[newKey] = obj[key];
        if (key !== newKey) {
          delete obj[key];
        }
        replaceAllObjKeys(obj[newKey], getNewKey);
      }
    }

    return obj;
  };

  module.exports.replaceAllObjKeys = replaceAllObjKeys;

  const snakeToCamel = (item) => item.split('_').reduce((prev, curr) => prev + curr[0].toUpperCase() + curr.slice(1));

  const mapSnakeToCamel = (object) => replaceAllObjKeys(object, snakeToCamel);

  module.exports.snakeToCamel = snakeToCamel;
  module.exports.mapSnakeToCamel = mapSnakeToCamel;

  const camelToSnake = (item) => item.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();

  const mapCamelToSnake = (object) => replaceAllObjKeys(object, camelToSnake);

  module.exports.camelToSnake = camelToSnake;
  module.exports.mapCamelToSnake = mapCamelToSnake;

  module.exports.messagingCodes = {
    'reminder-to-attend': 'REMIND_TO_ATTEND',
    'failed-to-attend': 'FAILED_TO_ATTEND_COURT',
    'attendance-date-time-changed': 'ATTENDANCE_DATE_AND_TIME_CHANGED_COURT',
    'attendance-time-changed': 'ATTENDANCE_TIME_CHANGED_COURT',
    'complete-attended': 'COMPLETE_ATTENDED_COURT',
    'complete-not-needed': 'COMPLETE_NOT_NEEDED_COURT',
    'next-attendance-date': 'NEXT_ATTENDANCE_DATE_COURT',
    'on-call': 'ON_CALL_COURT',
    'please-contact': 'PLEASE_CONTACT_COURT',
    'delayed-start': 'DELAYED_START_COURT',
    'selection': 'SELECTION_COURT',
    'bad-weather': 'BAD_WEATHER_COURT',
    'check-inbox': 'CHECK_INBOX_COURT',
    'bring-lunch': 'BRING_LUNCH_COURT',
    'excused': 'EXCUSED_COURT',
    'sentencing-invite': 'SENTENCING_INVITE_COURT',
    'sentencing-date': 'SENTENCING_DATE_COURT',
  };

  module.exports.messagingTitles = {
    'reminder-to-attend': 'Reminder to attend',
    'failed-to-attend': 'Failed to attend',
    'attendance-date-time-changed': 'Attendance date and time changed',
    'attendance-time-changed': 'Attendance time changed',
    'complete-attended': 'Complete juror - attended',
    'complete-not-needed': 'Complete juror - not needed',
    'next-attendance-date': 'Next due at court date',
    'on-call': 'On call',
    'please-contact': 'Ask juror to contact court',
    'delayed-start': 'Delayed start',
    'selection': 'Selected for panel',
    'bad-weather': 'Bad weather',
    'check-inbox': 'Check email',
    'bring-lunch': 'Bring lunch',
    'excused': 'Excused',
    'sentencing-invite': 'Sentencing invite',
    'sentencing-date': 'Sentencing date',
    'export-contact-details': 'Export contact details',
  };

  module.exports.mapAdminToPoolRequestCourts = (adminCourts) => {
    modUtils.replaceAllObjKeys(adminCourts, _.camelCase);

    return adminCourts.map((court) => {
      return {
        locationName: court.courtName,
        locationCode: court.locCode,
        courtType: court.courtType,
      };
    });
  };

  module.exports.setPreviousWorkingDay = (date) => {
    const dayOfWeek = date.getDay();

    switch (dayOfWeek) {
    case 1:
      date.setDate(date.getDate() - 3);
      break;
    case 0:
      date.setDate(date.getDate() - 2);
      break;
    default:
      date.setDate(date.getDate() - 1);
      break;
    }

    return date;
  };

  module.exports.makeManualError = (source, message) => ({
    [source]: [{
      summary: message,
      details: message,
    }],
  });

  module.exports.getCurrentActiveCourt = (req, { poolNumber, currentOwner }) => {
    if (currentOwner === '400' && isBureauUser(req)) {
      return poolNumber.substring(0, 3);
    }

    if (currentOwner !== '400' && req.session.authentication.locCode === '400') {
      return currentOwner;
    }

    return req.session.authentication.locCode;
  };

  // Checks if any array (including nested arrays) are empty
  module.exports.checkIfArrayEmpty = (array) => {
    return Array.isArray(array) && (array.length == 0 || array.every(modUtils.checkIfArrayEmpty));
  }

})();
