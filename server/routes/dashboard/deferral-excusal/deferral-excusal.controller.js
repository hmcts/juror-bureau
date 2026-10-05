;(function () {
  'use strict';

  const { deferralExcusalStats } = require('../../../objects/deferral-excusal-dashboard');
  const excusalObj = require('../../../objects/excusal').object;
  const jwt = require('jsonwebtoken');
  const secretsConfig = require('config');
  const moment = require('moment');
  const validate = require('validate.js');

  const deferralExcusalOptions = ['All', 'Deferrals', 'Excusals'];
  const bureauCourtOptions = ['All', 'Bureau', 'Court'];
  const dashboardData = {
    deferralsTotal: 0,
  };
  const dateSelectionTypes = {
    calendarYear: 'CY',
    financialYear: 'FY',
    userDefined: 'UD',
  };
  const dataStartYear = 2015;

  module.exports.index = (app) => async (req, res) => {
    let jwtToken;
    let apiUserObj;
    let excusalCodes;
    let errorMsg = null;

    const displayPage = () => {
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
        errors: errorMsg,
      });
    };

    // Clear session data
    delete req.session.searchResponse;
    delete req.session.formFields;
    delete req.session.errors;
    delete req.session.nav;
    delete req.session.dashboardDates;
    delete req.session.formFields;


    // Init calendar year list
    if (!req.session.calendarYears) {
      req.session.calendarYears = getCalendarYears();
    }

    // Init financial year list
    if (!req.session.financialYears) {
      req.session.financialYears = getFinancialYears();
    }

    if (!req.session.deferralExcusalSelection) {
      req.session.deferralExcusalSelection = deferralExcusalOptions[0];
    }

    if (!req.session.bureauCourtSelection) {
      req.session.bureauCourtSelection = bureauCourtOptions[0];
    }

    if (!req.session.reasonsList) {
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
          courts: [],
        },
      };

      // Create JWT
      jwtToken = jwt.sign(
        apiUserObj,
        secretsConfig.get('secrets.juror.bureau-jwtKey'),
        { expiresIn: secretsConfig.get('secrets.juror.bureau-jwtTTL') },
      );

      try {
        const response = await excusalObj.get(jwtToken);

        try {
          excusalCodes = response;

          for (let index = 0; index < excusalCodes.length; index++) {
            excusalCodes[index].description = titleCase(excusalCodes[index].description);
            excusalCodes[index].keyValue = excusalCodes[index].excusalCode + ':' + excusalCodes[index].description;
          }

          req.session.reasonsList = excusalCodes;

          displayPage();
        } catch (err) {
          app.logger.crit('Failed to prepare deferral and excusal reasons', err);
          displayPage();
        }
      } catch (err) {
        app.logger.crit('Failed to retrieve deferral and excusal reasons', response);
        errorMsg = response;
        displayPage();
      }
    } else {
      displayPage();
    }
  };

  module.exports.getData = (app) => (req, res) => {
    let validatorResult;
    let apiUserObj;
    let jwtToken;
    let apiParams;
    let selectDeferral;
    let selectExcusal;
    let selectBureau;
    let selectCourt;
    let dashboardDates = {};
    let dateSelectionType = dateSelectionTypes.userDefined;
    let dateSelectionYear;

    const successCB = function (response) {
      let parsedData;

      dashboardData.weekLabels = getWeekLabelsFromData(
        dateSelectionType,
        dateSelectionYear,
        response.deferralExcusalValues,
      );

      parsedData = parseDashboardData(
        response.deferralExcusalValues.deferralStats,
        response.deferralExcusalValues.excusalStats,
        dashboardData.weekLabels,
        req.session.deferralExcusalSelection,
        req.session.bureauCourtSelection,
        req.session.selectedReasons,
        req.session.reasonsList,
        dateSelectionType,
        dateSelectionYear,
      );

      dashboardData.deferTotals = JSON.stringify(parsedData.deferralExcusalTotals);
      dashboardData.chartData = JSON.stringify(parsedData.chartDatasets);

      // set the date range description for the chart title depending on the data selection type
      // for calendar year and financial year selections, show the from/to dates
      // for user defined date ranges show the from/to weeks
      if (dateSelectionType === dateSelectionTypes.userDefined) {
        dashboardData.dateRange =
          'Week ' + dashboardDates.startYearWeek + ' to Week ' + dashboardDates.endYearWeek;
      } else {
        dashboardData.dateRange =
          moment(dashboardDates.startDate, 'DD/MM/YYYY').format('DD/MM/YYYY') +
          ' to ' +
          moment(dashboardDates.endDate, 'DD/MM/YYYY').format('DD/MM/YYYY');
      }

      return res.render('./dashboard/deferral-excusal.njk', {
        dashboardData: dashboardData,
        dashboardDates: dashboardDates,
        financialYears: req.session.financialYears,
        calendarYears: req.session.calendarYears,
        reasonsList: req.session.reasonsList,
        selectedReasons: req.session.selectedReasons,
        deferralExcusalOptions: deferralExcusalOptions,
        deferralExcusalSelection: req.session.deferralExcusalSelection,
        bureauCourtOptions: bureauCourtOptions,
        bureauCourtSelection: req.session.bureauCourtSelection,
        deferralTotal: parsedData.deferralTotal,
        excusalTotal: parsedData.excusalTotal,
        deferralExcusalCombinedTotal: parsedData.deferralExcusalCombinedTotal,
        errors: null,
      });

    };

    const failureCB = function (response) {
      app.logger.crit('Failed to retrieve deferral and excusal dashboard data', response);

      return res.render('./dashboard/deferral-excusal.njk', {
        dashboardData: null,
        dashboardDates: dashboardDates,
        financialYears: req.session.financialYears,
        calendarYears: req.session.calendarYears,
        reasonsList: req.session.reasonsList,
        selectedReasons: req.session.selectedReasons,
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
        },
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
    };

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
        selectedReasons: req.session.selectedReasons,
        deferralExcusalOptions: deferralExcusalOptions,
        deferralExcusalSelection: req.session.deferralExcusalSelection,
        bureauCourtOptions: bureauCourtOptions,
        bureauCourtSelection: req.session.bureauCourtSelection,

        errors: {
          message: '',
          count: typeof req.session.errors !== 'undefined' ? Object.keys(req.session.errors).length : 0,
          items: req.session.errors,
        },
      });

    }

    // Determine the date selection type from dates selected

    dashboardDates.startDateMoment = moment(dashboardDates.startDate, 'DD/MM/YYYY');
    dashboardDates.endDateMoment = moment(dashboardDates.endDate, 'DD/MM/YYYY');

    dashboardDates.startDateYear = dashboardDates.startDateMoment.year();
    dashboardDates.startDateMonth = dashboardDates.startDateMoment.month() + 1;
    dashboardDates.startDateDay = dashboardDates.startDateMoment.date();

    dashboardDates.endDateYear = dashboardDates.endDateMoment.year();
    dashboardDates.endDateMonth = dashboardDates.endDateMoment.month() + 1;
    dashboardDates.endDateDay = dashboardDates.endDateMoment.date();

    dashboardDates.startYearWeek = getWeekOfYear(dashboardDates.startDate);
    dashboardDates.endYearWeek = getWeekOfYear(dashboardDates.endDate);

    dateSelectionType = dateSelectionTypes.userDefined;
    dateSelectionYear = '';

    if (
      (dashboardDates.startDateDay === 1) &&
      (dashboardDates.endDateDay === 31) &&
      (dashboardDates.startDateMonth === 1) &&
      (dashboardDates.endDateMonth === 12) &&
      (dashboardDates.startDateYear === dashboardDates.endDateYear)) {
      dateSelectionType = dateSelectionTypes.calendarYear;
      dateSelectionYear = dashboardDates.startDateYear;
    } else if (
      (dashboardDates.startDateDay === 1) &&
      (dashboardDates.startDateMonth === 4) &&
      (dashboardDates.endDateDay === 31) &&
      (dashboardDates.endDateMonth === 3) &&
      (dashboardDates.endDateYear === dashboardDates.startDateYear + 1)) {
      dateSelectionType = dateSelectionTypes.financialYear;
      dateSelectionYear =
        dashboardDates.startDateMoment.format('YYYY') + '/' + dashboardDates.endDateMoment.format('YY');
    } else {
      dateSelectionType = dateSelectionTypes.userDefined;
      dateSelectionYear = null;
    }

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
        courts: [],
      },
    };

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
      court: selectCourt,
    };

    // Clear session data
    delete req.session.formFields;
    delete req.session.errors;

    // Create JWT
    jwtToken = jwt.sign(
      apiUserObj,
      secretsConfig.get('secrets.juror.bureau-jwtKey'),
      { expiresIn: secretsConfig.get('secrets.juror.bureau-jwtTTL') },
    );

    deferralExcusalStats
      .post(jwtToken, apiParams)
      .then(successCB)
      .catch(failureCB);
  };

  function getCalendarYears () {
    const calYears = [];
    const startYear = dataStartYear;
    const currentYear = moment().year();

    for (let year = startYear; year <= currentYear; year++) {
      calYears.push(year);
    }

    return calYears;

  }

  function getFinancialYears () {
    const finYears = [];
    const startYear = dataStartYear;
    const currentYear = moment().year();

    for (let year = startYear; year <= currentYear; year++) {
      finYears.push(year + '/' + (year + 1).toString().substring(2, 4));
    }

    return finYears;

  }

  function getWeekOfYear (dateValue) {
    let weekVal;
    const yearVal = moment(dateValue, 'DD/MM/YYYY').isoWeekYear();

    weekVal = moment(dateValue, 'DD/MM/YYYY').isoWeek();
    weekVal = ('' + weekVal).padStart(2, '0');

    return yearVal + '/' + weekVal;
  }

  function titleCase (sourceStr) {
    const str = sourceStr.toLowerCase().split(' ');

    for (let i = 0; i < str.length; i++) {
      str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
    }
    return str.join(' ');
  }

  function getRandomInt (minVal, maxVal) {
    return Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
  }

  function getWeekLabelsFromData (selectionType, selectionYear, resultData) {
    let statsData = [];
    const arrValues = [];

    if (resultData.deferralStats !== null) {
      statsData = statsData.concat(resultData.deferralStats);
    }
    if (resultData.excusalStats !== null) {
      statsData = statsData.concat(resultData.excusalStats);
    }

    for (let index = 0; index < statsData.length; index++) {
      const weekLabel = statsData[index].week;

      if (selectionType === dateSelectionTypes.userDefined) {
        arrValues.push(weekLabel);
      } else if (
        selectionType === dateSelectionTypes.calendarYear &&
        String(statsData[index].calendarYear) === String(selectionYear)
      ) {
        arrValues.push(weekLabel);
      } else if (
        selectionType === dateSelectionTypes.financialYear &&
        String(statsData[index].financialYear) === String(selectionYear)
      ) {
        arrValues.push(weekLabel);
      }
    }

    return Array.from(new Set(arrValues)).sort();
  }

  function parseDashboardData (
    deferralStats,
    excusalStats,
    weekLabels,
    deferralExcusalSelection,
    bureauCourtSelection,
    deferralExcusalReasons,
    reasonsList,
    selectionType,
    selectionYear,
  ) {
    let statsData = [];
    const deferralExcusalTotals = [];
    const weekCount = weekLabels.length;
    let deferralTotal = 0;
    let excusalTotal = 0;
    let deferralExcusalCombinedTotal = 0;
    let weekIndex = 0;
    let processDeferrals = false;
    let processExcusals = false;
    let processBureau = false;
    let processCourt = false;
    const arrReasonCode = [];
    const arrReasonDesc = [];
    const arrReasonTotal = [];
    const arrReasonWeeks = [];
    let selectedReasons = [];
    const chartDatasets = [];

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


    if (deferralStats != null && processDeferrals) {
      processDeferrals = true;
    } else {
      processDeferrals = false;
    }
    if (excusalStats != null && processExcusals) {
      processExcusals = true;
    } else {
      processExcusals = false;
    }


    if (processDeferrals) {
      for (let index = 0; index < deferralStats.length; index++) {
        deferralStats[index].defExc = 'D';
      }
      statsData = statsData.concat(deferralStats);
    }

    if (processExcusals) {
      for (let index = 0; index < excusalStats.length; index++) {
        excusalStats[index].defExc = 'E';
      }
      statsData = statsData.concat(excusalStats);
    }

    // Initialise arrays to store parsed data indexed by reason code
    if (deferralExcusalReasons) {
      if (Array.isArray(deferralExcusalReasons)) {
        selectedReasons = deferralExcusalReasons;
      } else {
        selectedReasons.push(deferralExcusalReasons);
      }
      for (let index = 0; index < selectedReasons.length; index++) {
        const exCode = selectedReasons[index].split(':')[0];
        const exDesc = selectedReasons[index].split(':')[1];
        arrReasonCode.push(exCode);
        arrReasonDesc.push(exDesc);
        arrReasonTotal.push(0);

        const arrReasonWeekTotal = [];
        for (weekIndex = 0; weekIndex < weekLabels.length; weekIndex++) {
          arrReasonWeekTotal.push(0);
        }
        arrReasonWeeks.push(arrReasonWeekTotal);

      }
    }

    for (let index = 0; index < weekCount; index++) {
      deferralExcusalTotals.push(0);
    }

    if (processDeferrals || processExcusals) {

      // process the raw stats data
      for (let index = 0; index < statsData.length; index++) {

        let includeRecord = false;

        const bureauOrCourt = statsData[index].bureauOrCourt;
        if (bureauOrCourt === 'Bureau' && processBureau === true) {
          includeRecord = true;
        }
        if (bureauOrCourt === 'Court' && processCourt === true) {
          includeRecord = true;
        }

        weekIndex = weekLabels.indexOf(statsData[index].week);
        if (weekIndex < 0) {
          includeRecord = false;
        }

        if (
          selectionType === dateSelectionTypes.calendarYear &&
          String(statsData[index].calendarYear) !== String(selectionYear)
        ) {
          includeRecord = false;
        } else if (
          selectionType === dateSelectionTypes.financialYear &&
          String(statsData[index].financialYear) !== String(selectionYear)
        ) {
          includeRecord = false;
        }

        if (includeRecord === true) {
          const defExcCount = statsData[index].excusalCount;
          deferralExcusalTotals[weekIndex] += defExcCount;

          if (statsData[index].defExc === 'D') {
            deferralTotal += defExcCount;
          }

          if (statsData[index].defExc === 'E') {
            excusalTotal += defExcCount;
          }

          deferralExcusalCombinedTotal += defExcCount;

          const exCode = statsData[index].execCode;
          const reasonIndex = arrReasonCode.indexOf(exCode);

          if (reasonIndex>=0) {
            //accumulate  total for reason
            arrReasonTotal[reasonIndex] += statsData[index].excusalCount;

            //accumulate  total for reason/week
            arrReasonWeeks[reasonIndex][weekIndex] += statsData[index].excusalCount;
          }

        }

      } //end stats loop

      // restruture data for charts
      for (let index = 0; index < selectedReasons.length; index++) {
        const chartDataset = {
          dsLabel: arrReasonDesc[index] + ' (' + arrReasonTotal[index] + ')',
          dsValues: arrReasonWeeks[index],
          dsRGB: getChartColour(arrReasonCode[index], reasonsList),
        };

        chartDatasets.push(chartDataset);
      } // end for

    }

    return {
      deferralExcusalTotals: deferralExcusalTotals,
      chartDatasets: chartDatasets,
      deferralTotal: deferralTotal,
      excusalTotal: excusalTotal,
      deferralExcusalCombinedTotal: deferralExcusalCombinedTotal,
    };

  }

  function getChartColour (reasonCode, reasonsList) {

    let reasonIndex = -1;
    let colourVal;
    const reasonColours = [
      '#1D70B8', '#D4351C', '#FAC800', '#00703C', '#6f72AF',
      '#912b88', '#D53880', '#F499BE', '#F47738', '#B58840',
      '#85994B', '#28A197', '#B1B4B6', '#2080CD', '#FAC800',
      '#0096FA', '#FA00FA', '#FA9000', '#AAAAAA', '#AFBFAF',
    ];

    for (let index = 0; index < reasonsList.length; index++) {
      if (reasonsList[index].excusalCode === reasonCode) {
        reasonIndex = index;
      }
    }

    if (reasonIndex >= 0) {
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
