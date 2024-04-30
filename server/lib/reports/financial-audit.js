(() => {
  'use strict';
  
  const { dateFilter, attendanceType } = require("../../components/filters");
  const moment = require("moment");

  const addressOrder = ['lineOne', 'lineTwo', 'lineThree', 'town', 'county', 'postcode'];

  const auditTypeMap = {
    FOR_APPROVAL: 'Attendance audit report',
    FOR_APPROVAL_EDIT: 'Edit audit report',
    APPROVED_EDIT: 'Edit audit report',
    REAPPROVED_EDIT: 'Edit audit report (repayment)',
    APPROVED_CASH: 'Payment audit report',
    APPROVED_BACS: 'Payment audit report',
    REAPPROVED_CASH: 'Repayment audit report',
    REAPPROVED_BACS: 'Repayment audit report',
  }

  const horizontalLine = (spacing = 5) => {
    return {
      raw: true,
      table: {
        widths: ['*'],
        body: [[''], ['']],
      },
      margin: [0, spacing, 0, 0],
      layout: {
        hLineWidth: (i, node) => {
          return (i === 0 || i === node.table.body.length) ? 0 : 1;
        },
        vLineWidth: () => {
          return 0;
        },
      },
    };
  };

  const header = (jurorDetails, dateFrom, dateTo, auditType) => ({
    stack: [
      { text: auditTypeMap[auditType], fontSize: 12, color: '#505A5F' },
      {
        columns: [
          {
            text: [
              { text: jurorDetails.jurorNumber, bold: true },
              { text: ' ' },
              { text: `${jurorDetails.name.title} ${jurorDetails.name.firstName} ${jurorDetails.name.lastName}` },
            ],
            fontSize: 14,
            marginLeft: 0,
          },
          {
            text: `${
              dateFilter(dateFrom.attendanceDate, '', 'dddd DD MMMM YYYY')
            } to ${
              dateFilter(dateTo.attendanceDate, '', 'dddd DD MMMM YYYY')
            }`,
            alignment: 'right',
            bold: true,
            fontSize: 14,
          },
        ],
      },
      horizontalLine(),
    ],
    marginBottom: 10,
  });

  const footer = (jurorDetails, auditType, draft) => ({
    text: [
      { text: auditTypeMap[auditType] },
      { text: draft ? ' - Draft - ' : ' - ' },
      { text: jurorDetails.jurorNumber, bold: true },
      { text: ' ' },
      { text: `${jurorDetails.name.title} ${jurorDetails.name.firstName} ${jurorDetails.name.lastName}` },
    ],
    fontSize: 14,
    marginLeft: 0,
  })

  const metaData = (auditData) => {
    const { financialAuditNumber, jurorDetails, originalJurorDetails, submittedAt, submittedBy } = auditData;

    const right = financialAuditNumber ? [
      {key: 'Audit number', value: financialAuditNumber},
      {key: 'Date submitted', value: `${dateFilter(submittedAt, '', 'ddd DD MMM YYYY')} by ${submittedBy.name}`},
     ] : [
      {key: 'Audit number', value: 'Draft'},
     ]

    const method = auditData.expenses.expenseDetails.reduce((prev, curr) => {
      if (prev.includes(curr.paymentMethod)) {
        return prev;
      }

      return [...prev, curr.paymentMethod];
    }, []).join(', ');

    let centre = [];
    let left = [];

    if (originalJurorDetails) {
      centre = [
        {heading: 'Original details'},
        {key: 'Juror\'s address', value: addressOrder.map(key => originalJurorDetails.address[key] ? `${originalJurorDetails.address[key]}\n` : '')},
        {key: 'Sort code', value: originalJurorDetails.paymentDetails.sortCode.match(/../g).join('-')},
        {key: 'Account number', value: originalJurorDetails.paymentDetails.bankAccountNumber},
        {key: 'Account holder\'s name', value: originalJurorDetails.paymentDetails.bankAccountName},
        {key: 'Method of payment', value: method},
      ]
      left = [{heading: 'New details'}]
    }

    return {
      left: [
        ...left,
        {key: 'Juror\'s address', value: addressOrder.map(key => jurorDetails.address[key] ? `${jurorDetails.address[key]}\n` : '')},
        {key: 'Sort code', value: jurorDetails.paymentDetails.sortCode.match(/../g).join('-')},
        {key: 'Account number', value: jurorDetails.paymentDetails.bankAccountNumber},
        {key: 'Account holder\'s name', value: jurorDetails.paymentDetails.bankAccountName},
        {key: 'Method of payment', value: method},
      ],
      centre: centre,
      right: right,
    }
  }

  const makeEntry = (newValue, originalValue) => ({
    stack: [
      {
        text: originalValue,
      },
      {
        text: newValue,
        bold: newValue !== originalValue,
      }
    ],
    fillColor: '#F3F2F1',
  })

  const content = (auditData) => {
    const widths = [80, 80, 70, '*', '*', 60, '*', '*', '*', '*', '*', 60, '*', 30, 40];
    const tableBody = auditData.expenses.expenseDetails.map(expense => {
      if (expense.original) {
        return [
          { 
            text: `${dateFilter(expense.attendanceDate, 'yyyy-MM-dd', 'ddd DD MMM YYYY')}`,
            margin: [0, 5, 0, 0],
            fillColor: '#F3F2F1'
          },
          makeEntry(`${attendanceType(expense.attendanceType)}`,`${attendanceType(expense.original.attendanceType)}`),
          makeEntry(`£${expense.lossOfEarnings}`,`£${expense.original.lossOfEarnings}`),
          makeEntry(`£${expense.extraCare}`,`£${expense.original.extraCare}`),
          makeEntry(`£${expense.other}`,`£${expense.original.other}`),
          makeEntry(`£${expense.publicTransport}`,`£${expense.original.publicTransport}`),
          makeEntry(`£${expense.taxi}`,`£${expense.original.taxi}`),
          makeEntry(`£${expense.motorcycle}`,`£${expense.original.motorcycle}`),
          makeEntry(`£${expense.car}`,`£${expense.original.car}`),
          makeEntry(`£${expense.bicycle}`,`£${expense.original.bicycle}`),
          makeEntry(`£${expense.parking}`,`£${expense.original.parking}`),
          makeEntry(`£${expense.foodAndDrink}`,`£${expense.original.foodAndDrink}`),
          makeEntry(`£${expense.smartCard}`,`£${expense.original.smartCard}`),
          makeEntry(`${expense.paymentMethod}`,`${expense.original.paymentMethod}`),
          {
            stack: [ 
              {
                text: `£${expense.original.total}`, 
                alignment: 'center',
              },
              {
                text: `£${expense.total}`,
                alignment: 'center',
                bold: expense.original.total !== expense.total,
              }
            ],
            fillColor: '#E3E3E2',
          },
        ]  
      }

      return [
        { text: `${dateFilter(expense.attendanceDate, 'yyyy-MM-dd', 'ddd DD MMM YYYY')}` },
        { text: `${attendanceType(expense.attendanceType)}` },
        { text: `£${expense.lossOfEarnings}` },
        { text: `£${expense.extraCare}` },
        { text: `£${expense.other}` },
        { text: `£${expense.publicTransport}` },
        { text: `£${expense.taxi}` },
        { text: `£${expense.motorcycle}` },
        { text: `£${expense.car}` },
        { text: `£${expense.bicycle}` },
        { text: `£${expense.parking}` },
        { text: `£${expense.foodAndDrink}` },
        { text: `£${expense.smartCard}` },
        { text: `${expense.paymentMethod}` },
        { text: `£${expense.total}`, alignment: 'center', fillColor: '#F3F2F1' },
      ]
    });
    
    const totalBody = [[
      { text: `Totals`, bold: true },
      { text: auditData.expenses.expenseDetails.length, bold: true },
      { text: `£${auditData.expenses.total.lossOfEarnings}`, bold: true },
      { text: `£${auditData.expenses.total.extraCare}`, bold: true },
      { text: `£${auditData.expenses.total.other}`, bold: true },
      { text: `£${auditData.expenses.total.publicTransport}`, bold: true },
      { text: `£${auditData.expenses.total.taxi}`, bold: true },
      { text: `£${auditData.expenses.total.motorcycle}`, bold: true },
      { text: `£${auditData.expenses.total.car}`, bold: true },
      { text: `£${auditData.expenses.total.bicycle}`, bold: true },
      { text: `£${auditData.expenses.total.parking}`, bold: true },
      { text: `£${auditData.expenses.total.foodAndDrink}`, bold: true },
      { text: `£${auditData.expenses.total.smartCard}`, bold: true },
      { text: '' },
      { text: `£${auditData.expenses.total.total}`, alignment: 'center', bold: true, fillColor: '#000000', color: '#FFFFFF' },
    ]]

    const coreContent = [
      horizontalLine(),
      {
        raw: true,
        alignment: 'justify',
        fontSize: 7,
        width: '33%',
        table: {
          widths: [120, 200],
          body: [[
            { 
              style: 'label',
              text: 'Mileage',
            },
            {
              text: `${+auditData.jurorDetails.mileage} mile${+auditData.jurorDetails.mileage !== 1 ? 's' : ''}`,
            }
          ]]
        }
      },
      {
        head: [
          { style: 'label', text: 'Date' },
          { style: 'label', text: 'Attendance' },
          { style: 'label', text: 'Loss of earnings' },
          { style: 'label', text: 'Extra care' },
          { style: 'label', text: 'Other' },
          { style: 'label', text: 'Public transport' },
          { style: 'label', text: 'Taxi' },
          { style: 'label', text: 'Motorcycle' },
          { style: 'label', text: 'Car' },
          { style: 'label', text: 'Bicycle' },
          { style: 'label', text: 'Parking' },
          { style: 'label', text: 'Food and drink' },
          { style: 'label', text: '(Smart card)' },
          { style: 'label', text: 'Method' },
          { style: 'label', text: 'Total', alignment: 'center', fillColor: '#F3F2F1' },
        ],
        body: tableBody,
        widths,
        options: {
          margin: [0, 0, 0, 0],
        },
      },
      horizontalLine(-5),
      {
        body: totalBody,
        widths,
        options: {
          margin: [0, -5, 0, 0],
        },
        layout: {
          hLineWidth: () => 0,
        }
      },
    ];

    if (auditData.expenses.total.totalPaid !== 0 && auditData.expenses.total.totalOutstanding !== 0) {
      coreContent.push({
        raw: true,
        fontSize: 10,
        marginTop: 10,
        layoutMod: {
          hLineColor: '#000000',
          paddingTop: () => 10,
          paddingBottom: () => 0,
        },
        width: '33%',
        table: {
          widths: [120, 120],
          body: [
            [
              { 
                style: 'label',
                text: 'Total due',
              },
              {
                text: `£${auditData.expenses.total.totalDue}`,
                alignment: 'right',
              }
            ],
            [
              { 
                style: 'label',
                text: 'Total paid to date',
              },
              {
                text: `£${auditData.expenses.total.totalPaid}`,
                alignment: 'right',
              }
            ],
            [
              { 
                style: 'label',
                text: 'Balance to pay',
              },
              {
                text: `£${auditData.expenses.total.totalOutstanding}`,
                alignment: 'right',
              }
            ],
          ]
        }

      })
    }

    return coreContent;
  }

  const render = (auditData) => {
    const days = auditData.expenses.expenseDetails;
    const dateFrom = days.reduce((prev, curr) => {
      if (moment(curr.attendanceDate).isBefore(moment(prev?.attendanceDate))) {
        return curr;
      }

      return prev;
    })
    const dateTo = days.reduce((prev, curr) => {
      if (moment(curr.attendanceDate).isAfter(moment(prev?.attendanceDate))) {
        return curr;
      }

      return prev;
    })

    return {
      title: header(auditData.jurorDetails, dateFrom, dateTo, auditData.auditType),
      metadata: metaData(auditData),
      tables: content(auditData),
      footerText: footer(auditData.jurorDetails, auditData.auditType, auditData.draft),
    }
  }

  module.exports = {
    render,
  }
})();
