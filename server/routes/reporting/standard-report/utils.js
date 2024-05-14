/* eslint-disable strict */
const { dateFilter, capitalizeFully, toSentenceCase } = require('../../../components/filters');
const { snakeToCamel } = require('../../../lib/mod-utils');

const tableDataMappers = {
  String: (data) => isNaN(data) ? capitalizeFully(data) : data.toString(),
  LocalDate: (data) => data ? dateFilter(data, 'YYYY-mm-dd', 'ddd D MMM YYYY') : '-',
  List: (data) => {
    if (data) {
      if (Object.keys(data)[0] === 'jurorAddressLine1'){
        return Object.values(data).reduce(
          (acc, current) => {
            return acc + ', ' + current;
          },
        );
      }
      let listText = '';

      Object.keys(data).forEach((element, index) => {
        listText = listText
          + `${toSentenceCase(element)}: ${data[element]}`
          + `${index === Object.keys(data).length - 1 ? '' : ', '}`;
      });
      return listText;
    }
    return '-';
  },
  Long: (data) => data.toString(),
  Integer: (data) => data.toString(),
};

const headingDataMappers = {
  String: (data) => capitalizeFully(data),
  LocalDate: (data) => dateFilter(data, 'YYYY-mm-dd', 'dddd D MMMM YYYY'),
  timeFromISO: (data) => {
    const time = data.split('T')[1].split('.')[0];

    if (parseInt(time.split(':')[0]) === 12) {
      return time + 'pm';
    } else if (parseInt(time.split(':')[0]) > 12) {
      return `${parseInt(time.split(':')[0]) - 12}:${time.split(':').slice(1).join(':')}pm`;
    }

    return time + 'am';
  },
  Integer: (data) => data,
  Long: (data) => data.toString(),
};

const constructPageHeading = (headingType, data) => {
  if (headingType === 'reportDate') {
    return { title: 'Report created', data: headingDataMappers.LocalDate(data.reportCreated.value) };
  } else if (headingType === 'reportTime') {
    return { title: 'Time created', data: headingDataMappers.timeFromISO(data.reportCreated.value) };
  }
  const headingData = data[headingType];

  if (headingData) {
    return { title: headingData.displayName, data: headingDataMappers[headingData.dataType](headingData.value)};
  }

  return {};
};

const bespokeReportBodys = {
  'pool-status': (tableData, tableHeadings) => {
    const activeRowHeaders = ['responded_total', 'summons_total', 'panel_total', 'juror_total'];
    let activeRows = [];
    let totalActive = 0;
    let inactiveRows = [];
    let totalInactive = 0;

    tableData.forEach(data => {
      tableHeadings.forEach(header => {
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
};

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
};

module.exports.tableDataMappers = tableDataMappers;
module.exports.constructPageHeading = constructPageHeading;
module.exports.bespokeReportBodys = bespokeReportBodys;
module.exports.bespokeReportTablePrint = bespokeReportTablePrint;
