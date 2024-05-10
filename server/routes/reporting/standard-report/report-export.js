/* eslint-disable strict */
const { dateFilter } = require('../../../components/filters');
const { snakeToCamel } = require('../../../lib/mod-utils');
const { tableDataMappers } = require('./utils');

async function reportExport(app, req, res, reportKey, data) {
  switch (reportKey) {
  case 'pool-status':
    return poolStatusReportExport(req, res, data);
  default:
    // implement standardised report export if needed
    return;
  }
}

async function poolStatusReportExport(req, res, data) {
  const { tableData } = data;
  let csvResult = [['Status', 'Total members']];
  const csvData = tableData.headings.map(header => {
    const text = tableDataMappers[header.dataType](tableData.data[0][snakeToCamel(header.id)]) || '-';

    return  [header.name, text];
  });

  csvResult = csvResult.concat(csvData);
  const filename = `pool_status_${req.params.filter}_${dateFilter(new Date, null, 'DD-MM-YYYY')}.csv`;

  res.set('content-disposition', 'attachment; filename=' + filename);
  res.type('csv');
  return res.send(csvResult.join('\n'));
}

module.exports = {
  reportExport,
};
