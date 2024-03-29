const { generateDocument } = require('../../../lib/reports/single-generator');

// TODO: this file will stay here for future reference and removed once we start implementing the reports
const sampleRow = {
  jurorNumber: '645200045',
  firstName: 'James',
  lastName: 'Ashcroft',
  mobilePhone: '07576543444',
  homePhone: '0121 478 7866',
  comment: 'some comment here on the juror record... what if the comment is really really long in here????',
};
const dateFilter = require('../../../components/filters').dateFilter;

module.exports.getSomeReport = function (app) {
  return function (req, res) {

    return res.render('reporting/some-report/index.njk', {
      sampleRow,
      backLinkUrl: {
        built: true,
        url: app.namedRoutes.build('reports.get'),
      },
    });
  };
};

module.exports.generateSomeReport = function (app) {
  return async function (req, res) {
    const query = req.query;

    const buildRows = (rows = 10) => {
      const _rows = [];

      for (let i = 0; i < rows; i++) {
        _rows.push([
          { text: '645200045' },
          { text: 'James' },
          { text: 'Ashcroft' },
          { text: '07576543444' },
          { text: '01214787866' },
        ]);
      }
      return _rows;
    };

    try {
      const document = await generateDocument({
        title: 'Non-responded',
        footerText: 'Non-responded report',
        metadata: {
          left: [
            { key: 'Date from', value: dateFilter(query['date-from'], 'YYYY-MM-DD', 'dddd DD MMMM YYYY') },
            { key: 'Date to', value: dateFilter(query['date-to'], 'YYYY-MM-DD', 'dddd DD MMMM YYYY') },
            { key: 'Pool type', value: 'Crown court' },
            { key: 'Service start date', value: 'Monday 5 November 2023' },
            { key: 'Total non-responded pool members', value: '42' },
          ],
          right: [
            { key: 'Report created', value: 'Tuesday 6 November 2023' },
            { key: 'Time created', value: '1:46:52pm' },
            { key: 'Court name', value: 'Chester (415)' },
          ],
        },
        tables: [
          {
            head: [
              { style: 'label', text: 'Juror number' },
              { style: 'label', text: 'First name' },
              { style: 'label', text: 'Last name' },
              { style: 'label', text: 'Mobile phone' },
              { style: 'label', text: 'Home phone' },
            ],
            body: [...buildRows(42)],
            footer: [
              { style: 'label', text: 'Table one', colSpan: 5 },
            ],
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
};

module.exports.generateSomeOtherReport = function (app) {
  return async function (req, res) {
    const query = req.query;

    const buildRows = (rows = 10) => {
      const _rows = [];

      for (let i = 0; i < rows; i++) {
        _rows.push([
          { text: '645200045' },
          { text: '4 Nov 2023' },
          { text: 'Chris W' },
          { text: 'James' },
          { text: 'Ashcroft' },
          { text: '24 High Street, Maidenhead, Berkshire, SL6 1SF' },
          { text: 'Queued' },
          { text: 'Juror is available to serve immediately.' },
          { text: '415220301' },
          { text: '-' },
        ]);
      }
      return _rows;
    };

    try {
      const document = await generateDocument({
        title: 'Non-responded',
        footerText: 'Non-responded report',
        metadata: {
          left: [
            { key: 'Date from', value: dateFilter(query['date-from'], 'YYYY-MM-DD', 'dddd DD MMMM YYYY') },
            { key: 'Date to', value: dateFilter(query['date-to'], 'YYYY-MM-DD', 'dddd DD MMMM YYYY') },
            { key: 'Total manually-created jurors', value: 20 },
          ],
          right: [
            { key: 'Report created', value: 'Tuesday 6 November 2023' },
            { key: 'Time created', value: '1:46:52pm' },
            { key: 'Court name', value: 'Chester (415)' },
          ],
        },
        tables: [
          {
            head: [
              { style: 'label', text: 'Juror number' },
              { style: 'label', text: 'Created on' },
              { style: 'label', text: 'Created by' },
              { style: 'label', text: 'First name' },
              { style: 'label', text: 'Last name' },
              { style: 'label', text: 'Address' },
              { style: 'label', text: 'Status' },
              { style: 'label', text: 'Notes' },
              { style: 'label', text: 'Pool number' },
              { style: 'label', text: 'Service completed' },
            ],
            body: [...buildRows(20)],
            footer: [
              // { style: 'label', text: 'Table one', colSpan: 5 },
            ],
          },
        ],
      }, {
        pageOrientation: 'landscape',
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
};
