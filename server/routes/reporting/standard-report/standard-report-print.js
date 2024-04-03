/* eslint-disable strict */
const { generateDocument } = require('../../../lib/reports/single-generator');
const { reportKeys, headingDataMappers, tableDataMappers } = require('./utils');
const { snakeToCamel } = require('../../../lib/mod-utils');

async function standardReportPrint(app, req, res, reportKey, data) {
  const reportData = reportKeys[reportKey];

  const { headings, tableData } = data;

  const buildReportHeadings = (pageHeadings) => pageHeadings.map(heading => {
    if (heading === 'reportDate') {
      return { key: 'Report created', value: headingDataMappers.LocalDate(headings.reportCreated.value) };
    } else if (heading === 'reportTime') {
      return { key: 'Time created', value: headingDataMappers.timeFromISO(headings.reportCreated.value) };
    }

    const _key = headings[heading].displayName;
    const _value = headings[heading].value;

    return { key: _key, value: _value };
  });

  const buildTableHeading = (tableHeadings) => tableHeadings.map(heading => {
    return { text: heading.name, style: 'label' };
  });

  const tableRows = [
    ...tableData.data.map(row => tableData.headings.map(header => {
      let text = tableDataMappers[header.dataType](row[snakeToCamel(header.id)]);

      if (header.id === 'postcode') {
        text = text.toUpperCase();
      }

      return { text };
    })),
  ];

  try {
    const document = await generateDocument({
      title: reportData.title,
      footerText: reportData.title,
      metadata: {
        left: [...buildReportHeadings(reportData.pageHeadings.left)],
        right: [...buildReportHeadings(reportData.pageHeadings.right)],
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
    app.logger.crit('Something went wrong when generatig the report', {
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
