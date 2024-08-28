/* eslint-disable strict */
const moment = require('moment');
const { dateFilter, makeDate, capitalizeFully } = require('../../../components/filters');
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
  'unpaid-attendance-detailed': (data, app, req) => {
      const _sortBy = req.query.sortBy || 'lastName';
      const _sortDirection= req.query.sortDirection || 'ascending';
      const poolTrial = []
      poolTrial.push({
        body: [[
          {text: 'Juror Number ', style: 'sectionHeading'},
          {text: 'First Name ', style: 'sectionHeading'},
          {text: 'Last Name ', style: 'sectionHeading'},
          {text: 'Audit Number ', style: 'sectionHeading'},
          {text: 'Attendance ', style: 'sectionHeading'},
          {text: 'Expense Status ', style: 'sectionHeading'},
        ]],
        widths:[`${100/6}%`, `${100/6}%`, `${100/6}%`, `${100/6}%`, `${100/6}%`, `${100/6}%`],
        margin: [0, 10, 0, 0],
      })
      for (const [key, value] of Object.entries(data.tableData.data)) {
        let counter = 0;
        poolTrial.push({
          body: [[{text: key, style: 'sectionHeading'}]],
          widths: '100%',
          margin: [0, 10, 0, 0],
          layout: {hLineColor: '#ffffff'},
        });
        for (const [date, jurors] of Object.entries(value)) {
          poolTrial.push({
            body: [[
              {text: dateFilter(date, 'DD-MM-YYYY', 'dddd DD MMMM YYYY'), style: 'sectionSubHeading'},
            ]],
            widths:['100%'],
            margin: [0, 0, 0, 0],
          });
          jurors.sort(sort(_sortBy, _sortDirection));
          jurors.forEach(function(juror) {
            poolTrial.push({
              body: [[
                {text: juror.jurorNumber},
                {text: juror.firstName},
                {text: juror.lastName},
                {text: juror.auditNumber ? juror.auditNumber : '-'},
                {text: capitalizeFully(juror.attendanceType.replace('_',' '))},
                {text: juror.expenseStatus},
              ]],
              widths:[`${100/6}%`, `${100/6}%`, `${100/6}%`, `${100/6}%`, `${100/6}%`, `${100/6}%`],
              margin: [0, 0, 0, 0],
            })
          })
          poolTrial.push({
            body: [[
              {text: 'Total: ' + jurors.length, style: 'label' },
            ]],
            layout: { hLineColor: '#FFFFFF' },
            widths:['100%'],
            margin: [0, 0, 0, 0],
          })
          counter += jurors.length;
        }
        poolTrial.push({
          body: [[
            {text: 'Total unpaid attendances for ' + key + ': ' + counter, style: 'label', fillColor: '#F3F2F1'},
          ]],
          widths:['100%'],
          margin: [0, 0, 0, 0],
          layout: { hLineColor: '#FFFFFF' },
        })
      }
  
      return [...poolTrial]
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
  'jury-expenditure-mid-level': (data) => {
    const { tableData } = data;
    let tables = [];
    let overallTotal = 0;
      let bacsTotal = 0;
      let cashTotal = 0;

    for (const [key, value] of Object.entries(tableData.data)) {
      const rows = []
      value.forEach((data) => {
        let dateRow = [
          {
            text: dateFilter(data['createdOnDate'], 'yyyy-MM-DD', 'dddd D MMM YYYY'),
            style: 'groupHeading',
            colspan: 2,
          },
          {}
        ]

        let subTotalRow = data['totalApprovedSum'] && data['totalApprovedSum'] ? [
          {
            text: 'Daily sub total',
            bold: true,
            fillColor: '#F3F2F1'
          },
          {
            text: tableDataMappers['BigDecimal'](data['totalApprovedSum']),
            bold: true,
            fillColor: '#F3F2F1',
            alignment: 'right',
          }
        ] : [
          {
            text: 'No payments authorised',
            color: '#505A5F',
            colspan: 2
          },
          {}
        ]

        if (key === 'BACS and cheque approvals') {
          bacsTotal += data['totalApprovedSum'];
        } else {
          cashTotal += data['totalApprovedSum'];
        }
        overallTotal += data['totalApprovedSum'];

        rows.push(dateRow, subTotalRow);
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
          body: rows,
          widths: ['*', '*'],
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
          { text: 'Bacs and cheque', bold: true, fillColor: '#F3F2F1' },
          { text: `£${bacsTotal}`, bold: true, alignment: 'right', fillColor: '#F3F2F1' },
        ]],
        widths:['50%', '50%'],
        margin: [0, 0, 0, 0],
      },
      {
        body: [[
          { text: 'Cash', bold: true, fillColor: '#F3F2F1' },
          { text: `£${cashTotal}`, bold: true, alignment: 'right', fillColor: '#F3F2F1' },
        ]],
        widths:['50%', '50%'],
        margin: [0, 0, 0, 0],
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

function sort(sortBy, sortDirection) {
  return (a, b) => {
    const [_a, _b] = formatSortableData(a, b, sortBy);
      
    if (isNumber(_a) && isNumber(_b)) {
      return sortDirection === 'descending' ? _b - _a : _a - _b;
    }

    if (sortDirection === 'descending') {
      return _b.localeCompare(_a);
    } else {
      return _a.localeCompare(_b);
    }
  }
}

function formatSortableData(a, b, sortBy) {
  let _a = a[snakeToCamel(sortBy)] || '-';
  let _b = b[snakeToCamel(sortBy)] || '-';

  if (sortBy === 'jurorPostalAddress') {
    _a = Object.values(a.jurorPostalAddress).join(' ');
    _b = Object.values(b.jurorPostalAddress).join(' ');
  }

  if (sortBy === 'jurorReasonableAdjustmentWithMessage') {
    _a = a.jurorReasonableAdjustmentWithMessage
      ? Object.values(a.jurorReasonableAdjustmentWithMessage).join(' ') : '-';
    _b = b.jurorReasonableAdjustmentWithMessage
      ? Object.values(b.jurorReasonableAdjustmentWithMessage).join(' ') : '-';
  }

  if (sortBy === 'contactDetails') {
    _a = a.contactDetails ? Object.values(a.contactDetails).join(' ') : '-';
    _b = b.contactDetails ? Object.values(b.contactDetails).join(' ') : '-';
  }

  if (sortBy === 'month') {
    _a = dateFilter(a.month, 'mmmm yyyy', 'yyyy-MM-DD');
    _b = dateFilter(b.month, 'mmmm yyyy', 'yyyy-MM-DD');
  }

  return [_a.toString(), _b.toString()];
}

function isNumber(n) {
  return !isNaN(parseFloat(n)) && !(moment(n, 'yyyy-MM-DD', true).isValid());
}

module.exports.bespokeReportTablePrint = bespokeReportTablePrint;
