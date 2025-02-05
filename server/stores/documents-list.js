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
    'dataTypes': [
      'string',
      'string',
      'string',
      'string',
      'date',
      'hidden',
    ],
    data: [
      {
        'jurorNumber': '645200045',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        'datePrinted': '2023-10-09',
        id: '645200045',
      },
      {
        'jurorNumber': '645200046',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        'datePrinted': 'Pending',
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
    'dataTypes': [
      'string',
      'string',
      'string',
      'string',
      'date',
      'hidden',
    ],
    data: [
      {
        'jurorNumber': '645200045',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        'datePrinted': '2023-10-09',
        id: '645200045',
      },
      {
        'jurorNumber': '645200046',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        'datePrinted': 'Pending',
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
    'dataTypes': [
      'string',
      'string',
      'string',
      'string',
      'date',
      'hidden',
    ],
    data: [
      {
        'jurorNumber': '645200045',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        'datePrinted': '2023-10-09',
        id: '645200045',
      },
      {
        'jurorNumber': '645200046',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        'datePrinted': 'Pending',
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
    'dataTypes': [
      'string',
      'string',
      'string',
      'string',
      'date',
      'hidden',
    ],
    data: [
      {
        'jurorNumber': '645200045',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        'datePrinted': '2023-10-09',
        id: '645200045',
      },
      {
        'jurorNumber': '645200045',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        'datePrinted': 'Pending',
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
    'dataTypes': [
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
        'jurorNumber': '645200040',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferredTo': '2023-10-09',
        reason: 'Student',
        'datePrinted': '2023-10-09',
        id: '645200040',
      },
      {
        'jurorNumber': '645200041',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferredTo': '2023-10-09',
        reason: 'Student',
        'datePrinted': '2023-10-09',
        id: '645200041'
      },
      {
        'jurorNumber': '645200042',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferredTo': '2023-10-09',
        reason: 'Student',
        'datePrinted': '2023-10-09',
        id: '645200042'
      },
      {
        'jurorNumber': '645200043',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferredTo': '2023-10-09',
        reason: 'Student',
        'datePrinted': '2023-10-09',
        id: '645200043'
      },
      {
        'jurorNumber': '645200044',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferredTo': '2023-10-09',
        reason: 'Student',
        'datePrinted': '2023-10-09',
        id: '645200044'
      },
      {
        'jurorNumber': '645200046',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferredTo': '2023-10-09',
        reason: 'Student',
        'datePrinted': '2023-10-09',
        id: '645200046'
      },
      {
        'jurorNumber': '645200047',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferredTo': '2023-10-09',
        reason: 'Student',
        'datePrinted': '2023-10-09',
        id: '645200047'
      },
      {
        'jurorNumber': '645200048',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferredTo': '2023-10-09',
        reason: 'Student',
        'datePrinted': '2023-10-09',
        id: '645200048'
      },
      {
        'jurorNumber': '645200049',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferredTo': '2023-10-09',
        reason: 'Student',
        'datePrinted': '2023-10-09',
        id: '645200049'
      },
      {
        'jurorNumber': '645200050',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferredTo': '2023-10-09',
        reason: 'Student',
        'datePrinted': '2023-10-09',
        id: '645200050'
      },
      {
        'jurorNumber': '645200051',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferredTo': '2023-10-09',
        reason: 'Student',
        'datePrinted': '2023-10-09',
        id: '645200051'
      },
      {
        'jurorNumber': '645200052',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferredTo': '2023-10-09',
        reason: 'Student',
        'datePrinted': '2023-10-09',
        id: '645200052'
      },
      {
        'jurorNumber': '645200053',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferredTo': '2023-10-09',
        reason: 'Student',
        'datePrinted': '2023-10-09',
        id: '645200053'
      },
      {
        'jurorNumber': '645200054',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferredTo': '2023-10-09',
        reason: 'Student',
        'datePrinted': '2023-10-09',
        id: '64520004'
      },
      {
        'jurorNumber': '645200055',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferredTo': '2023-10-09',
        reason: 'Student',
        'datePrinted': '2023-10-09',
        id: '645200055'
      },
      {
        'jurorNumber': '645200056',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferredTo': '2023-10-09',
        reason: 'Student',
        'datePrinted': '2023-10-09',
        id: '645200056'
      },
      {
        'jurorNumber': '645200057',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferredTo': '2023-10-09',
        reason: 'Student',
        'datePrinted': '2023-10-09',
        id: '645200057'
      },
      {
        'jurorNumber': '645200058',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferredTo': '2023-10-09',
        reason: 'Student',
        'datePrinted': '2023-10-09',
        id: '645200058'
      },
      {
        'jurorNumber': '645200059',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferredTo': '2023-10-09',
        reason: 'Student',
        'datePrinted': '2023-10-09',
        id: '645200059'
      },
      {
        'jurorNumber': '645200060',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferredTo': '2023-10-09',
        reason: 'Student',
        'datePrinted': '2023-10-09',
        id: '645200060'
      },
      {
        'jurorNumber': '645200061',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferredTo': '2023-10-09',
        reason: 'Student',
        'datePrinted': '2023-10-09',
        id: '645200061'
      },
      {
        'jurorNumber': '645200062',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferredTo': '2023-10-09',
        reason: 'Student',
        'datePrinted': '2023-10-09',
        id: '645200062'
      },
      {
        'jurorNumber': '645200063',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferredTo': '2023-10-09',
        reason: 'Student',
        'datePrinted': '2023-10-09',
        id: '645200063'
      },
      {
        'jurorNumber': '645200064',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferredTo': '2023-10-09',
        reason: 'Student',
        'datePrinted': '2023-10-09',
        id: '645200064'
      },
      {
        'jurorNumber': '645200065',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferredTo': '2023-10-09',
        reason: 'Student',
        'datePrinted': '2023-10-09',
        id: '645200065'
      },
      {
        'jurorNumber': '645200066',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferredTo': '2023-10-09',
        reason: 'Student',
        'datePrinted': '2023-10-09',
        id: '645200066'
      },
      {
        'jurorNumber': '645200067',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferredTo': '2023-10-09',
        reason: 'Student',
        'datePrinted': '2023-10-09',
        id: '645200067'
      },
      {
        'jurorNumber': '645200068',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferredTo': '2023-10-09',
        reason: 'Student',
        'datePrinted': '2023-10-09',
        id: '645200068'
      },
      {
        'jurorNumber': '645200069',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferredTo': '2023-10-09',
        reason: 'Student',
        'datePrinted': '2023-10-09',
        id: '645200069'
      },
      {
        'jurorNumber': '645200070',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferredTo': '2023-10-09',
        reason: 'Student',
        'datePrinted': '2023-10-09',
        id: '645200070'
      },
      {
        'jurorNumber': '645200071',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferredTo': '2023-10-09',
        reason: 'Student',
        'datePrinted': '2023-10-09',
        id: '645200071'
      },
      {
        'jurorNumber': '645200072',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferredTo': '2023-10-09',
        reason: 'Student',
        'datePrinted': '2023-10-09',
        id: '645200072'
      },
      {
        'jurorNumber': '645200073',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferredTo': '2023-10-09',
        reason: 'Student',
        'datePrinted': 'Pending',
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
    'dataTypes': [
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
        'jurorNumber': '645200073',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferredTo': '2023-10-09',
        reason: 'Student',
        'datePrinted': '-',
        'poolNumber': '415240131',
      },
      {
        'jurorNumber': '645200040',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferredTo': '2023-10-09',
        reason: 'Student',
        'datePrinted': '-',
        'poolNumber': '415240131',
      },
      {
        'jurorNumber': '645200041',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferredTo': '2023-10-09',
        reason: 'Student',
        'datePrinted': '-',
        'poolNumber': '415240131',
      },
      {
        'jurorNumber': '645200042',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferredTo': '2023-10-09',
        reason: 'Student',
        'datePrinted': '-',
        'poolNumber': '415240131',
      },
      {
        'jurorNumber': '645200043',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Deferred',
        'deferredTo': '2023-10-09',
        reason: 'Student',
        'datePrinted': '2023-10-09',
        'poolNumber': '415240131',
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
    'dataTypes': [
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
        'jurorNumber': '645200045',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Responded',
        'dateRefused': '2023-10-09',
        reason: 'Student',
        'datePrinted': '2023-10-09',
        id: '645200045',
      },
      {
        'jurorNumber': '645200046',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Responded',
        'dateRefused': '2023-10-09',
        reason: 'Student',
        'datePrinted': 'Pending',
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
    'dataTypes': [
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
        'jurorNumber': '645200045',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Excused',
        'dateExcused': '2023-10-09',
        reason: 'Medical',
        'datePrinted': '2023-10-09',
        id: '645200045',
      },
      {
        'jurorNumber': '645200046',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Excused',
        'dateExcused': '2023-10-11',
        reason: 'Medical',
        'datePrinted': 'Pending',
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
    'dataTypes': [
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
        'jurorNumber': '645200045',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Responded',
        'dateRefused': '2023-10-09',
        reason: 'Medical',
        'datePrinted': '2023-10-09',
        id: '645200045',
      },
      {
        'jurorNumber': '645200046',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        postcode: 'CH1 2AN',
        status: 'Responded',
        'dateRefused': '2023-10-11',
        reason: 'Medical',
        'datePrinted': 'Pending',
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
    'dataTypes': [
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
        'jurorNumber': '645200045',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        'postcode': 'CH1 2AN',
        'status': 'Postponed',
        'postponedTo': '2023-10-09',
        'datePrinted': '2023-10-09',
        id: '645200045',
      },
      {
        'jurorNumber': '645200045',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        'postcode': 'CH1 2AN',
        'status': 'Postponed',
        'postponedTo': '2023-10-09',
        'datePrinted': 'Pending',
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
    'dataTypes': [
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
        'jurorNumber': '645200045',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        'postcode': 'CH1 2AN',
        'status': 'Disqualified',
        'dateDisqualified': '2023-10-09',
        'Reason': 'Age',
        'datePrinted': '2023-10-09',
        id: '645200045',
      },
      {
        'jurorNumber': '645200045',
        'firstName': 'James',
        'lastName': 'Ashcroft',
        'postcode': 'CH1 2AN',
        'status': 'Disqualified',
        'dateDisqualified': '2023-10-09',
        'Reason': 'Age',
        'datePrinted': 'Pending',
        id: '645200046',
      },
    ],
  };
}
