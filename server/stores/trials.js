const panelledJurors = [
  {
    name: 'First0 Last0',
    firstName: 'First0',
    lastName: 'Last0',
    jurorNumber: '645200000',
    trialNumber: '415200045',
    status: 'Panelled',
  },
  {
    name: 'First1 Last1',
    firstName: 'First1',
    lastName: 'Last1',
    jurorNumber: '645200001',
    trialNumber: '415200045',
    status: 'Panelled',
  },
  {
    name: 'First2 Last2',
    firstName: 'First2',
    lastName: 'Last2',
    jurorNumber: '645200002',
    trialNumber: '415200045',
    status: 'Panelled',
  },
  {
    name: 'First3 Last3',
    firstName: 'First3',
    lastName: 'Last3',
    jurorNumber: '645200003',
    trialNumber: '415200045',
    status: 'Panelled',
  },
  {
    name: 'First4 Last4',
    firstName: 'First4',
    lastName: 'Last5',
    jurorNumber: '645200004',
    trialNumber: '415200045',
    status: 'Panelled',
  },
  {
    name: 'First5 Last5',
    firstName: 'First5',
    lastName: 'Last5',
    jurorNumber: '645200005',
    trialNumber: '415200045',
    status: 'Panelled',
  },
  {
    name: 'First6 Last6',
    firstName: 'First6',
    lastName: 'Last6',
    jurorNumber: '645200006',
    trialNumber: '415200045',
    status: 'Panelled',
  },
  {
    name: 'First7 Last7',
    firstName: 'First7',
    lastName: 'Last7',
    jurorNumber: '645200007',
    trialNumber: '415200045',
    status: 'Panelled',
  },
  {
    name: 'First8 Last8',
    firstName: 'First8',
    lastName: 'Last8',
    jurorNumber: '645200008',
    trialNumber: '415200045',
    status: 'Panelled',
  },
  {
    name: 'First9 Last9',
    firstName: 'First9',
    lastName: 'Last9',
    jurorNumber: '645200009',
    trialNumber: '415200045',
    status: 'Panelled',
  },
];

module.exports.trials = [
  {
    trialNumber: '415200045',
    parties: 'Colin Findlay',
    trialType: 'criminal',
    startDate: '12/06/2023',
    judge: 'Judge 1',
    court: 'chester',
    courtroom: 'Court 4',
    protected: false,
    active: true,
    panelledJurors: panelledJurors,
  },
  {
    trialNumber: '774200044',
    parties: 'Jyotindra Doshi, Davinda Patel',
    trialType: 'civil',
    startDate: '03/06/2023',
    judge: 'Judge 4',
    court: 'welshpool',
    courtroom: 'Court 2',
    protected: true,
    active: false,
  },
];

module.exports.allCourtrooms = [
  {
    locationCode: '415',
    locationName: 'chester',
    rooms: ['Court 1', 'Court 2', 'Court 3', 'Court 4'],
  },
  {
    locationCode: '774',
    locationName: 'welshpool',
    rooms: ['Court 5', 'Court 6', 'Court 7', 'Court 8'],
  },
];

module.exports.judges = ['Judge 1', 'Judge 2', 'Judge 3', 'Judge 4'];
