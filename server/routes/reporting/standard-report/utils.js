/* eslint-disable strict */
const { dateFilter, capitalizeFully } = require('../../../components/filters');

// type IReportKey = {[key:string]: {
//   title: string,
//   apiKey: string,
//   search?: 'poolNumber' | 'dateRange', // etc only poolNumber is currently implemented
//   headings: string[], // corresponds to the ids provided for the headings in the API
//                       // (except report created dateTime)
// }};
module.exports.reportKeys = {
  'next-due': {
    title: 'Next attendance date report',
    apiKey: 'NextAttendanceDayReport',
    search: 'poolNumber',
    headings: [
      'poolNumber',
      'reportDate',
      'poolType',
      'reportTime',
      'serviceStartDate',
      'courtName',
    ],
  },
  'undelivered': {
    title: 'Undelivered list',
    apiKey: 'UndeliverableListReport',
    search: 'poolNumber',
    headings: [
      'poolNumber',
      'reportDate',
      'poolType',
      'reportTime',
      'serviceStartDate',
      'courtName',
      'totalUndelivered',
    ],
  },
};

const tableDataMappers = {
  String: (data) => capitalizeFully(data),
  LocalDate: (data) => dateFilter(data, 'YYYY-mm-dd', 'ddd D MMM YYYY'),
  List: (data) => Object.values(data).reduce(
    (acc, current) => {
      return acc + ', ' + current;
    },
  ),
};

const headingDataMappers ={
  String: (data) => capitalizeFully(data),
  LocalDate: (data) => dateFilter(data, 'YYYY-mm-dd', 'dddd D MMMM YYYY'),
  timeFromISO: (data) => {
    const time = data.split('T')[1].split('.')[0];

    if (time.split(':')[0] === 12) {
      return time + 'pm';
    } else if (time.split(':')[0] > 12) {
      return `${time.split(':')[0] - 12}:${time.split(':').slice(1).join(':')}pm`;
    }

    return time + 'am';
  },
  Long: (data) => data,
};

const constructPageHeading = (headingType, data) => {
  if (headingType === 'reportDate') {
    return { title: 'Report created', data: headingDataMappers.LocalDate(data.reportCreated.value) };
  } else if (headingType === 'reportTime') {
    return { title: 'Time created', data: headingDataMappers.timeFromISO(data.reportCreated.value) };
  }
  const headingData = data[headingType];

  return { title: headingData.displayName, data: headingDataMappers[headingData.dataType](headingData.value)};
};

module.exports.tableDataMappers = tableDataMappers;
module.exports.constructPageHeading = constructPageHeading;
