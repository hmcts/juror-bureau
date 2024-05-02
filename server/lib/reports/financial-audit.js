(() => {
  'use strict';
  
  const { dateFilter, attendanceType } = require("../../components/filters");
  const moment = require("moment");

  const addressOrder = ['lineOne', 'lineTwo', 'lineThree', 'town', 'county', 'postcode'];

  const toMoney = (value) => `£${(value || 0).toFixed(2)}`;
  const makeName = (name) => `${name.title ? `${name.title} ` : ""}${name.firstName} ${name.lastName}`

  const auditTypeMap = {
    FOR_APPROVAL: 'Attendance audit report',
    FOR_APPROVAL_EDIT: 'Edit audit report',
    APPROVED_EDIT: 'Edit audit report (repayment)',
    REAPPROVED_EDIT: 'Edit audit report (repayment)',
    APPROVED_CASH: 'Paid cash audit report',
    APPROVED_BACS: 'Payment audit report',
    REAPPROVED_CASH: 'Repaid cash audit report',
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
              { text: makeName(jurorDetails.name) },
            ],
            fontSize: 14,
            marginLeft: 0,
          },
          {
            text: dateFrom === dateTo
              ? `${dateFilter(dateFrom.attendanceDate, '', 'dddd DD MMMM YYYY')}`
              : `${
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
      { text: makeName(jurorDetails.name) },
    ],
    fontSize: 14,
    marginLeft: 0,
  })

  const metaData = (auditData) => {
    const { 
      approvedAt,
      approvedBy,
      financialAuditNumber,
      jurorDetails,
      originalJurorDetails,
      submittedAt,
      submittedBy,
    } = auditData;

    const right = financialAuditNumber ? [
      {key: 'Audit number', value: financialAuditNumber},
      {key: 'Date submitted', value: `${dateFilter(submittedAt, '', 'ddd DD MMM YYYY')} by ${submittedBy.name}`},
     ] : [
      {key: 'Audit number', value: 'Draft'},
     ]

    if (approvedAt) {
      right.push({key: 'Date approved', value: `${dateFilter(approvedAt, '', 'ddd DD MMM YYYY')} by ${approvedBy.name}`})
    }

    const method = auditData.expenses.expenseDetails.reduce((prev, curr) => {
      if (prev.includes(curr.paymentMethod)) {
        return prev;
      }

      return [...prev, curr.paymentMethod];
    }, []).join(', ');

    let centre = [];
    let left = [
      {key: 'Juror\'s address', value: addressOrder.map(key => jurorDetails.address[key] ? `${jurorDetails.address[key]}\n` : '')},
    ];
    if (jurorDetails.paymentDetails.sortCode) {
      left.push({key: 'Sort code', value: jurorDetails.paymentDetails.sortCode?.match(/../g).join('-') || ""})
    }
    if (jurorDetails.paymentDetails.bankAccountNumber) {
      left.push({key: 'Account number', value: jurorDetails.paymentDetails.bankAccountNumber})
    }
    if (jurorDetails.paymentDetails.bankAccountName) {
      left.push({key: 'Account holder\'s name', value: jurorDetails.paymentDetails.bankAccountName})
    }
    if (method) {
      left.push({key: 'Method of payment', value: method})
    }

    if (originalJurorDetails) {
      const ogMethod = auditData.expenses.expenseDetails.reduce((prev, curr) => {
        if (prev.includes(curr.original.paymentMethod)) {
          return prev;
        }
  
        return [...prev, curr.original.paymentMethod];
      }, []).join(', ');
  
      centre = [
        {heading: 'Original details'},
        {key: 'Juror\'s address', value: addressOrder.map(key => originalJurorDetails.address[key] ? `${originalJurorDetails.address[key]}\n` : '')},
      ]
      if (originalJurorDetails.paymentDetails.sortCode) {
        centre.push({key: 'Sort code', value: originalJurorDetails.paymentDetails.sortCode?.match(/../g)?.join('-') || ""})
      }
      if (originalJurorDetails.paymentDetails.bankAccountNumber) {
        centre.push({key: 'Account number', value: originalJurorDetails.paymentDetails.bankAccountNumber})
      }
      if (originalJurorDetails.paymentDetails.bankAccountName) {
        centre.push({key: 'Account holder\'s name', value: originalJurorDetails.paymentDetails.bankAccountName})
      }
      if (ogMethod) {
        centre.push({key: 'Method of payment', value: ogMethod})
      }
      left.unshift({heading: 'New details'})
    }

    return {
      left: [
        ...left,
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
          makeEntry(toMoney(expense.lossOfEarnings),toMoney(expense.original.lossOfEarnings)),
          makeEntry(toMoney(expense.extraCare),toMoney(expense.original.extraCare)),
          makeEntry(toMoney(expense.other),toMoney(expense.original.other)),
          makeEntry(toMoney(expense.publicTransport),toMoney(expense.original.publicTransport)),
          makeEntry(toMoney(expense.taxi),toMoney(expense.original.taxi)),
          makeEntry(toMoney(expense.motorcycle),toMoney(expense.original.motorcycle)),
          makeEntry(toMoney(expense.car),toMoney(expense.original.car)),
          makeEntry(toMoney(expense.bicycle),toMoney(expense.original.bicycle)),
          makeEntry(toMoney(expense.parking),toMoney(expense.original.parking)),
          makeEntry(toMoney(expense.foodAndDrink),toMoney(expense.original.foodAndDrink)),
          makeEntry(toMoney(expense.smartCard),toMoney(expense.original.smartCard)),
          makeEntry(`${expense.paymentMethod}`,`${expense.original.paymentMethod}`),
          {
            stack: [ 
              {
                text: toMoney(expense.original.total), 
                alignment: 'center',
              },
              {
                text: toMoney(expense.total),
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
        { text: toMoney(expense.lossOfEarnings) },
        { text: toMoney(expense.extraCare) },
        { text: toMoney(expense.other) },
        { text: toMoney(expense.publicTransport) },
        { text: toMoney(expense.taxi) },
        { text: toMoney(expense.motorcycle) },
        { text: toMoney(expense.car) },
        { text: toMoney(expense.bicycle) },
        { text: toMoney(expense.parking) },
        { text: toMoney(expense.foodAndDrink) },
        { text: toMoney(expense.smartCard) },
        { text: `${expense.paymentMethod}` },
        { text: toMoney(expense.total), alignment: 'center', fillColor: '#F3F2F1' },
      ]
    });
    
    const totalBody = [[
      { text: `Totals`, bold: true },
      { text: auditData.expenses.expenseDetails.length, bold: true },
      { text: toMoney(auditData.expenses.total.lossOfEarnings), bold: true },
      { text: toMoney(auditData.expenses.total.extraCare), bold: true },
      { text: toMoney(auditData.expenses.total.other), bold: true },
      { text: toMoney(auditData.expenses.total.publicTransport), bold: true },
      { text: toMoney(auditData.expenses.total.taxi), bold: true },
      { text: toMoney(auditData.expenses.total.motorcycle), bold: true },
      { text: toMoney(auditData.expenses.total.car), bold: true },
      { text: toMoney(auditData.expenses.total.bicycle), bold: true },
      { text: toMoney(auditData.expenses.total.parking), bold: true },
      { text: toMoney(auditData.expenses.total.foodAndDrink), bold: true },
      { text: toMoney(auditData.expenses.total.smartCard), bold: true },
      { text: '' },
      { text: toMoney(auditData.expenses.total.total), alignment: 'center', bold: true, fillColor: '#000000', color: '#FFFFFF' },
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
              text: `${auditData.jurorDetails.mileage || 0} mile${+auditData.jurorDetails.mileage !== 1 ? 's' : ''}`,
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

    if (auditData.auditType === 'REAPPROVED_CASH' || auditData.auditType === 'APPROVED_CASH') {
      coreContent.push({
        raw: true,
        fontSize: 7,
        marginTop: 50,
        width: '33%',
        table: {
          widths: [120, 120],
          body: [
            [
              { 
                style: 'label',
                text: 'Juror signature',
                layout: {
                  hLineColor: '#FFFFFF',
                }
              },
              {
                text: '',
              }
            ],
            [
              { 
                style: 'label',
                text: 'Date payment received',
              },
              {
                text: `${dateFilter(auditData.approvedAt, '', 'dddd DD MMMM YYYY')}`,
              }
            ],
          ]
        }

      })
    }

    if (auditData.auditType === 'REAPPROVED_EDIT') {
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
                text: toMoney(auditData.expenses.total.totalDue),
                alignment: 'right',
              }
            ],
            [
              { 
                style: 'label',
                text: 'Total paid to date',
              },
              {
                text: toMoney(auditData.expenses.total.totalPaid),
                alignment: 'right',
              }
            ],
            [
              { 
                style: 'label',
                text: 'Balance to pay',
              },
              {
                text: toMoney(auditData.expenses.total.totalOutstanding),
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
    }, []);
    const dateTo = days.reduce((prev, curr) => {
      if (moment(curr.attendanceDate).isAfter(moment(prev?.attendanceDate))) {
        return curr;
      }

      return prev;
    }, []);

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
