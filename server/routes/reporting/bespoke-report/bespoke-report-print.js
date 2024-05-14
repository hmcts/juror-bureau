/* eslint-disable strict */
const { dateFilter } = require('../../../components/filters');
const { snakeToCamel } = require('../../../lib/mod-utils');

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
            text: dateFilter(day.date, null, 'dddd D MMMM YYYY'),
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
};

module.exports.bespokeReportTablePrint = bespokeReportTablePrint;
