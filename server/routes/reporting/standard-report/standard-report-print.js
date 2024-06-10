/* eslint-disable strict */
const { generateDocument } = require('../../../lib/reports/single-generator');
const { tableDataMappers, constructPageHeading } = require('./utils');
const { bespokeReportTablePrint } = require('../bespoke-report/bespoke-report-print');
const { snakeToCamel, checkIfArrayEmpty } = require('../../../lib/mod-utils');
const { reportKeys } = require('./definitions');
const { capitalizeFully, capitalise, timeToDuration, toSentenceCase } = require('../../../components/filters');

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
    if (reportData.tableHeaderTransformer) {
      return { text: reportData.tableHeaderTransformer(heading, true), style: 'label' };
    }
    return { text: heading.name, style: 'label' };
  });

  const buildStandardTableRows = function(rows, tableHeadings) {
    const tableRows = rows.map(rowData => {
      let row = tableHeadings.map(header => {
        let text = tableDataMappers[header.dataType](rowData[snakeToCamel(header.id)]);

        if (header.id === 'juror_postcode' || header.id === 'document_code') {
          text = text.toUpperCase();
        }
        if (header.id === 'on_call') {
          text = text === 'Yes' ? 'Yes' : '-';
        }

        if (header.id === 'excusal_disqual_code') {
          text = `${capitalise(text.split('-')[0])} - ${text.split('-')[1]}`;
        }

        if (header.id === 'trial_type') {
          text = text === 'Civ' ? 'Civil' : 'Criminal';
        }

        if (header.id === 'hours_attended') {
          text = timeToDuration(rowData[snakeToCamel(header.id)])
        }

        if (header.id === 'status') {
          text = capitalizeFully(toSentenceCase(rowData[snakeToCamel(header.id)]))
        }
        
        if (header.id === 'comments') {
          text = text.replace('\n','\n\n')
        }

        if (header.dataType === 'List') {
          const items = text.split(', ');
          let listText = [];

          items.forEach((element, i, array) => {
            if (element.includes('<b>')) {
              listText.push({
                  text:`${element.replace(/(<([^>]+)>)/ig, '')}${header.id === 'juror_postal_address' ? (!(i === array.length - 1) ? ',' : '') : ''}\n`,
                  bold: true
                });
            } else {
              listText.push(`${element}${header.id === 'juror_postal_address' ? (!(i === array.length - 1) ? ',' : '') : ''}\n`);
            }
          });
          return ({
            text: listText,
          });
        }

        if (reportData.cellTransformer) {
          text = reportData.cellTransformer(rowData, header.id, text, isPrint);
        }

        return ({
          text: text ? text : '-',
        });
      });

      if (reportData.bespokeReport && reportData.bespokeReport.printInsertColumns) {
        Object.keys(reportData.bespokeReport.insertColumns).map((key) => {
          row.splice(key, 0, reportData.bespokeReport.insertColumns[key][1](rowData, true));
        });
      }
      return row;
    });

    if (reportData.bespokeReport && reportData.bespokeReport.printInsertRows) {
      Object.keys(reportData.bespokeReport.insertRows).map((key) => {
        if (key === 'last') {
          tableRows.push(reportData.bespokeReport.insertRows[key](rows, true))
        } else {
          tableRows.splice(key, 0, reportData.bespokeReport.insertRows[key](rows, true));
        }
      });
    }

    return tableRows;
  };

  const buildStandardTable = function(reportData, data, headersData, sectionHeading = '') {
    let tableRows = [];

    if (reportData.grouped) {
      let longestGroup = 0;

      if (reportData.grouped.sortGroups) {
        let ordered = {};
        if (reportData.grouped.sortGroups === 'descending') {
          (Object.keys(data).sort()).reverse().forEach(key => ordered[key] = data[key])
        } else {
          Object.keys(data).sort().forEach(key => ordered[key] = data[key])
        }
        data = ordered;
      }

      for (const [heading, rowData] of Object.entries(data)) {

        const groupHeaderTransformer = () => {
          if (reportData.grouped.headings && reportData.grouped.headings.transformer) {
            return reportData.grouped.headings.transformer(heading, isPrint);
          }
          return capitalizeFully(heading);
        };

        let group = buildStandardTableRows(rowData, tableData.headings);

        longestGroup = group[0].length > longestGroup ? group[0].length : longestGroup; 

        const headRow = [{
          text: groupHeaderTransformer(),
          style: 'groupHeading',
          colSpan: longestGroup,
        }];
        let totalsRow;

        if (reportData.grouped.totals) {
          totalsRow = [{ text: `Total: ${group.length}`, style: 'label', colSpan: longestGroup }];
        }

        for (let i = 0; i < longestGroup - 1; i++) {
          headRow.push({});
          if (totalsRow) {
            totalsRow.push({});
          }
        }

        if (checkIfArrayEmpty(group)) {
          if (reportData.grouped.emptyDataGroup) {
            group = reportData.grouped.emptyDataGroup(longestGroup, true);
          } else {
            break;
          }
        }

        tableRows = tableRows.concat(totalsRow ? [headRow, ...group, totalsRow] : [headRow, ...group]);
      }
    } else {
      tableRows = buildStandardTableRows(data, headersData);

      if (reportData.totalsRow) {
        tableRows.push(reportData.totalsRow(data, true));
      }
    }

    const tableHeaders = buildTableHeading(headersData);

    if (reportData.bespokeReport && reportData.bespokeReport.printInsertColumns) {
      Object.keys(reportData.bespokeReport.insertColumns).map((key) => {
        tableHeaders.splice(key, 0, {text: reportData.bespokeReport.insertColumns[key][0], style: 'label'});
      });
    }

    const tables = [{
      head: [...tableHeaders],
      body: [...tableRows],
      footer: [],
      widths: reportData.bespokeReport && reportData.bespokeReport.printWidths
        ? reportData.bespokeReport.printWidths : (reportData.columnWidths || null),
      margin: [0, 10, 0, 0],
    }];

    if (sectionHeading) {
      tables.unshift({
        body: [[
          {text: capitalizeFully(sectionHeading), style: 'largeSectionHeading', colSpan: 2},
          {},
        ]],
        widths:['50%', '50%'],
        layout: { hLineColor: '#0b0c0c' },
        margin: [0, 10, 0, 0],
      });
    }

    return (tables);
  };

  let reportBody = [];

  if (reportData.bespokeReport && reportData.bespokeReport.body) {
    reportBody = bespokeReportTablePrint[reportKey](data);
  } else if (reportData.multiTable) {
    for (const [key, value] of Object.entries(tableData.data)) {
      reportBody.push(
        ...buildStandardTable(reportData, value, tableData.headings, reportData.multiTable.sectionHeadings ? key : '')
      );
    }
  } else {
    reportBody = buildStandardTable(reportData, tableData.data, tableData.headings);
  }

  if (reportData.bespokeReport && reportData.bespokeReport.printInsertTables) {
    Object.keys(reportData.bespokeReport.insertTables).map((key) => {
      if (key === 'last') {
        reportBody.push(...reportData.bespokeReport.insertTables[key](tableData, true))
      } else {
        reportBody.splice(key, 0, ...reportData.bespokeReport.insertTables[key](tableData, true));
      }
    });
  }

  const buildLargeTotals = () => {
    if (!reportData.largeTotals) return {};

    const body = reportData.largeTotals.values(tableData.data).reduce((acc, total) => {
      acc.push(
        {
          border: [false, false, false, false],
          fillColor: '#eeeeee',
          marginLeft: 5,
          stack: [
            {
              text: total.label,
              style: 'largeTotalsLabel',
            },
            {
              text: total.value,
              style: 'largeTotalsValue',
            },
          ],
        }
      );
      return acc;
    }, []);

    return {
      margin: [0, 20, 0, 0],
      table: {
        widths: reportData.largeTotals.printWidths || Array(body.length).fill('*'),
        body: [body],
      },
    };
  };

  try {
    const document = await generateDocument({
      title: reportData.title,
      footerText: reportData.title,
      metadata: {
        left: [...buildReportHeadings(reportData.headings.filter((v, index) => index % 2 === 0)).filter(item => item)],
        right: [...buildReportHeadings(reportData.headings.filter((v, index) => index % 2 === 1)).filter(item => item)],
      },
      largeTotals: buildLargeTotals(),
      tables: reportBody,
    }, {
      pageOrientation: reportData.printLandscape ? 'landscape' : 'portrait',
      fontSize: reportData.fontSize,
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
