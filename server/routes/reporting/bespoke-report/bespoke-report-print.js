/* eslint-disable strict */
const { dateFilter, makeDate } = require('../../../components/filters');
const { snakeToCamel } = require('../../../lib/mod-utils');
const { tableDataMappers } = require('../standard-report/utils');

const bespokeReportTablePrint = {
  'pool-status': (data) => {
    const activeRowHeaders = ['responded_total', 'summons_total', 'panel_total', 'juror_total'];
    const { tableData } = data;
    let activeRows = [];
    let totalActive = 0;
    let inactiveRows = [];
    let totalInactive = 0;

    tableData.headings.forEach(header => {
      let text = tableDataMappers[header.dataType](tableData.data[0][snakeToCamel(header.id)]) || '-';
      const row = [ { text: `${header.name}`, bold: true }, text ];

      if (activeRowHeaders.includes(header.id)) {
        activeRows.push(row);
        totalActive += tableData.data[0][snakeToCamel(header.id)];
      } else {
        inactiveRows.push(row);
        totalInactive += tableData.data[0][snakeToCamel(header.id)];
      }
    });

    activeRows.push([
      { text: 'Total active', bold: true, fillColor: '#0b0c0c', color: '#ffffff' },
      { text: totalActive, fillColor: '#0b0c0c', color: '#ffffff' },
    ]);
    inactiveRows.push([
      { text: 'Total inactive', bold: true, fillColor: '#0b0c0c', color: '#ffffff' },
      { text: totalInactive, fillColor: '#0b0c0c', color: '#ffffff' },
    ]);

    return [
      {
        body: [[
          {text: 'Active pool members ', style: 'sectionHeading', colSpan: 2},
          {},
        ]],
        widths:['50%', '50%'],
        layout: { hLineColor: '#0b0c0c' },
        margin: [0, 10, 0, 0],
      },
      {
        body: [...activeRows],
        widths: ['25%', '25%'],
        layout: { paddingLeft: () => 4 },
        margin: [0, 0, 0, 0],
      },
      {
        body: [[
          { text: 'Inactive pool members ', style: 'sectionHeading', colSpan: 2 },
          {},
        ]],
        widths:['50%', '50%'],
        layout: { hLineColor: '#0b0c0c' },
        margin: [0, 10, 0, 0],
      },
      {
        body: [...inactiveRows],
        widths: ['25%', '25%'],
        layout: { paddingLeft: () => 4 },
        margin: [0, 0, 0, 0],
      },
    ];
  },
  'daily-utilisation': (data) => {
    const { tableData } = data;
    let rows = [];

    tableData.weeks.forEach((week) => {
      week.days.forEach((day) => {
        rows.push([
          {
            text: dateFilter(makeDate(day.date), null, 'dddd D MMMM YYYY'),
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
          text: 'Weekly total', bold: true, fillColor: '#F3F2F1',
        },
        {
          text: week.weeklyTotalJurorWorkingDays.toString(), bold: true, fillColor: '#F3F2F1',
        },
        {
          text: week.weeklyTotalSittingDays.toString(), bold: true, fillColor: '#F3F2F1',
        },
        {
          text: week.weeklyTotalAttendanceDays.toString(), bold: true, fillColor: '#F3F2F1',
        },
        {
          text: week.weeklyTotalNonAttendanceDays.toString(), bold: true, fillColor: '#F3F2F1',
        },
        {
          text: `${(Math.round(week.weeklyTotalUtilisation * 100) / 100).toString()}%`,
          bold: true,
          fillColor: '#F3F2F1',
        },
      ]);
    });
    rows.push([
      {
        text: 'Overall total', bold: true, fillColor: '#0b0c0c', color: '#ffffff',
      },
      {
        text: tableData.overallTotalJurorWorkingDays.toString(), bold: true, fillColor: '#0b0c0c', color: '#ffffff',
      },
      {
        text: tableData.overallTotalSittingDays.toString(), bold: true, fillColor: '#0b0c0c', color: '#ffffff',
      },
      {
        text: tableData.overallTotalAttendanceDays.toString(), bold: true, fillColor: '#0b0c0c', color: '#ffffff',
      },
      {
        text: tableData.overallTotalNonAttendanceDays.toString(), bold: true, fillColor: '#0b0c0c', color: '#ffffff',
      },
      {
        text: `${(Math.round(tableData.overallTotalUtilisation * 100) / 100).toString()}%`,
        bold: true,
        fillColor: '#0b0c0c',
        color: '#ffffff',
      },
    ]);

    return  [
      {
        head: [...tableData.headings.map(heading => {
          return { text: heading.name, style: 'label' };
        })],
        body: [...rows],
        footer: [],
      },
    ];
  },
  'daily-utilisation-jurors': (data) => {
    const { tableData } = data;
    let rows = [];

    tableData.jurors.forEach((juror) => {
      rows.push([
        {
          text: juror.juror,
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
        text: 'Daily total', bold: true, fillColor: '#0b0c0c', color: '#ffffff',
      },
      {
        text: tableData.totalJurorWorkingDays.toString(), bold: true, fillColor: '#0b0c0c', color: '#ffffff',
      },
      {
        text: tableData.totalSittingDays.toString(), bold: true, fillColor: '#0b0c0c', color: '#ffffff',
      },
      {
        text: tableData.totalAttendanceDays.toString(), bold: true, fillColor: '#0b0c0c', color: '#ffffff',
      },
      {
        text: tableData.totalNonAttendanceDays.toString(), bold: true, fillColor: '#0b0c0c', color: '#ffffff',
      },
    ]);

    return  [
      {
        head: [...tableData.headings.map(heading => {
          return { text: heading.name, style: 'label' };
        })],
        body: [...rows],
        footer: [],
      },
    ];
  },
  'prepare-monthly-utilisation': (data) => {
    const { tableData } = data;
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
        text: tableData.months.length > 1 ? 'Overall total' : '', bold: true, fillColor: '#0b0c0c', color: '#ffffff',
      },
      {
        text: tableData.totalJurorWorkingDays.toString(), bold: true, fillColor: '#0b0c0c', color: '#ffffff',
      },
      {
        text: tableData.totalSittingDays.toString(), bold: true, fillColor: '#0b0c0c', color: '#ffffff',
      },
      {
        text: tableData.totalAttendanceDays.toString(), bold: true, fillColor: '#0b0c0c', color: '#ffffff',
      },
      {
        text: tableData.totalNonAttendanceDays.toString(), bold: true, fillColor: '#0b0c0c', color: '#ffffff',
      },
      {
        text: `${(Math.round(tableData.totalUtilisation * 100) / 100).toString()}%`,
        bold: true,
        fillColor: '#0b0c0c',
        color: '#ffffff',
      },
    ]);

    return [
      {
        head: [...tableData.headings.map(heading => {
          return { text: heading.name, style: 'label' };
        })],
        body: [...rows],
        footer: [],
      },
    ];
  },
  'view-monthly-utilisation': (data) => {
    return bespokeReportTablePrint['prepare-monthly-utilisation'](data);
  },
  'jury-expenditure-high-level': (data) => {
    const { tableData } = data;
    let tables = [];
    let overallTotal = 0;

    for (const [key, value] of Object.entries(tableData.data)) {
      const rows = value.map((data) => {
        const claimsRow = tableData.headings.filter((header) => header.id.includes('_count')).map(header => {
          const output = tableDataMappers[header.dataType](data[snakeToCamel(header.id)]);

          return ({
            text: output,
            alignment: 'right',
          });
        });

        const amountsRow = tableData.headings.filter((header) => header.id.includes('_sum')).map(header => {
          const output = tableDataMappers[header.dataType](data[snakeToCamel(header.id)]);

          if (header.id === 'total_approved_sum') {
            overallTotal += data[snakeToCamel(header.id)];
          }

          return ({
            text: output,
            alignment: 'right',
          });
        });

        claimsRow.unshift({ text: 'Claims', bold: true });
        claimsRow.push({
          text: '',
        });
        amountsRow.unshift({ text: 'Amount', bold: true });

        return [claimsRow, amountsRow];
      });

      tables.push(
        {
          body: [[
            {text: key, style: 'largeSectionHeading'},
          ]],
          widths:['100%'],
          layout: { hLineColor: '#0b0c0c' },
          margin: [0, 10, 0, 0],
        },
        {
          head: [
            {
              text: '',
              style: 'label',
            },
            {
              text: 'Loss of earnings',
              style: 'label',
              alignment: 'right',
            },
            {
              text: 'Food and drink',
              style: 'label',
              alignment: 'right',
            },
            {
              text: 'Smartcard',
              style: 'label',
              alignment: 'right',
            },
            {
              text: 'Travel',
              style: 'label',
              alignment: 'right',
            },
            {
              text: 'Total',
              style: 'label',
              alignment: 'right',
            },
          ],
          body: rows[0],
          margin: [0, 0, 0, 0],
        }
      );
    }
    tables.push(
      {
        body: [[
          {text: 'Total approved for this period', style: 'largeSectionHeading'},
        ]],
        widths:['100%'],
        layout: { hLineColor: '#0b0c0c' },
        margin: [0, 10, 0, 0],
      },
      {
        body: [[
          { text: 'Overall total', bold: true, fillColor: '#0b0c0c', color: '#ffffff' },
          { text: `£${overallTotal}`, bold: true, alignment: 'right', fillColor: '#0b0c0c', color: '#ffffff' },
        ]],
        widths:['50%', '50%'],
        margin: [0, 0, 0, 0],
      }
    );

    return tables;
  },
};

module.exports.bespokeReportTablePrint = bespokeReportTablePrint;
