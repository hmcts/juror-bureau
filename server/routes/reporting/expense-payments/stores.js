module.exports.expensePaymentDataStore = { 
  headings: {
    reportCreated: {
      displayName: null,
      dataType: 'LocalDateTime',
      value: '2025-11-18T11:10:47.230983'
    },
    dateTo: {
      displayName: 'Date to',
      dataType: 'LocalDate',
      value: '2026-11-30'
    },
    dateFrom: {
      displayName: 'Date from',
      dataType: 'LocalDate',
      value: '2023-11-06'
    }
  },
  tableData: {
    headings: [
      {
        id: 'court_location_name_and_code_jp',
        name: 'Court',
        dataType: 'String',
        headings: null
      },
      {
        id: 'total_requested',
        name: 'Requested',
        dataType: 'Long',
        headings: null
      },
      {
        id: 'total_deferred',
        name: 'Deferred',
        dataType: 'Long',
        headings: null
      },
      {
        id: 'total_summoned',
        name: 'Summoned',
        dataType: 'Long',
        headings: null
      },
      {
        id: 'total_supplied',
        name: 'Supplied',
        dataType: 'Long',
        headings: null
      },
      {
        id: 'ratio_1',
        name: 'Ratio 1',
        dataType: 'Double',
        headings: null
      },
      {
        id: 'ratio_2',
        name: 'Ratio 2',
        dataType: 'Double',
        headings: null
      }
    ],
    data: [
      {
        courtLocationNameAndCodeJp: 'CHESTER (415)',
        totalRequested: 50,
        totalDeferred: 0,
        totalSummoned: 10,
        totalSupplied: 1,
        ratio1: 0.2,
        ratio2: 10
      }
    ]
  }
};