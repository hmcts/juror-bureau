/* eslint-disable strict */
const { generateDocument } = require('../../../lib/reports/single-generator');
const { tableDataMappers, constructPageHeading } = require('./utils');
const { snakeToCamel } = require('../../../lib/mod-utils');
const { reportKeys } = require('./definitions');
// const { renderPoolStatusReport } = require('../../../lib/reports/pool-status');

async function standardReportPrint(app, req, res, reportKey, data) {
  const reportData = reportKeys(app, req)[reportKey];

  const { headings, tableData } = data;

  const buildReportHeadings = (pageHeadings) => pageHeadings.map(heading => {
    if (heading === '') {
      return null;
    }

    const headingData = constructPageHeading(heading, headings);

    return { key: headingData.title, value: headingData.data };
  });

  const buildTableHeading = (tableHeadings) => tableHeadings.map(heading => {
    return { text: heading.name, style: 'label' };
  });

  const buildStandardTableRows = function(rows, tableHeadings) {
    return [
      ...rows.map(row => tableHeadings.map(header => {
        let text = tableDataMappers[header.dataType](row[snakeToCamel(header.id)]) || '-';

        if (header.id === 'juror_postcode' || header.id === 'document_code') {
          text = text.toUpperCase();
        }
        if (header.id === 'contact_details') {
          const details = text.split(', ');
          let contactText = '';

          details.forEach((element) => {
            contactText = contactText
              + `${
                element
              }\n`;
          });
          return ({
            text: contactText,
          });
        }

        return { text };
      })),
    ];
  };

  let tableRows = [];

  if (reportData.grouped) {
    for (const [heading, rowData] of Object.entries(tableData.data)) {
      const group = buildStandardTableRows(rowData, tableData.headings);
      const headRow = [
        { text: (reportData.grouped.headings.prefix || '') + heading, style: 'groupHeading' },
      ];
      let totalsRow;

      if (reportData.grouped.totals) {
        totalsRow = [{ text: `Total: ${group.length}`, style: 'label' }];
      }

      for (let i=0; i<tableData.headings.length - 1; i++) {
        headRow.push({});
        if (totalsRow) {
          totalsRow.push({});
        }
      }
      tableRows = tableRows.concat(totalsRow ? [headRow, ...group, totalsRow] : [headRow, ...group]);
    }
  } else {
    tableRows = buildStandardTableRows(tableData.data, tableData.headings);
  }

  let reportBody;

  if (reportData.bespokeReportBody) {
    reportBody = renderPoolStatusReport(data);
  } else {
    reportBody = [
      {
        head: [...buildTableHeading(tableData.headings)],
        body: [...tableRows],
        footer: [],
      },
    ];
  }

  try {
    const document = await generateDocument({
      title: reportData.title,
      footerText: reportData.title,
      metadata: {
        left: [...buildReportHeadings(reportData.headings.filter((v, index) => index % 2 === 0)).filter(item => item)],
        right: [...buildReportHeadings(reportData.headings.filter((v, index) => index % 2 === 1)).filter(item => item)],
      },
      tables: reportBody,
    }, {
      pageOrientation: reportData.printLandscape ? 'landscape' : 'portrait',
    });

    res.contentType('application/pdf');
    return res.send(document);
  } catch (err) {
    app.logger.crit('Something went wrong when generating the report', {
      auth: req.session.authentication,
      jwt: req.session.authToken,
      error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
    });

    return res.render('_errors/generic.njk');
  }
};

module.exports = {
  standardReportPrint,
};

function renderPoolStatusReport(data) {
  const activeRowHeaders = ['responded_total', 'summons_total', 'panel_total', 'juror_total'];
  const { headings, tableData } = data;

  const buildTableHeading = (tableHeadings) => tableHeadings.map(heading => {
    return { text: heading.name, style: 'label' };
  });

  let tableRows = [];

  // console.log(tableData.data);

  let activeRows = [];
  let totalActive = 0;
  let inactiveRows = [];
  let totalInactive = 0;

  tableData.headings.forEach(header => {
    let text = tableDataMappers[header.dataType](tableData.data[0][snakeToCamel(header.id)]) || '-';
    const row = [ { text: header.name, bold: true }, text ];

    if (activeRowHeaders.includes(header.id)) {
      activeRows.push(row);
      totalActive += tableData.data[0][snakeToCamel(header.id)];
    } else {
      inactiveRows.push(row);
      totalInactive += tableData.data[0][snakeToCamel(header.id)];
    }
  });

  activeRows.push([ { text: 'Total active', bold: true, fillColor: '#eeeeee' }, {text: totalActive, fillColor: '#eeeeee'} ]);
  inactiveRows.push([ { text: 'Total inactive', bold: true, fillColor: '#eeeeee' }, {text: totalInactive, fillColor: '#eeeeee'} ]);

  tableRows = [ [{ text: 'Active pool members', bold: true, colSpan: 2 }, {}], ...activeRows, [{ text: 'Inactive pool members', bold: true, colSpan: 2 }, {}], ...inactiveRows ];

  console.log(tableRows);

  // body: [
  //   [ 'First', 'Second', 'Third', 'The last one' ],
  //   [ 'Value 1', 'Value 2', 'Value 3', 'Value 4' ],
  //   [ { text: 'Bold value', bold: true }, 'Val 2', 'Val 3', 'Val 4' ],
  // ];

  return [
    {
      // head: [{}, {}],
      body: [...tableRows],
      widths: ['25%', '25%'],
      // footer: [],
    },
  ];
};
