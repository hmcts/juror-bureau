/* eslint-disable strict */
const moment = require('moment');
const { dateFilter, makeDate, toMoney, capitalizeFully } = require('../../../components/filters');
const { snakeToCamel } = require('../../../lib/mod-utils');
const { tableDataMappers, buildTableHeaders, sort  } = require('../standard-report/utils');

const bespokeReportBodys = (app, req) => {
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
    'unpaid-attendance-detailed': (reportType, tableData) => {
      const sortBy = req.query.sortBy || 'lastName';
      const sortDirection = req.query.sortDirection || 'ascending';

      let rows = [];

      for (const [header, data] of Object.entries(tableData.data)) {
        let counter = 0;
        const poolTrialLink = header.includes('Pool')
        ? app.namedRoutes.build('pool-overview.get', {
          poolNumber: header.replace('Pool ',''),
        })
        : app.namedRoutes.build('trial-management.trials.detail.get', {
          trialNumber: header.replace('Trial ',''),
          locationCode: req.session.authentication.locCode,
        })
        rows.push([
          {
            html: `<a class="govuk-link" href="${poolTrialLink}">${header}</a>`,
            classes: 'govuk-heading-m mod-table-no-border govuk-!-padding-top-5 govuk-!-margin-bottom-0 govuk-!-padding-bottom-0',
            colspan: 6,
          },
        ])
        for (const [key, value] of Object.entries(data)) {
          counter += value.length;
          rows.push([
            {
              text: dateFilter(makeDate(key), null, 'dddd D MMMM YYYY'),
              classes: 'govuk-body-l govuk-!-padding-top-5',
              colspan: 6,
            }
          ])
          value.sort(sort(sortBy, sortDirection));
          value.forEach((juror) => {
            let auditNumber = '-'
            if (juror.auditNumber.charAt(0) === 'J') {
              auditNumber = `<a class="govuk-link" href="${app.namedRoutes.build('reports.jury-attendance-audit.report.print', {filter: juror.auditNumber})}" target="_blank">${juror.auditNumber}</a>`
            } else if (juror.auditNumber.charAt(0) === 'P') {
              auditNumber = `<a class="govuk-link" href="${app.namedRoutes.build('reports.pool-attendance-audit.report.print', {filter: juror.auditNumber})}" target="_blank">${juror.auditNumber}</a>`
            }
            rows.push([
              {
                html: `<a class="govuk-link" href="${app.namedRoutes.build('juror-record.overview.get', {jurorNumber: juror.jurorNumber})}">${juror.jurorNumber}</a>`,
              },
              {
                text: juror.firstName,
              },
              {
                text: juror.lastName,
              },
              {
                html: auditNumber,
              },
              {
                text: capitalizeFully(juror.attendanceType.replace('_', ' ')),
              },
              {
                text: juror.expenseStatus
              }
            ])
          });
          rows.push([{
            text: `Total: ${value.length}`,
            colspan: 6,
            classes: 'govuk-!-font-weight-bold',
          }]);
        }
        rows.push([{
          text: `Total unpaid attendences for ${header}: ${counter}`,
          colspan: 6,
          classes: 'govuk-!-font-weight-bold mod-table-no-border mod-highlight-table-data__grey',
        }])
      }

      return [{headers: buildTableHeaders(reportType, tableData.headings, { sortBy, sortDirection }), rows: rows}];
    },
    'daily-utilisation': (reportType, tableData) => {
      const sortBy = req.query.sortBy || 'date';
      const sortDirection = req.query.sortDirection || 'ascending';
      let rows = [];

      tableData.weeks.forEach((week) => {
        week.days.sort(sort(sortBy, sortDirection));
        week.days.forEach((day) => {
          rows.push([
            {
              html: `<a class="govuk-link" href="${app.namedRoutes.build('reports.daily-utilisation-jurors.report.get', {
                filter: dateFilter(makeDate(day.date), null, 'yyyy-MM-DD'),
              })}">${dateFilter(makeDate(day.date), null, 'dddd D MMMM YYYY')}</a>`,
              attributes: {
                'data-sort-value': dateFilter(makeDate(day.date), null, 'yyyy-MM-DD'),
              }
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

      return [{headers: buildTableHeaders(reportType, tableData.headings, { sortBy, sortDirection }), rows: rows}];
    },
    'daily-utilisation-jurors': (reportType, tableData) => {
      const sortBy = req.query.sortBy || 'juror';
      const sortDirection = req.query.sortDirection || 'ascending';
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
          attributes: {
            'data-fixed-index': tableData.jurors.length,
          }
        },
        {
          text: tableData.totalJurorWorkingDays.toString(),
          classes: 'govuk-!-font-weight-bold mod-highlight-table-data__blue',
          attributes: {
            'data-fixed-index': tableData.jurors.length,
          }
        },
        {
          text: tableData.totalSittingDays.toString(),
          classes: 'govuk-!-font-weight-bold mod-highlight-table-data__blue',
          attributes: {
            'data-fixed-index': tableData.jurors.length,
          }
        },
        {
          text: tableData.totalAttendanceDays.toString(),
          classes: 'govuk-!-font-weight-bold mod-highlight-table-data__blue',
          attributes: {
            'data-fixed-index': tableData.jurors.length,
          }
        },
        {
          text: tableData.totalNonAttendanceDays.toString(),
          classes: 'govuk-!-font-weight-bold mod-highlight-table-data__blue',
          attributes: {
            'data-fixed-index': tableData.jurors.length,
          }
        },
      ]);

      return [{headers: buildTableHeaders(reportType, tableData.headings, { sortBy, sortDirection }), rows: rows}];
    },
    'prepare-monthly-utilisation': (reportType, tableData) => {
      let rows = [];

      tableData.months.forEach((month) => {
        rows.push([
          {
            text: month.month,
            attributes: {
              "data-sort-value": dateFilter(month.month, 'mmmm yyyy', 'yyyy-MM-DD')
            }
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
          attributes: {
            'data-fixed-index': tableData.months.length,
          },
        },
        {
          text: tableData.totalJurorWorkingDays.toString(),
          classes: 'govuk-!-font-weight-bold mod-highlight-table-data__blue',
          attributes: {
            'data-fixed-index': tableData.months.length,
          },
        },
        {
          text: tableData.totalSittingDays.toString(),
          classes: 'govuk-!-font-weight-bold mod-highlight-table-data__blue',
          attributes: {
            'data-fixed-index': tableData.months.length,
          },
        },
        {
          text: tableData.totalAttendanceDays.toString(),
          classes: 'govuk-!-font-weight-bold mod-highlight-table-data__blue',
          attributes: {
            'data-fixed-index': tableData.months.length,
          },
        },
        {
          text: tableData.totalNonAttendanceDays.toString(),
          classes: 'govuk-!-font-weight-bold mod-highlight-table-data__blue',
          attributes: {
            'data-fixed-index': tableData.months.length,
          },
        },
        {
          text: `${(Math.round(tableData.totalUtilisation * 100) / 100).toString()}%`,
          classes: 'govuk-!-font-weight-bold mod-highlight-table-data__blue',
          attributes: {
            'data-fixed-index': tableData.months.length,
          },
        },
      ]);

      return [{headers: buildTableHeaders(reportType, tableData.headings), rows: rows}];
    },
    'view-monthly-utilisation': (reportType, tableData) => {
      return bespokeReportBodys(app)['prepare-monthly-utilisation'](reportType, tableData);
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
              text: toMoney(overallTotal),
              classes: 'govuk-!-padding-right-2 govuk-!-font-weight-bold mod-highlight-table-data__blue',
              format: 'numeric',
            },
          ]],
        });
      }

      return tables;
    },
    'jury-expenditure-mid-level': (reportType, tableData) => {
      let tables = [];
      let overallTotal = 0;
      let bacsTotal = 0;
      let cashTotal = 0;

      for (const [key, value] of Object.entries(tableData.data)) {
        const rows = [];
        value.forEach((data) => {
          let dateRow = [{
            text: dateFilter(data['createdOnDate'], 'yyyy-MM-DD', 'dddd D MMM YYYY'),
            colspan: 2,
            classes: 'govuk-!-padding-top-7 govuk-body-l govuk-!-font-weight-bold',
          }]

          let subTotalRow = data['totalApprovedSum'] && data['totalApprovedSum'] !== 0 ? [
            {
              text: 'Daily sub total',
              classes: 'govuk-!-font-weight-bold mod-highlight-table-data__grey'
            },
            {
            text: tableDataMappers['BigDecimal'](data['totalApprovedSum']),
            format: 'numeric',
            classes: 'govuk-!-font-weight-bold mod-highlight-table-data__grey'
            }
          ] : [
            {
              text: 'No payments authorised',
              classes: 'govuk-hint mod-table-no-border',
              colspan: 2
            },
          ]

          if (key === 'BACS and cheque approvals') {
            bacsTotal += data['totalApprovedSum'];
          } else {
            cashTotal += data['totalApprovedSum'];
          }
          overallTotal += data['totalApprovedSum'];

          rows.push(dateRow, subTotalRow);
        });

        tables.push({
          title: key,
          headers: [],
          rows: rows,
        });
      }
      if (tables.length) {
        tables.push({
          title: 'Total approved for this period',
          headers: [],
          rows: [
            [
              {
                text: 'Bacs and cheque',
                classes: 'govuk-!-padding-left-2 govuk-!-font-weight-bold mod-highlight-table-data__grey',
              },
              {
                text: toMoney(bacsTotal),
                classes: 'govuk-!-padding-right-2 govuk-!-font-weight-bold mod-highlight-table-data__grey',
                format: 'numeric',
              },
            ],
            [
              {
                text: 'Cash',
                classes: 'govuk-!-padding-left-2 govuk-!-font-weight-bold mod-highlight-table-data__grey',
              },
              {
                text: toMoney(cashTotal),
                classes: 'govuk-!-padding-right-2 govuk-!-font-weight-bold mod-highlight-table-data__grey',
                format: 'numeric',
              },
            ],
            [
              {
                text: 'Overall total',
                classes: 'govuk-!-padding-left-2 govuk-!-font-weight-bold mod-highlight-table-data__blue',
              },
              {
                text: toMoney(overallTotal),
                classes: 'govuk-!-padding-right-2 govuk-!-font-weight-bold mod-highlight-table-data__blue',
                format: 'numeric',
              },
            ],
          ],
        });
      }

      return tables;
    },
  };
};

module.exports.bespokeReportBodys = bespokeReportBodys;
