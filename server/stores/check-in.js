const { dateFilter } = require('../components/filters');

module.exports = [
  {
    date: dateFilter(new Date(), null, 'YYYY-MM-DD'),
    status: 'Unconfirmed',
    jurors: [
      {
        jurorNumber: '100000000',
        firstName: 'First0',
        lastName: 'Last0',
        status: 'Responded',
        checkedIn: '9:30am',
        checkedOut: '5:00pm',
      },
      {
        jurorNumber: '100000001',
        firstName: 'First1',
        lastName: 'Last1',
        status: 'Responded',
        checkedIn: '9:30am',
        checkedOut: null,
      },
      {
        jurorNumber: '100000002',
        firstName: 'First2',
        lastName: 'Last2',
        status: 'Responded',
        checkedIn: null,
        checkedOut: null,
      },
      {
        jurorNumber: '100000003',
        firstName: 'First3',
        lastName: 'Last3',
        status: 'Responded',
        checkedIn: null,
        checkedOut: null,
      },
      {
        jurorNumber: '100000004',
        firstName: 'First4',
        lastName: 'Last4',
        status: 'Responded',
        checkedIn: null,
        checkedOut: null,
      },
      {
        jurorNumber: '100000005',
        firstName: 'First5',
        lastName: 'Last5',
        status: 'Responded',
        checkedIn: null,
        checkedOut: null,
      },
    ],
  },
];
