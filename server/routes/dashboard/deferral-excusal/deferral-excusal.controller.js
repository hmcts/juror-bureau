;(function(){
  'use strict';

  var {deferralExcusalStats} = require('../../../objects/deferral-excusal-dashboard')
    , excusalObj = require('../../../objects/excusal').object
    , jwt = require('jsonwebtoken')
    , secretsConfig = require('config')
    , moment = require('moment')
    , validate = require('validate.js')

    , deferralExcusalOptions = ['All', 'Deferrals', 'Excusals']
    , bureauCourtOptions = ['All', 'Bureau', 'Court']

    , dashboardData = {
      deferralsTotal: 0
    }
    , dateSelectionTypes = {
      calendarYear: 'CY',
      financialYear: 'FY',
      userDefined: 'UD'
    }
    , dataStartYear = 2015

  module.exports.index = function(app) {
    return function(req, res) {
      var jwtToken
        , apiUserObj
        , excusalCodes
        , errorMsg = null
        , dashboardDates = {}

        , displayPage = function(){
          return res.render('./dashboard/deferral-excusal.njk', {
            dashboardData: null,
            dashboardStartDate: '',
            dashboardEndDate: '',
            financialYears: req.session.financialYears,
            calendarYears: req.session.calendarYears,
            reasonsList: req.session.reasonsList,
            selectedReasons: null,
            deferralExcusalOptions: deferralExcusalOptions,
            deferralExcusalSelection: 'All',
            bureauCourtOptions: bureauCourtOptions,
            bureauCourtSelection: 'All',
            startDate: null,
            endDate: null,
            errors: errorMsg
          });
        }

        , reasonsSuccessCB = function(response){

          var index;

          try {
            excusalCodes = response;

            for (index=0; index < excusalCodes.length; index++){
              excusalCodes[index].description = titleCase(excusalCodes[index].description);
              excusalCodes[index].keyValue = excusalCodes[index].excusalCode + ':' + excusalCodes[index].description;
            }

            req.session.reasonsList = excusalCodes;

            displayPage();
          } catch (err){

            displayPage();

          }
        }

        , reasonsErrorCB = function(response){
          console.log('Deferral dashboard - error getting excuse codes:')
          console.log(response);
          errorMsg = response; //'Error retrieving excuse codes';
          displayPage();
        }


      // Clear session data
      delete req.session.searchResponse;
      delete req.session.formFields;
      delete req.session.errors;
      delete req.session.nav;
      delete req.session.dashboardDates;
      delete req.session.formFields;


      // Init calendar year list
      if (!req.session.calendarYears){
        req.session.calendarYears = getCalendarYears();
      }

      // Init financial year list
      if (!req.session.financialYears){
        req.session.financialYears = getFinancialYears();
      }

      if (!req.session.deferralExcusalSelection){
        req.session.deferralExcusalSelection = deferralExcusalOptions[0];
      }

      if (!req.session.bureauCourtSelection){
        req.session.bureauCourtSelection = bureauCourtOptions[0];
      }

      if (!req.session.reasonsList){
        // Create user object for JWT
        apiUserObj = {
          login: 'AUTO',
          userLevel: '1',
          daysToExpire: 6,
          passwordWarning: true,
          staff: {
            name: 'AUTO',
            rank: -1,
            active: 1,
            courts: []
          }
        }

        // Create JWT
        jwtToken = jwt.sign(apiUserObj, secretsConfig.get('secrets.juror.bureau-jwtKey'), { expiresIn: secretsConfig.get('secrets.juror.bureau-jwtTTL') });

        console.log('Calling deferral-excusal API - excuse codes');

        excusalObj
          .get(req)
          .then(reasonsSuccessCB)
          .catch(reasonsErrorCB);

      } else {
        displayPage();
      }


    };
  };

  module.exports.getData = function(app) {
    return function(req, res) {

      var validatorResult,
        apiUserObj,
        jwtToken,
        apiParams,
        selectDeferral,
        selectExcusal,
        selectBureau,
        selectCourt,
        dashboardDates = {},
        dateSelectionType = dateSelectionTypes.userDefined,
        dateSelectionYear,

        successCB = function(response){
          var parsedData;

          //dashboardData.weekLabels = getWeekLabelsFromDates(dashboardDates.startDate, dashboardDates.endDate);
          dashboardData.weekLabels = getWeekLabelsFromData(dateSelectionType, dateSelectionYear, response.deferralExcusalValues);

          parsedData = parseDashboardData(response.deferralExcusalValues.deferralStats, response.deferralExcusalValues.excusalStats, dashboardData.weekLabels, req.session.deferralExcusalSelection, req.session.bureauCourtSelection, req.session.selectedReasons, req.session.reasonsList, dateSelectionType, dateSelectionYear);

          dashboardData.deferTotals = JSON.stringify(parsedData.deferralExcusalTotals);
          dashboardData.chartData = JSON.stringify(parsedData.chartDatasets);

          // set the date range description for the chart title depending on the data selection type
          // for calendar year and financial year selections, show the from/to dates
          // for user defined date ranges show the from/to weeks
          if (dateSelectionType === dateSelectionTypes.userDefined){
            dashboardData.dateRange = 'Week ' + dashboardDates.startYearWeek + ' to Week ' + dashboardDates.endYearWeek;
          } else {
            dashboardData.dateRange = moment(dashboardDates.startDate, 'YYYY-MM-DD').format('DD-MM-YYYY') + ' to ' + moment(dashboardDates.endDate, 'YYYY-MM-DD').format('DD-MM-YYYY');
          }

          return res.render('./dashboard/deferral-excusal.njk', {
            dashboardData: dashboardData,
            dashboardDates: dashboardDates,
            financialYears: req.session.financialYears,
            calendarYears: req.session.calendarYears,
            reasonsList: req.session.reasonsList,
            selectedReasons:  req.session.selectedReasons,
            deferralExcusalOptions: deferralExcusalOptions,
            deferralExcusalSelection: req.session.deferralExcusalSelection,
            bureauCourtOptions: bureauCourtOptions,
            bureauCourtSelection: req.session.bureauCourtSelection,
            deferralTotal: parsedData.deferralTotal,
            excusalTotal: parsedData.excusalTotal,
            deferralExcusalCombinedTotal: parsedData.deferralExcusalCombinedTotal,
            errors: null
          });

        },

        failureCB = function(response){
          console.log('Dashbaord API call failed: ');
          console.log(response);

          return res.render('./dashboard/deferral-excusal.njk', {
            dashboardData: null,
            dashboardDates: dashboardDates,
            financialYears: req.session.financialYears,
            calendarYears: req.session.calendarYears,
            reasonsList: req.session.reasonsList,
            selectedReasons:  req.session.selectedReasons,
            deferralExcusalOptions: deferralExcusalOptions,
            deferralExcusalSelection: req.session.deferralExcusalSelection,
            bureauCourtOptions: bureauCourtOptions,
            bureauCourtSelection: req.session.bureauCourtSelection,
            deferralTotal: 0,
            excusalTotal: 0,
            deferralExcusalCombinedTotal: 0,

            errors: {
              message: 'Error getting dashboard data',
              count: 1,
              items: null,
            }
          });

        };

      req.session.deferralExcusalSelection = req.body.deferralExcusal;
      req.session.bureauCourtSelection = req.body.bureauCourt;
      req.session.selectedReasons = req.body.chkReason;

      dashboardDates = {
        startDate: req.body.startDate,
        endDate: req.body.endDate,

        startDateMoment: null,
        startDateDay: null,
        startDateMonth: null,
        startDateYear: null,
        startYearWeek: null,

        endDateMoment: null,
        endDateDay: null,
        endDateMonth: null,
        endDateYear: null,
        endYearWeek: null,
      }

      // Validate form submission
      validatorResult = validate(req.body, require('../../../config/validation/dashboard-deferral-excusal.js')(req));
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.render('./dashboard/deferral-excusal.njk', {
          dashboardData: null,
          dashboardDates: dashboardDates,

          financialYears: req.session.financialYears,
          calendarYears: req.session.calendarYears,
          reasonsList: req.session.reasonsList,
          selectedReasons:  req.session.selectedReasons,
          deferralExcusalOptions: deferralExcusalOptions,
          deferralExcusalSelection: req.session.deferralExcusalSelection,
          bureauCourtOptions: bureauCourtOptions,
          bureauCourtSelection: req.session.bureauCourtSelection,

          errors: {
            message: '',
            count: typeof req.session.errors !== 'undefined' ? Object.keys(req.session.errors).length : 0,
            items: req.session.errors,
          }
        });

      }

      // Determine the date selection type from dates selected

      dashboardDates.startDateMoment = moment(dashboardDates.startDate, 'YYYY-MM-DD');
      dashboardDates.endDateMoment = moment(dashboardDates.endDate, 'YYYY-MM-DD');

      dashboardDates.startDateYear = dashboardDates.startDateMoment.year();
      dashboardDates.startDateMonth = dashboardDates.startDateMoment.month() + 1;
      dashboardDates.startDateDay = dashboardDates.startDateMoment.date();

      dashboardDates.endDateYear = dashboardDates.endDateMoment.year();
      dashboardDates.endDateMonth = dashboardDates.endDateMoment.month() + 1;
      dashboardDates.endDateDay = dashboardDates.endDateMoment.date();

      dashboardDates.startYearWeek = getWeekOfYear(dashboardDates.startDate),
      dashboardDates.endYearWeek = getWeekOfYear(dashboardDates.endDate),

      dateSelectionType = dateSelectionTypes.userDefined;
      dateSelectionYear = '';

      if (
        (dashboardDates.startDateDay === 1) &&
        (dashboardDates.endDateDay === 31) &&
        (dashboardDates.startDateMonth === 1) &&
        (dashboardDates.endDateMonth === 12) &&
        (dashboardDates.startDateYear === dashboardDates.endDateYear)){
        dateSelectionType = dateSelectionTypes.calendarYear;
        dateSelectionYear = dashboardDates.startDateYear;
      } else if (
        (dashboardDates.startDateDay === 1) &&
        (dashboardDates.startDateMonth === 4) &&
        (dashboardDates.endDateDay === 31) &&
        (dashboardDates.endDateMonth === 3) &&
        (dashboardDates.endDateYear === dashboardDates.startDateYear + 1)){
        dateSelectionType = dateSelectionTypes.financialYear;
        dateSelectionYear = dashboardDates.startDateMoment.format('YYYY') + '/' + dashboardDates.endDateMoment.format('YY');
      } else {
        dateSelectionType = dateSelectionTypes.userDefined;
        dateSelectionYear = null;
      }

      console.log('Date selection type: ', dateSelectionType);
      console.log('Date selection year: ', dateSelectionYear);


      // Create user object for JWT
      apiUserObj = {
        login: 'AUTO',
        userLevel: '1',
        daysToExpire: 6,
        passwordWarning: true,
        staff: {
          name: 'AUTO',
          rank: -1,
          active: 1,
          courts: []
        }
      }

      selectDeferral = 'N';
      selectExcusal = 'N';
      if (req.body.deferralExcusal === 'Deferrals' || req.body.deferralExcusal === 'All') {
        selectDeferral = 'Y';
      }
      if (req.body.deferralExcusal === 'Excusals' || req.body.deferralExcusal === 'All') {
        selectExcusal = 'Y';
      }

      selectBureau = 'N';
      selectCourt = 'N';
      if (req.body.bureauCourt === 'Bureau' || req.body.bureauCourt === 'All') {
        selectBureau = 'Y';
      }
      if (req.body.bureauCourt === 'Court' || req.body.bureauCourt === 'All') {
        selectCourt = 'Y';
      }

      apiParams = {
        startYearWeek: getWeekOfYear(dashboardDates.startDate),
        endYearWeek: getWeekOfYear(dashboardDates.endDate),
        deferral: selectDeferral,
        excusal: selectExcusal,
        bureau: selectBureau,
        court: selectCourt
      }

      // Clear session data
      delete req.session.formFields;
      delete req.session.errors;

      // Create JWT
      jwtToken = jwt.sign(apiUserObj, secretsConfig.get('secrets.juror.bureau-jwtKey'), { expiresIn: secretsConfig.get('secrets.juror.bureau-jwtTTL') });

      deferralExcusalStats
        .post(jwtToken, apiParams)
        .then(successCB)
        .catch(failureCB);


    };
  };

  function getCalendarYears(){

    var calYears = []
      , startYear = dataStartYear
      , currentYear = moment().year()
      , year

    for (year = startYear; year <= currentYear; year++){
      calYears.push(year);
    }

    return calYears;

  }

  function getFinancialYears(){

    var finYears = []
      , startYear = dataStartYear
      , currentYear = moment().year()
      , year = 0

    for (year = startYear; year <= currentYear; year++){
      finYears.push(year + '/' + (year + 1).toString().substring(2, 4));
    }

    return finYears;

  }

  function getWeekOfYear(dateValue){

    var weekVal
      , yearVal
      , returnVal;

    yearVal = moment(dateValue, 'YYYY-MM-DD').isoWeekYear();
    weekVal = moment(dateValue, 'YYYY-MM-DD').isoWeek();

    weekVal = ('' + weekVal).padStart(2, '0');

    returnVal = yearVal + '/' + weekVal;

    return returnVal;
  }

  function titleCase(sourceStr) {
    var i=0
      , str = sourceStr;

    str = str.toLowerCase().split(' ');
    for (i = 0; i < str.length; i++) {
      str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
    }
    return str.join(' ');
  }

  function getRandomInt(minVal, maxVal){
    return Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
  }

  function getWeekLabelsFromDates(startDate, endDate){

    // return array of year-week labels

    var momentDate
      , momentStart
      , momentEnd
      , weekLabel
      , arrValues = []
      , arrWeekLabels = [];

    momentStart = moment(startDate, 'YYYY-MM-DD');
    momentEnd = moment(endDate, 'YYYY-MM-DD');

    // iterate through each date in range building list of year-week labels
    // use ISO weeks to match database data
    for (momentDate = moment(momentStart); momentDate.isBefore(momentEnd); momentDate.add(1, 'days')) {
      weekLabel = momentDate.isoWeekYear() + '/' + ('' + momentDate.isoWeek()).padStart(2, '0');
      arrValues.push(weekLabel);
    }

    // get unique list of year-week labels
    arrWeekLabels = Array.from(new Set(arrValues));

    return arrWeekLabels;

  }

  function getWeekLabelsFromData(selectionType, selectionYear, resultData){

    // return array of year-week labels

    var weekLabel
      , statsData = []
      , arrValues = []
      , arrWeekLabels = []
      , index;

    if (resultData.deferralStats !== null){
      statsData = statsData.concat(resultData.deferralStats);
    }
    if (resultData.excusalStats !== null){
      statsData = statsData.concat(resultData.excusalStats);
    }

    for (index=0; index < statsData.length; index++){

      weekLabel = statsData[index].week;

      if (selectionType === dateSelectionTypes.userDefined){
        arrValues.push(weekLabel);
      } else if ((selectionType === dateSelectionTypes.calendarYear) && (statsData[index].calendarYear == selectionYear)){
        arrValues.push(weekLabel);
      } else if ((selectionType === dateSelectionTypes.financialYear) && (statsData[index].financialYear == selectionYear)){
        arrValues.push(weekLabel);
      }

    }

    // get unique list of year-week labels
    arrWeekLabels = Array.from(new Set(arrValues)).sort();

    return arrWeekLabels;

  }

  function parseDashboardData(deferralStats, excusalStats, weekLabels, deferralExcusalSelection, bureauCourtSelection, deferralExcusalReasons, reasonsList, selectionType, selectionYear){

    var parsedData
      , statsData = []
      , deferralExcusalTotals = []
      , weekCount = weekLabels.length
      , deferralCount = 0
      , excusalCount = 0
      , deferralTotal = 0
      , excusalTotal = 0
      , deferralExcusalCombinedTotal = 0
      , defExcCount = 0
      , weekIndex = 0
      , processDeferrals = false
      , processExcusals = false
      , processBureau = false
      , processCourt = false
      , bureauOrCourt
      , exCode
      , exDesc
      , arrReasonCode = []
      , arrReasonDesc = []
      , arrReasonTotal = []
      , arrReasonWeeks = []
      , arrReasonWeekTotal = []
      , reasonIndex
      , includeRecord
      , selectedReason
      , selectedReasons = []
      , chartDataset
      , chartDatasets = []
      , index = 0;

    if (deferralExcusalSelection === 'Deferrals' || deferralExcusalSelection === 'All') {
      processDeferrals = true;
    }
    if (deferralExcusalSelection === 'Excusals' || deferralExcusalSelection === 'All') {
      processExcusals = true;
    }

    if (bureauCourtSelection === 'Bureau' || bureauCourtSelection === 'All') {
      processBureau = true;
    }
    if (bureauCourtSelection === 'Court' || bureauCourtSelection === 'All') {
      processCourt = true;
    }


    if (deferralStats != null && processDeferrals){
      deferralCount = deferralStats.length;
      processDeferrals = true;
    } else {
      deferralCount = 0;
      processDeferrals = false;
    }
    if (excusalStats != null && processExcusals){
      excusalCount = excusalStats.length;
      processExcusals = true;
    } else {
      excusalCount = 0;
      processExcusals = false;
    }


    if (processDeferrals){
      for (index=0; index<deferralStats.length; index++){
        deferralStats[index].defExc = 'D'
      }
      statsData = statsData.concat(deferralStats);
    }

    if (processExcusals){
      for (index=0; index<excusalStats.length; index++){
        excusalStats[index].defExc = 'E'
      }
      statsData = statsData.concat(excusalStats);
    }

    // Initialise arrays to store parsed data indexed by reason code
    if (deferralExcusalReasons){
      if (Array.isArray(deferralExcusalReasons)){
        selectedReasons = deferralExcusalReasons;
      } else {
        selectedReason = deferralExcusalReasons;
        selectedReasons.push(selectedReason);
      }
      for (index=0; index<selectedReasons.length; index++){
        exCode = selectedReasons[index].split(':')[0];
        exDesc = selectedReasons[index].split(':')[1];
        arrReasonCode.push(exCode);
        arrReasonDesc.push(exDesc);
        arrReasonTotal.push(0);

        arrReasonWeekTotal = [];
        for (weekIndex=0; weekIndex<weekLabels.length; weekIndex++){
          arrReasonWeekTotal.push(0);
        }
        arrReasonWeeks.push(arrReasonWeekTotal);

      }
    }

    console.log('deferral count: ' + deferralCount);
    console.log('excusal count: ' + excusalCount);

    for (index=0; index<weekCount; index++){
      deferralExcusalTotals.push(0);
    }

    if (processDeferrals || processExcusals){

      // process the raw stats data
      for (index=0; index < statsData.length; index++){

        includeRecord = false;

        bureauOrCourt = statsData[index].bureauOrCourt;
        if (bureauOrCourt === 'Bureau' && processBureau === true){
          includeRecord = true;
        }
        if (bureauOrCourt === 'Court' && processCourt === true){
          includeRecord = true;
        }

        weekIndex = weekLabels.indexOf(statsData[index].week);
        if (weekIndex < 0){
          includeRecord = false;
        }

        if ((selectionType === dateSelectionTypes.calendarYear) && (statsData[index].calendarYear != selectionYear)){
          includeRecord = false;
        } else if ((selectionType === dateSelectionTypes.financialYear) && (statsData[index].financialYear != selectionYear)){
          includeRecord = false;
        }

        if (includeRecord === true){
          defExcCount = statsData[index].excusalCount;
          deferralExcusalTotals[weekIndex] += defExcCount;

          if (statsData[index].defExc === 'D'){
            deferralTotal += defExcCount;
          }

          if (statsData[index].defExc === 'E'){
            excusalTotal += defExcCount;
          }

          deferralExcusalCombinedTotal += defExcCount;

          exCode = statsData[index].execCode;
          reasonIndex = arrReasonCode.indexOf(exCode);

          if (reasonIndex>=0){
            //accumulate  total for reason
            arrReasonTotal[reasonIndex] += statsData[index].excusalCount;

            //accumulate  total for reason/week
            arrReasonWeeks[reasonIndex][weekIndex] += statsData[index].excusalCount;
          }

        }

      } //end stats loop

      // restruture data for charts
      for (index=0; index<selectedReasons.length; index++){
        chartDataset = {
          dsLabel: arrReasonDesc[index] + ' (' + arrReasonTotal[index] + ')',
          dsValues: arrReasonWeeks[index],
          dsRGB: getChartColour(arrReasonCode[index], reasonsList)
        }

        chartDatasets.push(chartDataset);
      } // end for

    }

    parsedData = {
      deferralExcusalTotals: deferralExcusalTotals,
      chartDatasets: chartDatasets,
      deferralTotal: deferralTotal,
      excusalTotal: excusalTotal,
      deferralExcusalCombinedTotal: deferralExcusalCombinedTotal
    }

    return parsedData;

  }

  function getChartColour(reasonCode, reasonsList){

    var reasonIndex = -1
      , index = 0
      , colourVal
      , reasonColours = [
        '#1D70B8', '#D4351C', '#FAC800', '#00703C', '#6f72AF',
        '#912b88', '#D53880', '#F499BE', '#F47738', '#B58840',
        '#85994B', '#28A197', '#B1B4B6', '#2080CD', '#FAC800',
        '#0096FA', '#FA00FA', '#FA9000', '#AAAAAA', '#AFBFAF'
      ]

    for (index=0; index<reasonsList.length; index++){
      if (reasonsList[index].excusalCode === reasonCode){
        reasonIndex = index;
      }
    }

    if (reasonIndex >= 0){
      colourVal = reasonColours[reasonIndex];
    } else {
      //Unknown reason - generate a random colour
      colourVal = 'rgb(' +
        (100 + getRandomInt(0, 150)) + ',' +
        (100 + getRandomInt(0, 150)) + ',' +
        (100 + getRandomInt(0, 150)) + ')';
    }

    return colourVal;

  }

})();
