/* eslint-disable */

module.exports.documentData = (document, isCourt = false) => {
  switch (document) {
  case 'initial-summons':
    return initialSummons();
  case 'summons-reminders':
    return summonsReminders();
  case 'further-information':
    return furtherInformation();
  case 'confirmation':
    return confirmation();
  case 'deferral-granted':
    if (isCourt) return deferralGrantedCourt();
    return deferralGranted();
  case 'deferral-refused':
    return deferralRefused();
  case 'excusal-granted':
    return excusalGranted();
  case 'excusal-refused':
    return excusalRefused();
  case 'postponement':
    return postponement();
  case 'withdrawal':
    return withdrawal();
  }
}

function initialSummons() {
  return {
    headings: [
      'Juror number',
      'First name',
      'Last name',
      'Postcode',
      'Date printed',
      'hidden',
    ],
    'data_types': [
      'string',
      'string',
      'string',
      'string',
      'date',
      'hidden',
    ],
    data: [
      {
        'juror_number': '645200045',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        'date_printed': '2023-10-09',
        id: '645200045',
      },
      {
        'juror_number': '645200046',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        'date_printed': 'Pending',
        id: '645200046',
      },
    ],
  };
}

function summonsReminders() {
  return {
    headings: [
      'Juror number',
      'First name',
      'Last name',
      'Postcode',
      'Date printed',
      'hidden',
    ],
    'data_types': [
      'string',
      'string',
      'string',
      'string',
      'date',
      'hidden',
    ],
    data: [
      {
        'juror_number': '645200045',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        'date_printed': '2023-10-09',
        id: '645200045',
      },
      {
        'juror_number': '645200046',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        'date_printed': 'Pending',
        id: '645200046',
      },
    ],
  };
}

function furtherInformation() {
  return {
    headings: [
      'Juror number',
      'First name',
      'Last name',
      'Postcode',
      'Date printed',
      'hidden',
    ],
    'data_types': [
      'string',
      'string',
      'string',
      'string',
      'date',
      'hidden',
    ],
    data: [
      {
        'juror_number': '645200045',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        'date_printed': '2023-10-09',
        id: '645200045',
      },
      {
        'juror_number': '645200046',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        'date_printed': 'Pending',
        id: '645200046',
      },
    ],
  };
}

function confirmation() {
  return {
    headings: [
      'Juror number',
      'First name',
      'Last name',
      'Postcode',
      'Date printed',
      'hidden',
    ],
    'data_types': [
      'string',
      'string',
      'string',
      'string',
      'date',
      'hidden',
    ],
    data: [
      {
        'juror_number': '645200045',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        'date_printed': '2023-10-09',
        id: '645200045',
      },
      {
        'juror_number': '645200045',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        'date_printed': 'Pending',
        id: '645200045',
      },
    ],
  };
}

function deferralGranted() {
  return {
    headings: [
      'Juror number',
      'First name',
      'Last name',
      'Postcode',
      'Status',
      'Deferred to',
      'Reason',
      'Date printed',
      'hidden',
    ],
    'data_types': [
      'string',
      'string',
      'string',
      'string',
      'string',
      'date',
      'string',
      'date',
      'hidden',
    ],
    data: [
      {
        'juror_number': '645200040',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferred_to': '2023-10-09',
        reason: 'Student',
        'date_printed': '2023-10-09',
        id: '645200040',
      },
      {
        'juror_number': '645200041',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferred_to': '2023-10-09',
        reason: 'Student',
        'date_printed': '2023-10-09',
        id: '645200041'
      },
      {
        'juror_number': '645200042',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferred_to': '2023-10-09',
        reason: 'Student',
        'date_printed': '2023-10-09',
        id: '645200042'
      },
      {
        'juror_number': '645200043',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferred_to': '2023-10-09',
        reason: 'Student',
        'date_printed': '2023-10-09',
        id: '645200043'
      },
      {
        'juror_number': '645200044',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferred_to': '2023-10-09',
        reason: 'Student',
        'date_printed': '2023-10-09',
        id: '645200044'
      },
      {
        'juror_number': '645200046',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferred_to': '2023-10-09',
        reason: 'Student',
        'date_printed': '2023-10-09',
        id: '645200046'
      },
      {
        'juror_number': '645200047',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferred_to': '2023-10-09',
        reason: 'Student',
        'date_printed': '2023-10-09',
        id: '645200047'
      },
      {
        'juror_number': '645200048',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferred_to': '2023-10-09',
        reason: 'Student',
        'date_printed': '2023-10-09',
        id: '645200048'
      },
      {
        'juror_number': '645200049',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferred_to': '2023-10-09',
        reason: 'Student',
        'date_printed': '2023-10-09',
        id: '645200049'
      },
      {
        'juror_number': '645200050',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferred_to': '2023-10-09',
        reason: 'Student',
        'date_printed': '2023-10-09',
        id: '645200050'
      },
      {
        'juror_number': '645200051',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferred_to': '2023-10-09',
        reason: 'Student',
        'date_printed': '2023-10-09',
        id: '645200051'
      },
      {
        'juror_number': '645200052',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferred_to': '2023-10-09',
        reason: 'Student',
        'date_printed': '2023-10-09',
        id: '645200052'
      },
      {
        'juror_number': '645200053',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferred_to': '2023-10-09',
        reason: 'Student',
        'date_printed': '2023-10-09',
        id: '645200053'
      },
      {
        'juror_number': '645200054',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferred_to': '2023-10-09',
        reason: 'Student',
        'date_printed': '2023-10-09',
        id: '64520004'
      },
      {
        'juror_number': '645200055',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferred_to': '2023-10-09',
        reason: 'Student',
        'date_printed': '2023-10-09',
        id: '645200055'
      },
      {
        'juror_number': '645200056',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferred_to': '2023-10-09',
        reason: 'Student',
        'date_printed': '2023-10-09',
        id: '645200056'
      },
      {
        'juror_number': '645200057',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferred_to': '2023-10-09',
        reason: 'Student',
        'date_printed': '2023-10-09',
        id: '645200057'
      },
      {
        'juror_number': '645200058',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferred_to': '2023-10-09',
        reason: 'Student',
        'date_printed': '2023-10-09',
        id: '645200058'
      },
      {
        'juror_number': '645200059',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferred_to': '2023-10-09',
        reason: 'Student',
        'date_printed': '2023-10-09',
        id: '645200059'
      },
      {
        'juror_number': '645200060',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferred_to': '2023-10-09',
        reason: 'Student',
        'date_printed': '2023-10-09',
        id: '645200060'
      },
      {
        'juror_number': '645200061',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferred_to': '2023-10-09',
        reason: 'Student',
        'date_printed': '2023-10-09',
        id: '645200061'
      },
      {
        'juror_number': '645200062',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferred_to': '2023-10-09',
        reason: 'Student',
        'date_printed': '2023-10-09',
        id: '645200062'
      },
      {
        'juror_number': '645200063',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferred_to': '2023-10-09',
        reason: 'Student',
        'date_printed': '2023-10-09',
        id: '645200063'
      },
      {
        'juror_number': '645200064',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferred_to': '2023-10-09',
        reason: 'Student',
        'date_printed': '2023-10-09',
        id: '645200064'
      },
      {
        'juror_number': '645200065',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferred_to': '2023-10-09',
        reason: 'Student',
        'date_printed': '2023-10-09',
        id: '645200065'
      },
      {
        'juror_number': '645200066',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferred_to': '2023-10-09',
        reason: 'Student',
        'date_printed': '2023-10-09',
        id: '645200066'
      },
      {
        'juror_number': '645200067',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferred_to': '2023-10-09',
        reason: 'Student',
        'date_printed': '2023-10-09',
        id: '645200067'
      },
      {
        'juror_number': '645200068',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferred_to': '2023-10-09',
        reason: 'Student',
        'date_printed': '2023-10-09',
        id: '645200068'
      },
      {
        'juror_number': '645200069',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferred_to': '2023-10-09',
        reason: 'Student',
        'date_printed': '2023-10-09',
        id: '645200069'
      },
      {
        'juror_number': '645200070',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferred_to': '2023-10-09',
        reason: 'Student',
        'date_printed': '2023-10-09',
        id: '645200070'
      },
      {
        'juror_number': '645200071',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferred_to': '2023-10-09',
        reason: 'Student',
        'date_printed': '2023-10-09',
        id: '645200071'
      },
      {
        'juror_number': '645200072',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferred_to': '2023-10-09',
        reason: 'Student',
        'date_printed': '2023-10-09',
        id: '645200072'
      },
      {
        'juror_number': '645200073',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferred_to': '2023-10-09',
        reason: 'Student',
        'date_printed': 'Pending',
        id: '645200073'
      },
    ],
  };
}

function deferralGrantedCourt() {
  return {
    headings: [
      'Juror number',
      'First name',
      'Last name',
      'Postcode',
      'Status',
      'Deferred to',
      'Reason',
      'Date printed',
      'hidden_form_code',
    ],
    'data_types': [
      'string',
      'string',
      'string',
      'string',
      'string',
      'date',
      'string',
      'date',
      'string',
    ],
    data: [
      {
        'juror_number': '645200073',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferred_to': '2023-10-09',
        reason: 'Student',
        'date_printed': '-',
        'pool_number': '415240131',
      },
      {
        'juror_number': '645200040',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferred_to': '2023-10-09',
        reason: 'Student',
        'date_printed': '-',
        'pool_number': '415240131',
      },
      {
        'juror_number': '645200041',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferred_to': '2023-10-09',
        reason: 'Student',
        'date_printed': '-',
        'pool_number': '415240131',
      },
      {
        'juror_number': '645200042',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferred_to': '2023-10-09',
        reason: 'Student',
        'date_printed': '-',
        'pool_number': '415240131',
      },
      {
        'juror_number': '645200043',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferred_to': '2023-10-09',
        reason: 'Student',
        'date_printed': '2023-10-09',
        'pool_number': '415240131',
      },
    ],
  };
}

function deferralRefused() {
  return {
    headings: [
      'Juror number',
      'First name',
      'Last name',
      'Postcode',
      'Status',
      'Date refused',
      'Reason',
      'Date printed',
      'hidden',
    ],
    'data_types': [
      'string',
      'string',
      'string',
      'string',
      'string',
      'date',
      'string',
      'date',
      'hidden',
    ],
    data: [
      {
        'juror_number': '645200045',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Responded',
        'date_refused': '2023-10-09',
        reason: 'Student',
        'date_printed': '2023-10-09',
        id: '645200045',
      },
      {
        'juror_number': '645200046',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Responded',
        'date_refused': '2023-10-09',
        reason: 'Student',
        'date_printed': 'Pending',
        id: '645200046'
      },
    ],
  };
}

function excusalGranted() {
  return {
    headings: [
      'Juror number',
      'First name',
      'Last name',
      'Postcode',
      'Status',
      'Date excused',
      'Reason',
      'Date printed',
      'hidden',
    ],
    'data_types': [
      'string',
      'string',
      'string',
      'string',
      'string',
      'date',
      'string',
      'date',
      'hidden',
    ],
    data: [
      {
        'juror_number': '645200045',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Excused',
        'date_excused': '2023-10-09',
        reason: 'Medical',
        'date_printed': '2023-10-09',
        id: '645200045',
      },
      {
        'juror_number': '645200046',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Excused',
        'date_excused': '2023-10-11',
        reason: 'Medical',
        'date_printed': 'Pending',
        id: '645200046',
      },
    ],
  };
}

function excusalRefused() {
  return {
    headings: [
      'Juror number',
      'First name',
      'Last name',
      'Postcode',
      'Status',
      'Date Refused',
      'Reason',
      'Date printed',
      'hidden',
    ],
    'data_types': [
      'string',
      'string',
      'string',
      'string',
      'string',
      'date',
      'string',
      'date',
      'hidden',
    ],
    data: [
      {
        'juror_number': '645200045',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Responded',
        'date_refused': '2023-10-09',
        reason: 'Medical',
        'date_printed': '2023-10-09',
        id: '645200045',
      },
      {
        'juror_number': '645200046',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Responded',
        'date_refused': '2023-10-11',
        reason: 'Medical',
        'date_printed': 'Pending',
        id: '645200046',
      },
    ],
  };
}

function postponement() {
  return {
    headings: [
      'Juror number',
      'First name',
      'Last name',
      'Postcode',
      'Status',
      'Postponed to',
      'Date printed',
      'hidden',
    ],
    'data_types': [
      'string',
      'string',
      'string',
      'string',
      'string',
      'date',
      'date',
      'hidden',
    ],
    data: [
      {
        'juror_number': '645200045',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        'postcode': 'CH1 2AN',
        'status': 'Postponed',
        'postponed_to': '2023-10-09',
        'date_printed': '2023-10-09',
        id: '645200045',
      },
      {
        'juror_number': '645200045',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        'postcode': 'CH1 2AN',
        'status': 'Postponed',
        'postponed_to': '2023-10-09',
        'date_printed': 'Pending',
        id: '645200046',
      },
    ],
  };
}

function withdrawal() {
  return {
    headings: [
      'Juror number',
      'First name',
      'Last name',
      'Postcode',
      'Status',
      'Date disqualified',
      'Reason',
      'Date printed',
      'hidden',
    ],
    'data_types': [
      'string',
      'string',
      'string',
      'string',
      'string',
      'date',
      'string',
      'date',
      'hidden',
    ],
    data: [
      {
        'juror_number': '645200045',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        'postcode': 'CH1 2AN',
        'status': 'Disqualified',
        'date_disqualified': '2023-10-09',
        'Reason': 'Age',
        'date_printed': '2023-10-09',
        id: '645200045',
      },
      {
        'juror_number': '645200045',
        'first_name': 'James',
        'last_name': 'Ashcroft',
        'postcode': 'CH1 2AN',
        'status': 'Disqualified',
        'date_disqualified': '2023-10-09',
        'Reason': 'Age',
        'date_printed': 'Pending',
        id: '645200046',
      },
    ],
  };
}
