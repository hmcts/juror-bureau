const _ = require('lodash');
const { dateFilter, attendanceType } = require('../../../components/filters');
const { expensesDAO, jurorDetailsDAO } = require('../../../objects/expenses');

const prepareRows = (juror) => {
  const _rows = [];

  for (let expense of juror.expenses) {
    _rows.push([
      { text: `${dateFilter(expense.date, 'yyyy-MM-dd', 'ddd DD MMM YYYY')}` },
      { text: `${attendanceType(expense.attendance_type)}` },
      { text: `£${expense.public_transport}` },
      { text: `£${expense.taxi}` },
      { text: `£${expense.motorcycle}` },
      { text: `£${expense.car}` },
      { text: `£${expense.bicycle}` },
      { text: `£${expense.parking}` },
      { text: `£${expense.food_and_drink}` },
      { text: `£${expense.loss_of_earnings}` },
      { text: `£${expense.extra_care}` },
      { text: `£${expense.other}` },
      { text: `£${expense.smart_card}` },
      { text: `${expense.payment_method}` },
      { text: `£${expense.total}`, alignment: 'center', fillColor: '#F3F2F1' },
    ]);
  }

  _rows.push([
    { style: 'label', border: [false, true, false, false], text: 'Totals' },
    { style: 'label', border: [false, true, false, false], text: `${juror.totals.total_days}` },
    { style: 'label', border: [false, true, false, false], text: `£${juror.totals.public_transport}` },
    { style: 'label', border: [false, true, false, false], text: `£${juror.totals.taxi}` },
    { style: 'label', border: [false, true, false, false], text: `£${juror.totals.motorcycle}` },
    { style: 'label', border: [false, true, false, false], text: `£${juror.totals.car}` },
    { style: 'label', border: [false, true, false, false], text: `£${juror.totals.bicycle}` },
    { style: 'label', border: [false, true, false, false], text: `£${juror.totals.parking}` },
    { style: 'label', border: [false, true, false, false], text: `£${juror.totals.food_and_drink}` },
    { style: 'label', border: [false, true, false, false], text: `£${juror.totals.loss_of_earnings}` },
    { style: 'label', border: [false, true, false, false], text: `£${juror.totals.extra_care}` },
    { style: 'label', border: [false, true, false, false], text: `£${juror.totals.other}` },
    { style: 'label', border: [false, true, false, false], text: `£${juror.totals.smart_card}` },
    { style: 'label', border: [false, true, false, false], text: '' },
    {
      style: 'label',
      border: [false, true, false, false],
      text: `£${juror.totals.total}`,
      alignment: 'center',
      fillColor: '#000',
      color: '#fff',
    },
  ]);

  return _rows;
};

const { generateDocument } = require('../../../lib/reports/bulk-generator');

module.exports.generateBulk = function (app) {
  return async function (req, res) {
    const jurors = [
      {
        'juror_number': '641500020',
        'identifier': 'F321',
      },
      {
        'juror_number': '641500021',
        'identifier': 'F322',
      },
      {
        'juror_number': '641500021',
        'identifier': 'F322',
      },
      {
        'juror_number': '641500021',
        'identifier': 'F322',
      },
      {
        'juror_number': '641500021',
        'identifier': 'F322',
      },
      {
        'juror_number': '641500021',
        'identifier': 'F322',
      },
      {
        'juror_number': '641500021',
        'identifier': 'F322',
      },
      {
        'juror_number': '641500021',
        'identifier': 'F322',
      },
      {
        'juror_number': '641500021',
        'identifier': 'F322',
      },
      {
        'juror_number': '641500021',
        'identifier': 'F322',
      },
    ];

    console.time('expenses');

    const jurorsLength = jurors.length;
    const requests = [];

    for (let j of jurors) {
      requests.push(() => expensesDAO.get(app, req, [j], 'inside the push'));
    }
    let expenses = await Promise.all(requests.map((r) => r()));

    expenses = _.flatten(expenses);

    const bulkData = [];

    for (let juror of expenses) {
      const _juror = jurors.shift();

      const body = {
        'juror_number': juror.juror_number,
        // 'juror_version': expense.juror_version,
        'juror_version': null,
        include: ['NAME_DETAILS', 'PAYMENT_DETAILS', 'ADDRESS_DETAILS'],
      };

      const [_details] = await jurorDetailsDAO.post(app, req, [body]);

      const fullName = `${_details.name.title || ''} ${_details.name.firstName} ${_details.name.lastName}`;

      bulkData.push(
        {
          header: {
            stack: [
              { text: 'Attendance audit report', fontSize: 12, color: '#505A5F' },
              {
                columns: [
                  {
                    text: [
                      { text: _details.juror_number, bold: true },
                      { text: ' ' },
                      { text: fullName },
                    ],
                    fontSize: 14,
                    marginLeft: 0,
                  },
                  {
                    text: 'Monday 28 August 2023 to Friday 8 September 2023 ',
                    alignment: 'right',
                    bold: true,
                    fontSize: 14,
                  },
                ],
              },
            ],
            marginBottom: 10,
          },
          metadata: {
            left: {
              'Juror\'s address': '39 London Street\nLondon\nN1 1NB',
              'Sort code': '11-22-33',
              'Account number': '12345678',
              'Account holder\'s name': fullName,
              'Method of payment': 'BACS',
            },
            right: {
              'Audit number': _juror.identifier,
              'Date submitted': 'Fri 8 Sep 2023 by Leslie Alexander',
            },
          },
          content: {
            head: [
              { style: 'label', text: 'Date' },
              { style: 'label', text: 'Attendance' },
              { style: 'label', text: 'Public transport' },
              { style: 'label', text: 'Taxi' },
              { style: 'label', text: 'Motorcycle' },
              { style: 'label', text: 'Car' },
              { style: 'label', text: 'Bicycle' },
              { style: 'label', text: 'Parking' },
              { style: 'label', text: 'Food and drink' },
              { style: 'label', text: 'Loss of earnings' },
              { style: 'label', text: 'Extra care' },
              { style: 'label', text: 'Other' },
              { style: 'label', text: '(Smart card)' },
              { style: 'label', text: 'Method' },
              { style: 'label', text: 'Total', alignment: 'center', fillColor: '#F3F2F1' },
            ],
            body: [...prepareRows(juror)],
          },
          footer: [
            { text: 'Attendance audit report - ' },
            { text: _details.identifier + ' - ' },
            { text: _details.juror_number + ' ', style: 'label' },
            { text: fullName },
          ],
        },
      );
    };

    try {
      const document = await generateDocument(bulkData, {
        pageOrientation: 'landscape',
      });

      console.log('loaded', jurorsLength, 'results in:');
      console.timeEnd('expenses');

      res.contentType('application/pdf');
      return res.send(document);
    } catch (err) {
      console.log(err);
    }
  };
};
