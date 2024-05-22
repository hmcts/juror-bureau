/* eslint-disable strict */
const { dateFilter, makeDate } = require('../../../components/filters');
const { snakeToCamel } = require('../../../lib/mod-utils');
const { tableDataMappers, buildTableHeaders } = require('../standard-report/utils');

const bespokeReportBodys = (app) => {
  return {
    'pool-status': (reportType, tableData) => {
      const activeRowHeaders = ['responded_total', 'summons_total', 'panel_total', 'juror_total'];
      let activeRows = [];
      let totalActive = 0;
      let inactiveRows = [];
      let totalInactive = 0;

      tableData.data.forEach(data => {
        tableData.headings.forEach(header => {
          const output = tableDataMappers[header.dataType](data[snakeToCamel(header.id)]);
          const row = {
            key: {
              text: header.name,
              classes: 'govuk-!-padding-left-2',
            },
            value: {
              text: output ? output : 0,
            },
            classes: 'govuk-!-padding-left-2',
          };

          if (activeRowHeaders.includes(header.id)) {
            activeRows.push(row);
            totalActive += data[snakeToCamel(header.id)];
          } else {
            inactiveRows.push(row);
            totalInactive += data[snakeToCamel(header.id)];
          }
        });
      });

      const totalJurors = totalActive + totalInactive;

      activeRows.push({
        key: {
          text: 'Total active',
          classes: 'govuk-!-padding-left-2',
        },
        value: {
          text: `${totalActive} (${(totalActive/totalJurors) * 100}%)`,
        },
        classes: 'mod-summary-list__blue',
      });
      inactiveRows.push({
        key: {
          text: 'Total inactive',
          classes: 'govuk-!-padding-left-2',
        },
        value: {
          text: `${totalInactive} (${(totalInactive/totalJurors) * 100}%)`,
        },
        classes: 'mod-summary-list__blue',
      });

      return { activeRows, inactiveRows };
    },
    'daily-utilisation': (reportType, tableData) => {
      let rows = [];

      tableData.weeks.forEach((week) => {
        week.days.forEach((day) => {
          rows.push([
            {
              html: `<a class="govuk-link" href="${app.namedRoutes.build('reports.daily-utilisation-jurors.report.get', {
                filter: dateFilter(makeDate(day.date), null, 'yyyy-MM-DD'),
              })}">${dateFilter(makeDate(day.date), null, 'dddd D MMMM YYYY')}</a>`,
            },
            {
              text: day.jurorWorkingDays.toString(),
            },
            {
              text: day.sittingDays.toString(),
            },
            {
              text: day.attendanceDays.toString(),
            },
            {
              text: day.nonAttendanceDays.toString(),
            },
            {
              text: `${(Math.round(day.utilisation * 100) / 100).toString()}%`,
            },
          ]);
        });
        rows.push([
          {
            text: 'Weekly total',
            classes: 'govuk-!-padding-left-2 govuk-!-font-weight-bold mod-highlight-table-data__grey',
          },
          {
            text: week.weeklyTotalJurorWorkingDays.toString(),
            classes: 'govuk-!-font-weight-bold mod-highlight-table-data__grey',
          },
          {
            text: week.weeklyTotalSittingDays.toString(),
            classes: 'govuk-!-font-weight-bold mod-highlight-table-data__grey',
          },
          {
            text: week.weeklyTotalAttendanceDays.toString(),
            classes: 'govuk-!-font-weight-bold mod-highlight-table-data__grey',
          },
          {
            text: week.weeklyTotalNonAttendanceDays.toString(),
            classes: 'govuk-!-font-weight-bold mod-highlight-table-data__grey',
          },
          {
            text: `${(Math.round(week.weeklyTotalUtilisation * 100) / 100).toString()}%`,
            classes: 'govuk-!-font-weight-bold mod-highlight-table-data__grey',
          },
        ]);
      });
      rows.push([
        {
          text: 'Overall total',
          classes: 'govuk-!-padding-left-2 govuk-!-font-weight-bold mod-highlight-table-data__blue',
        },
        {
          text: tableData.overallTotalJurorWorkingDays.toString(),
          classes: 'govuk-!-font-weight-bold mod-highlight-table-data__blue',
        },
        {
          text: tableData.overallTotalSittingDays.toString(),
          classes: 'govuk-!-font-weight-bold mod-highlight-table-data__blue',
        },
        {
          text: tableData.overallTotalAttendanceDays.toString(),
          classes: 'govuk-!-font-weight-bold mod-highlight-table-data__blue',
        },
        {
          text: tableData.overallTotalNonAttendanceDays.toString(),
          classes: 'govuk-!-font-weight-bold mod-highlight-table-data__blue',
        },
        {
          text: `${(Math.round(tableData.overallTotalUtilisation * 100) / 100).toString()}%`,
          classes: 'govuk-!-font-weight-bold mod-highlight-table-data__blue',
        },
      ]);

      return [{headers: buildTableHeaders(reportType, tableData), rows: rows}];
    },
    'daily-utilisation-jurors': (reportType, tableData) => {
      let rows = [];

      tableData.jurors.forEach((juror) => {

        rows.push([
          {
            html: `<a href=${
              app.namedRoutes.build('juror-record.overview.get', {jurorNumber: juror.juror})
            }>${
              juror.juror
            }</a>`,
          },
          {
            text: juror.jurorWorkingDay.toString(),
          },
          {
            text: juror.sittingDay.toString(),
          },
          {
            text: juror.attendanceDay.toString(),
          },
          {
            text: juror.nonAttendanceDay.toString(),
          },
        ]);
      });
      rows.push([
        {
          text: 'Daily total',
          classes: 'govuk-!-padding-left-2 govuk-!-font-weight-bold mod-highlight-table-data__blue',
        },
        {
          text: tableData.totalJurorWorkingDays.toString(),
          classes: 'govuk-!-font-weight-bold mod-highlight-table-data__blue',
        },
        {
          text: tableData.totalSittingDays.toString(),
          classes: 'govuk-!-font-weight-bold mod-highlight-table-data__blue',
        },
        {
          text: tableData.totalAttendanceDays.toString(),
          classes: 'govuk-!-font-weight-bold mod-highlight-table-data__blue',
        },
        {
          text: tableData.totalNonAttendanceDays.toString(),
          classes: 'govuk-!-font-weight-bold mod-highlight-table-data__blue',
        },
      ]);

      return [{headers: buildTableHeaders(reportType, tableData), rows: rows}];
    },
    'jury-expenditure-high-level': (reportType, tableData) => {
      let tables = [];

      const tableHeaders = [
        {
          text: '',
        },
        {
          text: 'Loss of earnings',
        },
        {
          text: 'Food and drink',
        },
        {
          text: 'Smartcard',
        },
        {
          text: 'Travel',
        },
        {
          text: 'Total',
          format: 'numeric',
        },
      ];

      let overallTotal = 0;

      for (const [key, value] of Object.entries(tableData.data)) {
        const rows = value.map((data) => {

          let claimsRow = tableData.headings.filter((header) => header.id.includes('_count')).map(header => {
            let output = tableDataMappers[header.dataType](data[snakeToCamel(header.id)]);

            return ({
              text: output,
            });
          });

          let amountsRow = tableData.headings.filter((header) => header.id.includes('_sum')).map(header => {
            let output = tableDataMappers[header.dataType](data[snakeToCamel(header.id)]);

            if (header.id === 'total_approved_sum') {
              overallTotal += data[snakeToCamel(header.id)];
            }

            return ({
              text: output,
              format: header.id === 'total_approved_sum' ? 'numeric' : '',
            });
          });

          claimsRow.unshift({
            text: 'Claims',
            classes: 'govuk-body govuk-!-font-weight-bold',
          });
          claimsRow.push({
            text: '',
          });
          amountsRow.unshift({
            text: 'Amount',
            classes: 'govuk-body govuk-!-font-weight-bold',
          });

          return [claimsRow, amountsRow];
        });

        tables.push({
          title: key,
          headers: tableHeaders,
          rows: rows[0],
        });
      }

      if (tables.length) {
        tables.push({
          title: 'Total approved for this period',
          headers: [],
          rows: [[
            {
              text: 'Overall total',
              classes: 'govuk-!-padding-left-2 govuk-!-font-weight-bold mod-highlight-table-data__blue',
            },
            {
              text: `£${overallTotal}`,
              classes: 'govuk-!-padding-right-2 govuk-!-font-weight-bold mod-highlight-table-data__blue',
              format: 'numeric',
            },
          ]],
        });
      }

      return tables;
    },
    'prepare-monthly-utilisation': (tableData) => {
      let rows = [];

      tableData.months.forEach((month) => {
        rows.push([
          {
            text: month.month,
          },
          {
            text: month.jurorWorkingDays.toString(),
          },
          {
            text: month.sittingDays.toString(),
          },
          {
            text: month.attendanceDays.toString(),
          },
          {
            text: month.nonAttendanceDays.toString(),
          },
          {
            text: `${(Math.round(month.utilisation * 100) / 100).toString()}%`,
          },
        ]);
      });

      rows.push([
        {
          text: tableData.months.length > 1 ? 'Overall total' : '',
          classes: 'govuk-!-padding-left-2 govuk-!-font-weight-bold mod-highlight-table-data__blue',
        },
        {
          text: tableData.totalJurorWorkingDays.toString(),
          classes: 'govuk-!-font-weight-bold mod-highlight-table-data__blue',
        },
        {
          text: tableData.totalSittingDays.toString(),
          classes: 'govuk-!-font-weight-bold mod-highlight-table-data__blue',
        },
        {
          text: tableData.totalAttendanceDays.toString(),
          classes: 'govuk-!-font-weight-bold mod-highlight-table-data__blue',
        },
        {
          text: tableData.totalNonAttendanceDays.toString(),
          classes: 'govuk-!-font-weight-bold mod-highlight-table-data__blue',
        },
        {
          text: `${(Math.round(tableData.totalUtilisation * 100) / 100).toString()}%`,
          classes: 'govuk-!-font-weight-bold mod-highlight-table-data__blue',
        },
      ]);

      return rows;
    },
    'view-monthly-utilisation': (tableData) => {
      return bespokeReportBodys(app)['prepare-monthly-utilisation'](tableData);
    },
  };
};

module.exports.bespokeReportBodys = bespokeReportBodys;
