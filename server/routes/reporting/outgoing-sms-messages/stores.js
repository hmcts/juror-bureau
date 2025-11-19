module.exports.outgoingSmsMessagesStore = { 
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
    },
    totalSmsSent: {
      displayName: 'Total SMS sent',
      dataType: 'Long',
      value: 100
    }
  },
  tableData: {
    headings: [
      {
        id: 'court_location',
        name: 'Court',
        dataType: 'String',
        headings: null
      },
      {
        id: 'reminder',
        name: 'Reminder',
        dataType: 'Long',
        headings: null
      },
      {
        id: 'failed_to_attend',
        name: 'Failed to attend',
        dataType: 'Long',
        headings: null
      },
      {
        id: 'date_time_changed',
        name: 'Date & time changed',
        dataType: 'Long',
        headings: null
      },
      {
        id: 'time_changed',
        name: 'Time changed',
        dataType: 'Long',
        headings: null
      },
      {
        id: 'complete_attended',
        name: 'Complete (attended)',
        dataType: 'Long',
        headings: null
      },
      {
        id: 'complete_not_needed',
        name: 'Complete (not needed)',
        dataType: 'Long',
        headings: null
      },
      {
        id: 'next_date',
        name: 'Next date',
        dataType: 'Long',
        headings: null
      },
      {
        id: 'on_call',
        name: 'On call',
        dataType: 'Long',
        headings: null
      },
      {
        id: 'please_contact',
        name: 'Please contact',
        dataType: 'Long',
        headings: null
      },
      {
        id: 'delayed_start',
        name: 'Delayed start',
        dataType: 'Long',
        headings: null
      },
      {
        id: 'selection',
        name: 'Selection',
        dataType: 'Long',
        headings: null
      },
      {
        id: 'bad_weather',
        name: 'Bad weather',
        dataType: 'Long',
        headings: null
      },
      {
        id: 'bring_lunch',
        name: 'Bring lunch',
        dataType: 'Long',
        headings: null
      },
      {
        id: 'check_junk_email',
        name: 'Check junk email',
        dataType: 'Long',
        headings: null
      },
      {
        id: 'excused',
        name: 'Excused',
        dataType: 'Long',
        headings: null
      },
      {
        id: 'sentencing',
        name: 'Sentencing',
        dataType: 'Long',
        headings: null
      },
    ],
    data: [
      {
        courtLocation: 'CHESTER (415)',
        reminder: 100,
        failedToAttend: 100,
        dateTimeChanged: 100,
        timeChanged: 100,
        completeAttended: 100,
        completeNotNeeded: 100,
        nextDate: 100,
        onCall: 100,
        pleaseContact: 100,
        delayedStart: 100,
        selection: 100,
        badWeather: 100,
        bringLunch: 100,
        checkJunkEmail: 100,
        excused: 100,
        sentencing: 100,
      },
      {
        courtLocation: 'Aylesbury (401)',
        reminder: 50,
        failedToAttend: 50,
        dateTimeChanged: 50,
        timeChanged: 50,
        completeAttended: 50,
        completeNotNeeded: 50,
        nextDate: 50,
        onCall: 50,
        pleaseContact: 50,
        delayedStart: 50,
        selection: 50,
        badWeather: 50,
        bringLunch: 50,
        checkJunkEmail: 50,
        excused: 50,
        sentencing: 50,
      }
    ]
  }
};