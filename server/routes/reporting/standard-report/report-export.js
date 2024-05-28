/* eslint-disable strict */
const _ = require('lodash');
const { dateFilter } = require('../../../components/filters');
const { snakeToCamel } = require('../../../lib/mod-utils');
const { tableDataMappers } = require('./utils');

async function reportExport(app, req, res, reportKey, data) {
  switch (reportKey) {
  case 'pool-status':
    return poolStatusReportExport(req, res, data);
  case 'daily-utilisation':
    return dailyUtilisationReportExport(req, res, data);
  case 'daily-utilisation-jurors':
    return dailyUtilisationJurorsReportExport(req, res, data);
  case 'prepare-monthly-utilisation':
    return monthlyUtilisationReportExport(req, res, data);
  case 'view-monthly-utilisation':
    return monthlyUtilisationReportExport(req, res, data);
  default:
    // implement standardised report export if needed
    return;
  }
}

async function poolStatusReportExport(req, res, data) {
  const { tableData } = data;
  const poolNumber = req.params.filter;

  let csvResult = [['Pool number', poolNumber], [], ['Status', 'Total members']];
  const csvData = tableData.headings.map(header => {
    const text = tableDataMappers[header.dataType](tableData.data[0][snakeToCamel(header.id)]) || '-';

    return  [header.name, text];
  });

  csvResult = csvResult.concat(csvData);
  const filename = `pool_status_${poolNumber}_${dateFilter(new Date, null, 'DD-MM-YYYY')}.csv`;

  res.set('content-disposition', 'attachment; filename=' + filename);
  res.type('csv');
  return res.send(csvResult.join('\n'));
}

async function dailyUtilisationReportExport(req, res, data) {
  const { tableData, headings } = data;
  const { fromDate, toDate } = req.query;
  const reportHeaders = [
    ['Date from', dateFilter(fromDate, 'yyyy-MM-DD', 'DD/MM/YYYY')],
    ['Date to', dateFilter(toDate, 'yyyy-MM-DD', 'DD/MM/YYYY')],
  ];
  const tableHeaders = tableData.headings.map((heading) => heading.name);
  const tableBody = [];

  tableData.weeks.forEach((week) => {
    week.days.forEach((day) => {
      tableBody.push([
        dateFilter(day.date, null, 'dddd D MMMM YYYY'),
        day.jurorWorkingDays.toString(),
        day.sittingDays.toString(),
        day.attendanceDays.toString(),
        day.nonAttendanceDays.toString(),
        `${(Math.round(day.utilisation * 100) / 100).toString()}%`,
      ]);
    });
  });

  const csvResult = [...reportHeaders, [], tableHeaders, ...tableBody];

  const filename = `daily_utilisation_${_.lowerCase(headings.courtName.value)}_${fromDate}_${toDate}.csv`;

  res.set('content-disposition', 'attachment; filename=' + filename);
  res.type('csv');
  return res.send(csvResult.join('\n'));
}

async function dailyUtilisationJurorsReportExport(req, res, data) {
  const { tableData, headings } = data;
  const reportDate = req.params.filter;
  const tableHeaders = tableData.headings.map((heading) => heading.name);
  const tableBody = [];

  tableData.jurors.forEach((juror) => {
    tableBody.push([
      juror.juror,
      juror.jurorWorkingDay.toString(),
      juror.sittingDay.toString(),
      juror.attendanceDay.toString(),
      juror.nonAttendanceDay.toString(),
    ]);
  });

  const csvResult = [
    ['Report date', dateFilter(reportDate, 'yyyy-MM-DD', 'DD/MM/YYYY')],
    [],
    tableHeaders,
    ...tableBody,
  ];

  const filename = `daily_utilisation_jurors_${_.lowerCase(headings.courtName.value)}_${reportDate}.csv`;

  res.set('content-disposition', 'attachment; filename=' + filename);
  res.type('csv');
  return res.send(csvResult.join('\n'));
}

async function monthlyUtilisationReportExport(req, res, data) {
  const { tableData, headings } = data;
  const reportDate = req.params.filter;
  const tableHeaders = tableData.headings.map((heading) => heading.name);
  const tableBody = [];

  tableData.months.forEach((month) => {
    tableBody.push([
      month.month,
      month.jurorWorkingDays.toString(),
      month.sittingDays.toString(),
      month.attendanceDays.toString(),
      month.nonAttendanceDays.toString(),
      `${(Math.round(month.utilisation * 100) / 100).toString()}%`,
    ]);
  });

  const csvResult = [
    ['Report month', dateFilter(reportDate, 'yyyy-MM-DD', 'MMMM YYYY')],
    [],
    tableHeaders,
    ...tableBody,
  ];

  const filename = `monthly_utilisation_jurors_${_.lowerCase(headings.courtName.value)}_${dateFilter(reportDate, 'yyyy-MM-DD', 'MM-YYYY')}.csv`;

  res.set('content-disposition', 'attachment; filename=' + filename);
  res.type('csv');
  return res.send(csvResult.join('\n'));
}

module.exports = {
  reportExport,
};
