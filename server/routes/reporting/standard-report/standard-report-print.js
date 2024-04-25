/* eslint-disable strict */
const { generateDocument } = require('../../../lib/reports/single-generator');
const { tableDataMappers, constructPageHeading } = require('./utils');
const { snakeToCamel } = require('../../../lib/mod-utils');
const { reportKeys } = require('./definitions');

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
        let text = tableDataMappers[header.dataType](row[snakeToCamel(header.id)]);

        if (header.id === 'juror_postcode') {
          text = text.toUpperCase();
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

  try {
    const document = await generateDocument({
      title: reportData.title,
      footerText: reportData.title,
      metadata: {
        left: [...buildReportHeadings(reportData.headings.filter((v, index) => index % 2 === 0)).filter(item => item)],
        right: [...buildReportHeadings(reportData.headings.filter((v, index) => index % 2 === 1)).filter(item => item)],
      },
      tables: [
        {
          head: [...buildTableHeading(tableData.headings)],
          body: [...tableRows],
          footer: [],
        },
      ],
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
