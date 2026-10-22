(() => {
  'use strict';

  const _ = require('lodash');
  const moment = require('moment');
  const { dateFilter, toSentenceCase } = require('../../components/filters');
  const { makeManualError } = require('../../lib/mod-utils');
  const { fetchCourtsDAO } = require('../../objects/index');
  const { digitalByDefaultDashboardDAO } = require('../../objects/digital-by-default-dashboard'); 
  const modUtils = require('../../lib/mod-utils');

  
  module.exports.getDashboard = app => async (req, res) => {
    const { localAuthorityFilter, status, sortBy, sortOrder } = req.query;

    const tmpErrors = _.clone(req.session.errors);
    const bannerMessage = _.clone(req.session.bannerMessage);
    let dashboardData = req.session.digitalByDefaultDashboardData;
    const dashboardFormData = req.session.digitalByDefaultDashboardForm || getDefaultDashboardFormData();

    req.session.digitalByDefaultDashboardForm = dashboardFormData;

    if (dashboardData) {
      delete req.session.digitalByDefaultDashboardData;
    } else if (!tmpErrors || Object.keys(tmpErrors).length === 0) {
      dashboardData = await fetchDashboardData(app, req, dashboardFormData);
    }

    // Last updated date is currently set to previous day - data updated by overnight job
    const dataUpdateMessage = "Last updated: " + moment().subtract(1, 'days').format('DD MMMM YYYY') + '. ';
    const dataShownMessage = "Data shown is for the last 30 days";


    // Clear session data for errors and banner messages to avoid persisting them across requests
    delete req.session.errors;
    delete req.session.bannerMessage;
    delete req.session.localAuthorities;

    app.logger.info('Fetched list of courts', {
      auth: req.session.authentication,
    });

    // cache the court list
    if (!req.session.dashboardCourtsList) {
      try {
        const courtList = await fetchCourtsDAO.get(req);
        if (courtList && courtList.courts) {
          req.session.dashboardCourtsList = courtList.courts;
        }
      } catch (err) {
        app.logger.crit('Failed to fetch courts list: ', {
          auth: req.session.authentication,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });
      }
    }

    const courtGroups = [
      {
        groupName: 'Group 1',
        locationCodes: ['419', '423', '431'],
      },
      {
        groupName: 'Group 2',
        locationCodes: ['415', '403', '443'],
      },
      {
        groupName: 'Group 3',
        locationCodes: ['411', '478', '441', '453'],
      },
    ].map(courtGroup => ({
      ...courtGroup,
      groupDescription: getGroupDescription(courtGroup.locationCodes),
    }));

    const flattenedDashboardData = parseAPIResponse(dashboardData?.apiResult);
    const totalResponsesChartData = getTotalResponsesChartData(flattenedDashboardData);
    const responseTypeChartData = getResponseTypeChartData(flattenedDashboardData);
    const responseTimesChartData = getResponseTimesChartData(flattenedDashboardData);
    const ageDemographicsChartData = getAgeDemographicsChartData(flattenedDashboardData);
    
    const responseTypeTableData = getResponseTypeTableData(
      req,
      flattenedDashboardData, 
      req.session.digitalByDefaultDashboardForm.filterGroup,
      req.session.digitalByDefaultDashboardForm.dateRangeCompare
    );

    const responseTimeTableData = getResponseTimeTableData(
      req,
      flattenedDashboardData, 
      req.session.digitalByDefaultDashboardForm.filterGroup,
      req.session.digitalByDefaultDashboardForm.dateRangeCompare
    );

    const ageDemographicTableData = getAgeDemographicTableData(
      req,
      flattenedDashboardData, 
      req.session.digitalByDefaultDashboardForm.filterGroup,
      req.session.digitalByDefaultDashboardForm.dateRangeCompare
    );


    const displayDateRange = getDisplayDateRange(dashboardFormData);

    req.session.digitalByDefaultAgeDemographicTableData = ageDemographicTableData;
    req.session.digitalByDefaultResponseTimeTableData = responseTimeTableData;
    req.session.digitalByDefaultResponseRateTableData = responseTypeTableData;

    let group='all';

    return res.render('digital-by-default/dashboard.njk', {

      postRoute: app.namedRoutes.build('digital-by-default.dashboard.post'),
      responseRateCsvRoute: app.namedRoutes.build('digital-by-default.response-rate.csv'),
      responseTimeCsvRoute: app.namedRoutes.build('digital-by-default.response-time.csv'),
      ageDemographicCsvRoute: app.namedRoutes.build('digital-by-default.age-demographic.csv'),
      
      group: group || 'all',
      dataUpdateMessage,
      dataShownMessage,
      lastQuarterRangeDesc: getQuarterDates(1).rangeDesc,
      prevQuarterRangeDesc: getQuarterDates(2).rangeDesc,
      bannerMessage,
      courtGroups,
      dashboardFormData,
      dashboardData,
      displayDateRange,
      totalResponsesChartData,
      responseTypeChartData,
      responseTimesChartData,
      ageDemographicsChartData,
      responseTypeTableData: responseTypeTableData,
      responseTimeTableData: responseTimeTableData,
      ageDemographicTableData: ageDemographicTableData,
      errors: {
        title: 'Please check the form',
        count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
        items: tmpErrors,
      },
    });
  };

  module.exports.postDashboard = app => async (req, res) => {

    let filterGroup = req.body['select-filterGroup'];
    const timePeriodARadio = req.body['radioTimeRange-timePeriodA'];
    const timePeriodBRadio = req.body['radioTimeRange-timePeriodB'];
    let timePeriodA = timePeriodARadio === 'customDateRange' ? 'customRange' : req.body['select-timePeriodA'];
    let timePeriodB = null;
    let dateRangeCompare = req.body['dateRangeCompare'];
    
    const isDateRangeCompareSelected = dateRangeCompare === 'dateRangeCompare' || dateRangeCompare === 'on';
    if (isDateRangeCompareSelected) {
      timePeriodB = timePeriodBRadio === 'customDateRange' ? 'customRange' : req.body['select-timePeriodB'];
    }

    const formErrors = validateFormData(req.body);

    req.session.digitalByDefaultDashboardForm = {
      filterGroup,
      timePeriodA,
      timePeriodB,
      dateRangeCompare: isDateRangeCompareSelected,
      customDateFromA: req.body['custom-date-from-timePeriodA'] || '',
      customDateToA: req.body['custom-date-to-timePeriodA'] || '',
      customDateFromB: req.body['custom-date-from-timePeriodB'] || '',
      customDateToB: req.body['custom-date-to-timePeriodB'] || '',
    };

    if (Object.keys(formErrors).length > 0) {
      req.session.errors = formErrors;
      req.session.digitalByDefaultDashboardData = null;
      return res.redirect(
        app.namedRoutes.build('digital-by-default.dashboard.get')
      );
    }

    delete req.session.errors;

    const dashboardApiParams = buildDashboardApiParams(req.session.digitalByDefaultDashboardForm);
    console.log('INFO dbd DashboardApiParams: ', dashboardApiParams);

    let dashboardAPIResult;
    try {
      dashboardAPIResult = await digitalByDefaultDashboardDAO.post(req, dashboardApiParams);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('INFO dbd dashboard API result: ', JSON.stringify(dashboardAPIResult));
      }

      const flattenedDashboardData = parseAPIResponse(dashboardAPIResult);

      if (process.env.NODE_ENV === 'development') {
        console.log('INFO dbd flattened digital-by-default dashboard data: ', JSON.stringify(flattenedDashboardData));
      }

      req.session.digitalByDefaultDashboardData = {
        apiParams: dashboardApiParams,
        apiResult: dashboardAPIResult,
        requestParameters: req.body,
      };
    } catch (err) {
      req.session.digitalByDefaultDashboardData = null;
      app.logger.crit('Unable to fetch digital-by-default dashboard data', {
        error: typeof err.error !== 'undefined' ? err.error : err.toString(),
      });
    }

    return res.redirect(
      app.namedRoutes.build('digital-by-default.dashboard.get')
    );


  };

  // CSV download handlers
  module.exports.downloadResponseRateCsv = app => (req, res) => {
    const tableData = req.session.digitalByDefaultResponseRateTableData;

    if (!tableData) {
      return res.status(404).send('Response rate data not found');
    }

    const downloadDate = moment().format('YYYYMMDD');
    res.set('Content-Disposition', `attachment; filename=response-rates-${downloadDate}.csv`);
    res.type('csv');
    return res.send(buildTableCsv(tableData));
  };

  module.exports.downloadResponseTimeCsv = app => (req, res) => {
    const tableData = req.session.digitalByDefaultResponseTimeTableData;

    if (!tableData) {
      return res.status(404).send('Response time data not found');
    }

    const downloadDate = moment().format('YYYYMMDD');
    res.set('Content-Disposition', `attachment; filename=response-times-${downloadDate}.csv`);
    res.type('csv');
    return res.send(buildTableCsv(tableData));
  };

  module.exports.downloadAgeDemographicCsv = app => (req, res) => {
    const tableData = req.session.digitalByDefaultAgeDemographicTableData;

    if (!tableData) {
      return res.status(404).send('Age demographics data not found');
    }

    const downloadDate = moment().format('YYYYMMDD');
    res.set('Content-Disposition', `attachment; filename=age-demographics-${downloadDate}.csv`);
    res.type('csv');
    return res.send(buildTableCsv(tableData));
  };

  const buildTableCsv = tableData => {
    const headers = tableData.head.map(header => header.text || 'Change');
    const rows = tableData.rows.map(row => row.map(cell => cell.text));

    return [headers, ...rows]
      .map(row => row.map(value => escapeCsvValue(value)).join(','))
      .join('\n');
  };

  const escapeCsvValue = value => `"${String(value ?? '').replace(/"/g, '""')}"`;



  const getDefaultDashboardFormData = () => ({
    filterGroup: 'allCourts',
    timePeriodA: 'range2',
    timePeriodB: 'range2',
    dateRangeCompare: false,
    customDateFromA: '',
    customDateToA: '',
    customDateFromB: '',
    customDateToB: '',
  });

  const validateFormData = (body) => {
    const errors = {};
    const timePeriodA = body['radioTimeRange-timePeriodA'] === 'customDateRange' ? 'customRange' : body['select-timePeriodA'];
    const dateRangeCompare = body.dateRangeCompare === 'dateRangeCompare' || body.dateRangeCompare === 'on';
    const timePeriodB = body['radioTimeRange-timePeriodB'] === 'customDateRange' ? 'customRange' : body['select-timePeriodB'];

    const addMissingDateError = (fieldName, label) => {
      if (!body[fieldName]) {
        errors[fieldName] = [{
          summary: `Enter a ${label} date for the custom date range`,
          details: `Enter a date value`,
        }];
      }
    };

    if (timePeriodA === 'customRange') {
      addMissingDateError('custom-date-from-timePeriodA', 'from');
      addMissingDateError('custom-date-to-timePeriodA', 'to');
    }

    if (dateRangeCompare && timePeriodB === 'customRange') {
      addMissingDateError('custom-date-from-timePeriodB', 'from');
      addMissingDateError('custom-date-to-timePeriodB', 'to');
    }

    return errors;
  };

  const buildDashboardApiParams = formData => {
    const courtLocationGroups = getCourtLocationsByGroup(formData.filterGroup);
    const dateRangeA = formatDashboardDateRangeAPI(getDateRange(
      formData.timePeriodA,
      false,
      formData.customDateFromA,
      formData.customDateToA
    ));
    const dateRangeB = formData.dateRangeCompare
      ? formatDashboardDateRangeAPI(getDateRange(
        formData.timePeriodB,
        true,
        formData.customDateFromB,
        formData.customDateToB
      ))
      : null;

    const dashboardApiParams = {
      courtGroups: Array.isArray(courtLocationGroups) ? courtLocationGroups : [courtLocationGroups],
      dateRangeA: dateRangeA,
    };

    if (dateRangeB !== null && dateRangeB !== undefined) {
      dashboardApiParams.dateRangeB = dateRangeB;
    }

    if (formData.filterGroup === "allGroups") {
      dashboardApiParams.sumGroups = true;
    } else {
      dashboardApiParams.sumGroups = false;
    }

    return dashboardApiParams;

  };


  const parseAPIResponse = apiResponse => {
    const courtGroups = apiResponse?.court_groups || apiResponse?.courtGroups || [];
    const flattenedData = [];

    courtGroups.forEach(courtGroup => {
      const groupName = courtGroup.group_name || courtGroup.groupName;
      const periods = [
        { name: 'period_a', data: courtGroup.period_a || courtGroup.periodA },
        { name: 'period_b', data: courtGroup.period_b || courtGroup.periodB },
        { name: 'period_change', data: courtGroup.change},
      ];

      periods.forEach(period => {
        const locations = period.data?.locations || [];

        locations.forEach(location => {
          const locationCode = location.location_code !== undefined
            ? location.location_code
            : location.locationCode;
          const locationData = { ...location };
          delete locationData.location_code;
          delete locationData.locationCode;

          flattenedData.push({
            period: period.name,
            group_name: groupName,
            location_code: locationCode === null ? 'null' : locationCode,
            ...locationData,
          });
        });
      });
    });

    return flattenedData;
  };

  // Functions to return chart data
  const getTotalResponsesChartData = flattenedData => {
    const periodRows = flattenedData.filter(row => row.period === 'period_a' || row.period === 'period_b');
    const groupNames = new Set(periodRows.map(row => row.group_name));
    const isGroupData = groupNames.size > 1;
    const selected = new Map();

    periodRows.forEach(row => {
      const key = isGroupData ? row.group_name : row.location_code;
      const name = isGroupData ? row.group_name : getCourtLabel(Number(row.location_code));

      if (!selected.has(key)) {
        selected.set(key, {
          name,
          type: isGroupData ? 'group' : 'court',
          periods: {},
        });
      }

      const totalOnlineResponses = Number(nullNumeric(row.onlineResponseTotal));
      const totalPaperResponses = Number(nullNumeric(row.paperResponseTotal));

      selected.get(key).periods[row.period] = totalOnlineResponses + totalPaperResponses;
    });

    return {
      courtsOrGroups: Array.from(selected.values()),
    };
  };

  const getResponseTypeChartData = flattenedData => {
    const periodRows = flattenedData.filter(row => row.period === 'period_a' || row.period === 'period_b');
    const groupNames = new Set(periodRows.map(row => row.group_name));
    const isGroupData = groupNames.size > 1;
    const selected = new Map();

    periodRows.forEach(row => {
      const key = isGroupData ? row.group_name : row.location_code;
      const name = isGroupData ? row.group_name : getCourtLabel(Number(row.location_code));

      if (!selected.has(key)) {
        selected.set(key, {
          name,
          type: isGroupData ? 'group' : 'court',
          periods: {},
        });
      }

      selected.get(key).periods[row.period] = {
        responseRatePercent: Number(nullNumeric(row.responseRatePercent)),
        digitalResponsesPercent: Number(nullNumeric(row.digitalResponsesPercent)),
      };
    });

    return {
      courtsOrGroups: Array.from(selected.values()),
    };
  };

  const getResponseTimesChartData = flattenedData => {
    const periodRows = flattenedData.filter(row => row.period === 'period_a' || row.period === 'period_b');
    const groupNames = new Set(periodRows.map(row => row.group_name));
    const isGroupData = groupNames.size > 1;
    const selected = new Map();

    periodRows.forEach(row => {
      const key = isGroupData ? row.group_name : row.location_code;
      const name = isGroupData ? row.group_name : getCourtLabel(Number(row.location_code));

      if (!selected.has(key)) {
        selected.set(key, {
          name,
          type: isGroupData ? 'group' : 'court',
          periods: {},
        });
      }

      const responseTimesPercent = row.responseTimesPercent || {};

      selected.get(key).periods[row.period] = {
        within7DaysPercent: Number(nullNumeric(responseTimesPercent.within7DaysPercent)),
        within14DaysPercent: Number(nullNumeric(responseTimesPercent.within14DaysPercent)),
        within21DaysPercent: Number(nullNumeric(responseTimesPercent.within21DaysPercent)),
        over21DaysPercent: Number(nullNumeric(responseTimesPercent.over21DaysPercent)),
      };
    });

    return {
      courtsOrGroups: Array.from(selected.values()),
    };
  };

  const getAgeDemographicsChartData = flattenedData => {
    const periodRows = flattenedData.filter(row => row.period === 'period_a' || row.period === 'period_b');
    const groupNames = new Set(periodRows.map(row => row.group_name));
    const isGroupData = groupNames.size > 1;
    const selected = new Map();

    periodRows.forEach(row => {
      const key = isGroupData ? row.group_name : row.location_code;
      const name = isGroupData ? row.group_name : getCourtLabel(Number(row.location_code));

      if (!selected.has(key)) {
        selected.set(key, {
          name,
          type: isGroupData ? 'group' : 'court',
          periods: {},
        });
      }

      const ageGroupBreakdownPercent = row.ageGroupBreakdownPercent || {};

      selected.get(key).periods[row.period] = {
        lessThan18Percent: Number(nullNumeric(ageGroupBreakdownPercent.lessThan18)),
        age18To30Percent: Number(nullNumeric(ageGroupBreakdownPercent['18To30'])),
        age31To40Percent: Number(nullNumeric(ageGroupBreakdownPercent['31To40'])),
        age41To50Percent: Number(nullNumeric(ageGroupBreakdownPercent['41To50'])),
        age51To60Percent: Number(nullNumeric(ageGroupBreakdownPercent['51To60'])),
        age61To70Percent: Number(nullNumeric(ageGroupBreakdownPercent['61To70'])),
        age71To75Percent: Number(nullNumeric(ageGroupBreakdownPercent['71To75'])),
        over75Percent: Number(nullNumeric(ageGroupBreakdownPercent.over75)),
      };
    });

    return {
      courtsOrGroups: Array.from(selected.values()),
    };
  };


  // Functions to return table data
  const getResponseTypeTableData = (req, dashboardData, filterType, isComparison ) => {

    const dashboardDataA = dashboardData.filter(row => row.period === 'period_a');
    const dashboardDataChange = dashboardData.filter(row => row.period === 'period_change');

    const table = {
      head: [],
      rows: [],
    };

    if (isComparison) {
      table.head = [
        { id: 'courtOrGroup', text: 'Court or group' },
        { id: 'totalResponses', text: 'Total responses', format: 'numeric' },
        { id: 'totalResponsesChange', text: 'Change', format: 'numeric' },
        { id: 'responseRate', text: 'Response rate (%)', format: 'numeric' },
        { id: 'responseRateChange', text: 'Change', format: 'numeric' },
        { id: 'digitalResponses', text: 'Digital responses (%)', format: 'numeric' },
        { id: 'digitalResponsesChange', text: 'Change', format: 'numeric' },
      ]
    } else {
      table.head = [
        { id: 'courtOrGroup', text: 'Court or group' },
        { id: 'totalResponses', text: 'Total responses', format: 'numeric' },
        { id: 'responseRate', text: 'Response rate (%)', format: 'numeric' },
        { id: 'digitalResponses', text: 'Digital responses (%)', format: 'numeric' },
      ]
    }

    for (let index = 0; index < dashboardDataA.length; index++) {
      const row = dashboardDataA[index];
      
      let locationOrGroupText = '';
      let totalResponsesDigital = nullNumeric(row.onlineResponseTotal);
      let totalResponsesPaper = nullNumeric(row.paperResponseTotal);
      let totalResponses = Number(totalResponsesDigital) + Number(totalResponsesPaper);
      let responseRate = Math.round(nullNumeric(row.responseRatePercent));
      let digitalResponses = Math.round(nullNumeric(row.digitalResponsesPercent));
      let totalResponsesChange = 0;
      let responseRateChange = 0;
      let digitalResponsesChange = 0;
      
      if (filterType === 'allGroups'){
        locationOrGroupText = row.group_name;
      } else {
        //locationOrGroupText = capitalizeCourtName(getLocationName(req, row.location_code));
        locationOrGroupText = getCourtName(row.location_code);
      }

      if (isComparison) {
        const rowChange = dashboardDataChange.find(changeRow => {
          return changeRow.group_name === row.group_name &&
            String(changeRow.location_code) === String(row.location_code);
        });

        totalResponsesChange = Number(
          nullNumeric(rowChange?.totalResponsesChange ?? rowChange?.totalResponses)
        );
        responseRateChange = Math.round(Number(
          nullNumeric(rowChange?.responseRatePercentChange ?? rowChange?.responseRatePercent)
        ));
        digitalResponsesChange = Math.round(Number(
          nullNumeric(rowChange?.digitalResponsesPercentChange ?? rowChange?.digitalResponsesPercent)
        ));

        table.rows.push([
          { text: locationOrGroupText },
          { text: (totalResponses), format: 'numeric' },
          { text: formatChangeValue(totalResponsesChange), format: 'numeric', classes: getChangeClass(totalResponsesChange) },
          { text: (responseRate), format: 'numeric' },
          { text: formatChangeValue(responseRateChange), format: 'numeric', classes: getChangeClass(responseRateChange) },
          { text: (digitalResponses), format: 'numeric' },
          { text: formatChangeValue(digitalResponsesChange), format: 'numeric', classes: getChangeClass(digitalResponsesChange) }
        ]);
      } else {
        table.rows.push([
          { text: locationOrGroupText },
          { text: (totalResponses), format: 'numeric' },
          { text: (responseRate), format: 'numeric' },
          { text: (digitalResponses), format: 'numeric' }
        ]);
      }

    }

    return table;
  };

  const getResponseTimeTableData = (req, dashboardData, filterType, isComparison ) => {

    const dashboardDataA = dashboardData.filter(row => row.period === 'period_a');
    const dashboardDataChange = dashboardData.filter(row => row.period === 'period_change');

    const table = {
      head: [],
      rows: [],
    };

    if (isComparison) {
      table.head = [
        { id: 'courtOrGroup', text: 'Court or group' },
        { id: 'within7Days', text: 'Within 7 days (%)', format: 'numeric' },
        { id: 'within7DaysChange', text: 'Change', format: 'numeric' },
        { id: 'within14Days', text: 'Within 14 days (%)', format: 'numeric' },
        { id: 'within14DaysChange', text: 'Change', format: 'numeric' },
        { id: 'within21Days', text: 'Within 21 days (%)', format: 'numeric' },
        { id: 'within21DaysChange', text: 'Change', format: 'numeric' },
        { id: 'over21Days', text: 'Over 21 days (%)', format: 'numeric' },
        { id: 'over21DaysChange', text: 'Change', format: 'numeric' },
      ]
    } else {
      table.head = [
        { id: 'courtOrGroup', text: 'Court or group' },
        { id: 'within7Days', text: 'Within 7 days (%)', format: 'numeric' },
        { id: 'within14Days', text: 'Within 14 days (%)', format: 'numeric' },
        { id: 'within21Days', text: 'Within 21 days (%)', format: 'numeric' },
        { id: 'over21Days', text: 'Over 21 days (%)', format: 'numeric' },
      ]
    }

    for (let index = 0; index < dashboardDataA.length; index++) {
      const row = dashboardDataA[index];
      const responseTimesA = row.responseTimesPercent || {};

      let locationOrGroupText = '';
      let within7Days = nullNumeric(responseTimesA.within7DaysPercent);
      let within14Days = nullNumeric(responseTimesA.within14DaysPercent);
      let within21Days = nullNumeric(responseTimesA.within21DaysPercent);
      let over21Days = nullNumeric(responseTimesA.over21DaysPercent);
      let within7DaysChange = 0;
      let within14DaysChange = 0;
      let within21DaysChange = 0;
      let over21DaysChange = 0;

      
      if (filterType === 'allGroups'){
        locationOrGroupText = row.group_name;
      } else {
        //locationOrGroupText = capitalizeCourtName(getLocationName(req, row.location_code));
        locationOrGroupText = getCourtName(row.location_code);
      }

      if (isComparison) {
        const rowChange = dashboardDataChange.find(changeRow => {
          return changeRow.group_name === row.group_name &&
            String(changeRow.location_code) === String(row.location_code);
        });
        const responseTimesChange = rowChange?.responseTimesPercentChange ||
          rowChange?.responseTimesPercent || rowChange?.onlineResponseTimes || rowChange || {};

        within7DaysChange = Number(nullNumeric(
          responseTimesChange.within7DaysPercent ??
          responseTimesChange.within7DaysChange ??
          responseTimesChange.within7Days
        ));
        within14DaysChange = Number(nullNumeric(
          responseTimesChange.within14DaysPercent ??
          responseTimesChange.within14DaysChange ??
          responseTimesChange.within14Days
        ));
        within21DaysChange = Number(nullNumeric(
          responseTimesChange.within21DaysPercent ??
          responseTimesChange.within21DaysChange ??
          responseTimesChange.within21Days
        ));
        over21DaysChange = Number(nullNumeric(
          responseTimesChange.over21DaysPercent ??
          responseTimesChange.over21DaysChange ??
          responseTimesChange.over21Days
        ));

        table.rows.push([
          { text: locationOrGroupText },
          { text: (within7Days), format: 'numeric' },
          { text: formatChangeValue(within7DaysChange), format: 'numeric', classes: getChangeClass(within7DaysChange) },
          { text: (within14Days), format: 'numeric' },
          { text: formatChangeValue(within14DaysChange), format: 'numeric', classes: getChangeClass(within14DaysChange) },
          { text: (within21Days), format: 'numeric' },
          { text: formatChangeValue(within21DaysChange), format: 'numeric', classes: getChangeClass(within21DaysChange) },
          { text: (over21Days), format: 'numeric' },
          { text: formatChangeValue(over21DaysChange), format: 'numeric', classes: getChangeClass(over21DaysChange) }
        ]);
      } else {
        table.rows.push([
          { text: locationOrGroupText },
          { text: (within7Days), format: 'numeric' },
          { text: (within14Days), format: 'numeric' },
          { text: (within21Days), format: 'numeric' },
          { text: (over21Days), format: 'numeric' },
        ]);
      }

    }

    return table;
  };

  const getAgeDemographicTableData = (req, dashboardData, filterType, isComparison ) => {

    const dashboardDataA = dashboardData.filter(row => row.period === 'period_a');
    const dashboardDataChange = dashboardData.filter(row => row.period === 'period_change');

    const table = {
      head: [],
      rows: [],
    };

    let changeHTML = '&Delta;';

    changeHTML = '<span aria-hidden="true">&Delta;</span><span class="govuk-visually-hidden">Change</span>'

    if (isComparison) {
      table.head = [
        { id: 'courtOrGroup', text: 'Court or group' },
        { id: 'ageLessThan18', text: 'Less than 18 (%)', format: 'numeric' },
        { id: 'ageLessThan18Change', html: changeHTML, format: 'numeric' },
        { id: 'age18to30', text: '18 to 30 (%)', format: 'numeric' },
        { id: 'age18to30Change', html: changeHTML, format: 'numeric' },
        { id: 'age31to40', text: '31 to 40 (%)', format: 'numeric' },
        { id: 'age31to40Change', html: changeHTML, format: 'numeric' },
        { id: 'age41to50', text: '41 to 50 (%)', format: 'numeric' },
        { id: 'age41to50Change', html: changeHTML, format: 'numeric' },
        { id: 'age51to60', text: '51 to 60 (%)', format: 'numeric' },
        { id: 'age51to60Change', html: changeHTML, format: 'numeric' },
        { id: 'age61to70', text: '61 to 70 (%)', format: 'numeric' },
        { id: 'age61to70Change', html: changeHTML, format: 'numeric' },
        { id: 'age71to75', text: '71 to 75 (%)', format: 'numeric' },
        { id: 'age71to75Change', html: changeHTML, format: 'numeric' },
        { id: 'ageOver75', text: 'Over 75 (%)', format: 'numeric' },
        { id: 'ageOver75Change', html: changeHTML, format: 'numeric' },
      ]
    } else {
      table.head = [
        { id: 'courtOrGroup', text: 'Court or group' },
        { id: 'ageLessThan18', text: 'Less than 18 (%)', format: 'numeric' },
        { id: 'age18to30', text: '18 to 30 (%)', format: 'numeric' },
        { id: 'age31to40', text: '31 to 40 (%)', format: 'numeric' },
        { id: 'age41to50', text: '41 to 50 (%)', format: 'numeric' },
        { id: 'age51to60', text: '51 to 60 (%)', format: 'numeric' },
        { id: 'age61to70', text: '61 to 70 (%)', format: 'numeric' },
        { id: 'age71to75', text: '71 to 75 (%)', format: 'numeric' },
        { id: 'ageOver75', text: 'Over 75 (%)', format: 'numeric' },
      ]
    }

    for (let index = 0; index < dashboardDataA.length; index++) {
      const row = dashboardDataA[index];
      const ageGroupBreakdownPercent = row.ageGroupBreakdownPercent || {};

      let locationOrGroupText = '';
      
      let ageLessThan18 = nullNumeric(ageGroupBreakdownPercent.lessThan18);
      let age18to30 = nullNumeric(ageGroupBreakdownPercent['18To30']);
      let age31to40 = nullNumeric(ageGroupBreakdownPercent['31To40']);
      let age41to50 = nullNumeric(ageGroupBreakdownPercent['41To50']);
      let age51to60 = nullNumeric(ageGroupBreakdownPercent['51To60']);
      let age61to70 = nullNumeric(ageGroupBreakdownPercent['61To70']);
      let age71to75 = nullNumeric(ageGroupBreakdownPercent['71To75']);
      let ageOver75 = nullNumeric(ageGroupBreakdownPercent.over75);
      let ageLessThan18Change = 0;
      let age18to30Change = 0;
      let age31to40Change = 0;
      let age41to50Change = 0;
      let age51to60Change = 0;
      let age61to70Change = 0;
      let age71to75Change = 0;
      let ageOver75Change = 0;
      
      if (filterType === 'allGroups'){
        locationOrGroupText = row.group_name;
      } else {
        locationOrGroupText = getCourtName(row.location_code);
      }

      if (isComparison) {
        const rowChange = dashboardDataChange.find(changeRow => {
          return changeRow.group_name === row.group_name &&
            String(changeRow.location_code) === String(row.location_code);
        });
        const ageGroupChange = rowChange?.ageGroupBreakdownPercentChange ||
          rowChange?.ageGroupBreakdownPercent || rowChange?.ageGroupBreakdown || rowChange || {};

        ageLessThan18Change = Number(nullNumeric(
          ageGroupChange.lessThan18Change ?? ageGroupChange.lessThan18
        ));
        age18to30Change = Number(nullNumeric(
          ageGroupChange['18To30Change'] ?? ageGroupChange['18To30']
        ));
        age31to40Change = Number(nullNumeric(
          ageGroupChange['31To40Change'] ?? ageGroupChange['31To40']
        ));
        age41to50Change = Number(nullNumeric(
          ageGroupChange['41To50Change'] ?? ageGroupChange['41To50']
        ));
        age51to60Change = Number(nullNumeric(
          ageGroupChange['51To60Change'] ?? ageGroupChange['51To60']
        ));
        age61to70Change = Number(nullNumeric(
          ageGroupChange['61To70Change'] ?? ageGroupChange['61To70']
        ));
        age71to75Change = Number(nullNumeric(
          ageGroupChange['71To75Change'] ?? ageGroupChange['71To75']
        ));
        ageOver75Change = Number(nullNumeric(
          ageGroupChange.over75Change ?? ageGroupChange.over75
        ));

        table.rows.push([
          { text: locationOrGroupText },
          { text: (ageLessThan18), format: 'numeric' },
          { text: formatChangeValue(ageLessThan18Change), format: 'numeric', classes: getChangeClass(ageLessThan18Change) },
          { text: (age18to30), format: 'numeric' },
          { text: formatChangeValue(age18to30Change), format: 'numeric', classes: getChangeClass(age18to30Change) },
          { text: (age31to40), format: 'numeric' },
          { text: formatChangeValue(age31to40Change), format: 'numeric', classes: getChangeClass(age31to40Change) },
          { text: (age41to50), format: 'numeric' },
          { text: formatChangeValue(age41to50Change), format: 'numeric', classes: getChangeClass(age41to50Change) },
          { text: (age51to60), format: 'numeric' },
          { text: formatChangeValue(age51to60Change), format: 'numeric', classes: getChangeClass(age51to60Change) },
          { text: (age61to70), format: 'numeric' },
          { text: formatChangeValue(age61to70Change), format: 'numeric', classes: getChangeClass(age61to70Change) },
          { text: (age71to75), format: 'numeric' },
          { text: formatChangeValue(age71to75Change), format: 'numeric', classes: getChangeClass(age71to75Change) },
          { text: (ageOver75), format: 'numeric' },
          { text: formatChangeValue(ageOver75Change), format: 'numeric', classes: getChangeClass(ageOver75Change) },
        ]);
      } else {
        table.rows.push([
          { text: locationOrGroupText },
          { text: (ageLessThan18), format: 'numeric' },
          { text: (age18to30), format: 'numeric' },
          { text: (age31to40), format: 'numeric' },
          { text: (age41to50), format: 'numeric' },
          { text: (age51to60), format: 'numeric' },
          { text: (age61to70), format: 'numeric' },
          { text: (age71to75), format: 'numeric' },
          { text: (ageOver75), format: 'numeric' },
        ]);
      }

    }

    return table;
  };


  const formatDashboardDateRangeAPI = dateRange => {
    if (!dateRange) {
      return dateRange;
    }

    return {
      startDate: formatDashboardDate(dateRange.startDate),
      endDate: formatDashboardDate(dateRange.endDate),
    };
  };

  const formatDashboardDate = date => {
    let formattedDate = moment(date, ['DD/MM/YYYY', 'D/M/YYYY', 'YYYY-MM-DD', 'YYYYMMDD'], true);

    return formattedDate.isValid() ? formattedDate.format('YYYYMMDD') : date;
  };

  const formatDashboardDateDisplay = date => {
    let formattedDate = moment(date, ['YYYYMMDD', 'DD/MM/YYYY', 'D/M/YYYY'], true);

    return formattedDate.isValid() ? formattedDate.format('DD MMM YYYY') : date;
  };

  const formatRange = range => range ? {
    startDate: formatDashboardDateDisplay(range.startDate),
    endDate: formatDashboardDateDisplay(range.endDate),
  } : null;

  const getDisplayDateRange = formData => {

    const dateRangeA = getDateRange(
      formData.timePeriodA,
      false,
      formData.customDateFromA,
      formData.customDateToA
    );

    const dateRangeB = formData.dateRangeCompare
      ? getDateRange(
        formData.timePeriodB,
        true,
        formData.customDateFromB,
        formData.customDateToB
      )
      : null;

      let presetPeriodA = null;
      let presetPeriodB = null;
      presetPeriodA = formData['select-timePeriodA'];
      presetPeriodB = formData['select-timePeriodB'];


    return {
      dateRangeA: formatRange(dateRangeA),
      dateRangeB: formatRange(dateRangeB),
      dateRangeLabelA: getDateRangeDesc(dateRangeA, formData.timePeriodA, 'A'),
      dateRangeLabelB: getDateRangeDesc(dateRangeB, formData.timePeriodB, 'B'),
      dateRangeDashboardDescA: getDateRangeDashboardDesc(dateRangeA, formData.timePeriodA, 'A'),
      dateRangeDashboardDescB: getDateRangeDashboardDesc(dateRangeB, formData.timePeriodB, 'B'),
    };  
  };

  const getDateRangeDesc = (dateRange, timePeriod, customRangeName) => {

    let dateRangeDesc = '';

    if (dateRange == null) {
      return '';
    }

    let startDateObj = moment(dateRange.startDate, ['YYYYMMDD', 'DD/MM/YYYY', 'D/M/YYYY'], true);
    let endDateObj = moment(dateRange.endDate, ['YYYYMMDD', 'DD/MM/YYYY', 'D/M/YYYY'], true);

    if (timePeriod === 'customRange'){
      dateRangeDesc = 'Custom range' + (customRangeName ? ' ' + customRangeName : '');
    } else {
      if (timePeriod === 'range1'){
        dateRangeDesc = 'Last 30 days';
      }
      if (timePeriod === 'range2'){
        dateRangeDesc = startDateObj.format('MMM') + ' - ' + endDateObj.format('MMM YYYY');
      }
      if (timePeriod === 'range3'){
        dateRangeDesc = startDateObj.format('MMM YYYY') + ' - ' + endDateObj.format('MMM YYYY');
      }
      if (timePeriod === 'range4'){
        dateRangeDesc = startDateObj.format('MMM YYYY') + ' - ' + endDateObj.format('MMM YYYY');
      }
    }

    return dateRangeDesc
  };

  const getDateRangeDashboardDesc = (dateRange, timePeriod, customRangeName) => {

    let dateRangeDesc = '';

    if (dateRange == null) {
      return '';
    }

    let startDateObj = moment(dateRange.startDate, ['YYYYMMDD', 'DD/MM/YYYY', 'D/M/YYYY'], true);
    let endDateObj = moment(dateRange.endDate, ['YYYYMMDD', 'DD/MM/YYYY', 'D/M/YYYY'], true);

    if (timePeriod === 'customRange'){
      dateRangeDesc = 'Custom range' + (customRangeName ? ' ' + customRangeName : '') + ' (' + startDateObj.format('DD/MM/YYYY') + ' - ' + endDateObj.format('DD/MM/YYYY') + ')';
    } else {
      if (timePeriod === 'range1'){
        dateRangeDesc = 'Last 30 days (' + startDateObj.format('DD/MM/YYYY') + ' - ' + endDateObj.format('DD/MM/YYYY') + ')';
      }
      if (timePeriod === 'range2'){
        dateRangeDesc = startDateObj.format('MMM') + ' - ' + endDateObj.format('MMM YYYY');
      }
      if (timePeriod === 'range3'){
        dateRangeDesc = startDateObj.format('MMM YYYY') + ' - ' + endDateObj.format('MMM YYYY');
      }
      if (timePeriod === 'range4'){
        dateRangeDesc = startDateObj.format('MMM YYYY') + ' - ' + endDateObj.format('MMM YYYY');
      }
    }

    return dateRangeDesc
  };
  

  const fetchDashboardData = async (app, req, formData) => {
    const dashboardApiParams = buildDashboardApiParams(formData);

    try {

      const dashboardAPIResult = await digitalByDefaultDashboardDAO.post(req, dashboardApiParams);
      //const flattenedDashboardData = parseAPIResponse(dashboardAPIResult);

      return {
        apiParams: dashboardApiParams,
        apiResult: dashboardAPIResult,
      };
    } catch (err) {
      app.logger.crit('Unable to fetch digital-by-default dashboard data', {
        error: typeof err.error !== 'undefined' ? err.error : err.toString(),
      });

      return null;
    }
  };
  

  const getQuarterDates = (prevQuarterNo) => {
    const previousQuarter = moment().subtract(prevQuarterNo, 'quarter');

    return {
      rangeDesc: previousQuarter.clone().startOf('quarter').format('MMM') + ' - ' + previousQuarter.clone().endOf('quarter').format('MMM YYYY'),
      startDate: previousQuarter.clone().startOf('quarter').format('YYYYMMDD'),
      endDate: previousQuarter.clone().endOf('quarter').format('YYYYMMDD'),
    };
  };

  const getDaysDates = (prevDays) => {
    const startDate = moment().subtract(prevDays, 'days');
    const endDate = moment().subtract(0, 'days');

    return {
      rangeDesc: startDate.clone().format('DD MMM YYYY') + ' - ' + endDate.clone().format('DD MMM YYYY'),
      startDate: startDate.clone().format('YYYYMMDD'),
      endDate: endDate.clone().format('YYYYMMDD'),
    };
  }

  const getMonthDates = (prevMonths) => {
    const startMonth = moment().subtract(prevMonths + 1, 'month');
    const endMonth = moment().subtract(1, 'month');

    return {
      rangeDesc: startMonth.clone().startOf('month').format('MMM YYYY') + ' - ' + endMonth.clone().endOf('month').format('MMM YYYY'),
      startDate: startMonth.clone().startOf('month').format('YYYYMMDD'),
      endDate: endMonth.clone().endOf('month').format('YYYYMMDD'),
    };
  };

  const getGroupDescription = locationCodes => {
    return locationCodes
      .map(locationCode => getCourtName(Number(locationCode)))
      .join(', ');
  };

  const getLocationName = (req, locationCode) => {
    const courts = req.session.dashboardCourtsList || [];
    const court = courts.find(court => String(court.locationCode) === String(locationCode));

    return court ? court.locationName : locationCode;
  };

  const getCourtName = (locationCode) => {
    
    let courtName = locationCode;

    switch(locationCode){
      case 419:
        courtName = 'Derby';
        break;
      case 423:
        courtName = 'Exeter';
        break;
      case 431:
        courtName = 'Lewes';
        break;
      case 415:
        courtName = 'Chester';
        break;
      case 403:
        courtName = 'Kingston-upon-Hull';
        break;
      case 443:
        courtName = 'Norwich';
        break;
      case 411:
        courtName = 'Cardiff';
        break;
      case 478:
        courtName = 'Isle of Wight';
        break;
      case 441:
        courtName = 'Newport S Wales';
        break;
      case 453:
        courtName = 'Snaresbrook';
        break;
    }

    return courtName;
  };

  const getCourtLabel = (locationCode) => {
    
    let labelText = locationCode;

    switch(locationCode){
      case 419:
        labelText = 'Derby';
        break;
      case 423:
        labelText = 'Exeter';
        break;
      case 431:
        labelText = 'Lewes';
        break;
      case 415:
        labelText = 'Chester';
        break;
      case 403:
        labelText = ['Kingston-', 'upon-Hull'];
        break;
      case 443:
        labelText = 'Norwich';
        break;
      case 411:
        labelText = 'Cardiff';
        break;
      case 478:
        labelText = ['Isle of', 'Wight'];
        break;
      case 441:
        labelText = ['Newport', 'S Wales'];
        break;
      case 453:
        labelText = 'Snaresbrook';
        break;
    }

    return labelText;
  };

  const capitalizeCourtName = (string) => {
      if (!string) return;

      const parts = string.split(' ');

      const capitalizedParts = parts.map(function(part) {
        return part.trim().charAt(0).toUpperCase() + part.trim().slice(1).toLowerCase();
      });

      return capitalizedParts.join(' ');
  };

  const getCourtLocationsByGroup = (groupName) => {
    const courtGroups = {
      'allCourts': {
        groupName: 'All Courts',
        groupLocations: ['419', '423', '431', '415', '403', '443', '411', '478', '441', '453']
      },
      'group1': {
        groupName: 'Group 1',
        groupLocations: ['419', '423', '431']
      },
      'group2': {
        groupName: 'Group 2',
        groupLocations: ['415', '403', '443']
      },
      'group3': {
        groupName: 'Group 3',
        groupLocations: ['411', '478', '441', '453']
      },
      'allGroups': [
        {
          groupName: 'Group 1',
          groupLocations: ['419', '423', '431']
        },
        {
          groupName: 'Group 2',
          groupLocations: ['415', '403', '443']
        },
        {
          groupName: 'Group 3',
          groupLocations: ['411', '478', '441', '453']
        }
      ]
    };

    return courtGroups[groupName];


    
  };

  const getDateRange = (dateRangeDesc, comparisonRange, customDateFrom, customDateTo) => {

    if (dateRangeDesc === 'customRange') {
      return {
        startDate: customDateFrom,
        endDate: customDateTo
      };
    }

    if (dateRangeDesc === 'range1') {
      // last 30 days
      let daysDates = getDaysDates(30);
      return {
        startDate: daysDates.startDate,
        endDate: daysDates.endDate
      };
    }

    if (dateRangeDesc === 'range2') {
      // last quarter
      let quarterDates = getQuarterDates(1);
      return {
        startDate: quarterDates.startDate,
        endDate: quarterDates.endDate
      };
    }

    if (dateRangeDesc === 'range3') {
      // last 6 months
      let monthDates = getMonthDates(6);
      return {
        startDate: monthDates.startDate,
        endDate: monthDates.endDate
      };
    }

    if (dateRangeDesc === 'range4') {
      // last 12 months
      let monthDates = getMonthDates(12);
      return {
        startDate: monthDates.startDate,
        endDate: monthDates.endDate
      };
    }

  }

  const nullValue = value => value === undefined || value === null || value === '' ? '0' : value;

  const nullNumeric = value => value === undefined || value === null || value === '' ? '0': value;

  const getChangeClass = value => {
    if (value > 0) {
      return 'change-pos';
    }

    if (value < 0) {
      return 'change-neg';
    }

    return 'change-zero';
  };

  const formatChangeValue = value => {
    if (value > 0) {
      return `+${value}`;
    }

    if (value < 0) {
      return `-${Math.abs(value)}`;
    }

    return '0';
  };

  

})();
