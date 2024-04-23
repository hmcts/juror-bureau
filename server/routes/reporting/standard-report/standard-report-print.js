/* eslint-disable strict */
const { generateDocument } = require('../../../lib/reports/single-generator');
const { reportKeys, tableDataMappers, constructPageHeading } = require('./utils');
const { snakeToCamel } = require('../../../lib/mod-utils');

async function standardReportPrint(app, req, res, reportKey, data) {
  const reportData = reportKeys[reportKey];

  const { headings, tableData } = data;

  const buildReportHeadings = (pageHeadings) => pageHeadings.map(heading => {
    const headingData = constructPageHeading(heading, headings);

    return { key: headingData.title, value: headingData.data };
  });

  const buildTableHeading = (tableHeadings) => tableHeadings.map(heading => {
    return { text: heading.name, style: 'label' };
  });

  const tableRows = [
    ...tableData.data.map(row => tableData.headings.map(header => {
      let text = tableDataMappers[header.dataType](row[snakeToCamel(header.id)]);

      if (header.id === 'juror_postcode') {
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
        left: [...buildReportHeadings(reportData.headings.filter((v, index) => index % 2 === 1))],
        right: [...buildReportHeadings(reportData.headings.filter((v, index) => index % 2 === 0))],
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
