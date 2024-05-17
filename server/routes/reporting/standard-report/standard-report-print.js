/* eslint-disable strict */
const { generateDocument } = require('../../../lib/reports/single-generator');
const { tableDataMappers, constructPageHeading } = require('./utils');
const { bespokeReportTablePrint } = require('../bespoke-report/bespoke-report-print');
const { snakeToCamel } = require('../../../lib/mod-utils');
const { reportKeys } = require('./definitions');
const { capitalizeFully } = require('../../../components/filters');

async function standardReportPrint(app, req, res, reportKey, data) {
  const reportData = reportKeys(app, req)[reportKey];
  const isPrint = true;

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
    return rows.map(rowData => {
      let row = tableHeadings.map(header => {
        let text = tableDataMappers[header.dataType](rowData[snakeToCamel(header.id)]);

        if (header.id === 'juror_postcode' || header.id === 'document_code') {
          text = text.toUpperCase();
        }

        if (header.dataType === 'List') {
          const items = text.split(', ');
          let listText = '';

          items.forEach((element, i, array) => {
            listText = listText
              + `${element}${header.id === 'juror_postal_address' ? (!(i === array.length - 1) ? ',' : '') : ''}\n`;
          });
          return ({
            text: listText,
          });
        }

        return ({
          text: text ? text : '-',
        });
      });

      if (reportData.bespokeReport && reportData.bespokeReport.printInsertColumns) {
        Object.keys(reportData.bespokeReport.printInsertColumns).map((key) => {
          row.splice(key, 0, reportData.bespokeReport.printInsertColumns[key][1](rowData));
        });
      }
      return row;
    });
  };

  let reportBody;

  if (reportData.bespokeReport && reportData.bespokeReport.body) {
    reportBody = bespokeReportTablePrint[reportKey](data);
  } else {
    let tableRows = [];

    if (reportData.grouped) {
      for (const [heading, rowData] of Object.entries(tableData.data)) {

        const groupHeaderTransformer = () => {
          if (reportData.grouped.headings && reportData.grouped.headings.transformer) {
            return reportData.grouped.headings.transformer(heading, isPrint);
          }
          return heading;
        };

        const group = buildStandardTableRows(rowData, tableData.headings);

        const headRow = [{
          text: capitalizeFully((reportData.grouped.headings.prefix || '') + groupHeaderTransformer()),
          style: 'groupHeading',
          colSpan: group[0].length,
        }];
        let totalsRow;

        if (reportData.grouped.totals) {
          totalsRow = [{ text: `Total: ${group.length}`, style: 'label', colSpan: group[0].length }];
        }

        for (let i = 0; i < group[0].length - 1; i++) {
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

    const tableHeaders = buildTableHeading(tableData.headings);

    if (reportData.bespokeReport && reportData.bespokeReport.printInsertColumns) {
      Object.keys(reportData.bespokeReport.printInsertColumns).map((key) => {
        tableHeaders.splice(key, 0, {text: reportData.bespokeReport.printInsertColumns[key][0], style: 'label'});
      });
    }

    reportBody = [
      {
        head: [...tableHeaders],
        body: [...tableRows],
        footer: [],
        widths: reportData.bespokeReport && reportData.bespokeReport.printWidths
          ? reportData.bespokeReport.printWidths : null,
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
