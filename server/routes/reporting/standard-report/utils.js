/* eslint-disable strict */
const { dateFilter, capitalizeFully } = require('../../../components/filters');

const tableDataMappers = {
  String: (data) => capitalizeFully(data),
  LocalDate: (data) => dateFilter(data, 'YYYY-mm-dd', 'ddd D MMM YYYY'),
  List: (data) => {
    if (Object.keys(data)[0] === 'jurorAddressLine1'){
      return Object.values(data).reduce(
        (acc, current) => {
          return acc + ', ' + current;
        },
      );
    }
    let listText = '';

    Object.keys(data).forEach((element, index) => {
      listText = listText
        + `${toSentenceCase(element)}: ${data[element]}`
        + `${index === Object.keys(data).length - 1 ? '' : ', '}`;
    });
    return listText;
  },
  Long: (data) => data.toString(),
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
  Integer: (data) => data,
  Long: (data) => data.toString(),
};

const constructPageHeading = (headingType, data) => {
  if (headingType === 'reportDate') {
    return { title: 'Report created', data: headingDataMappers.LocalDate(data.reportCreated.value) };
  } else if (headingType === 'reportTime') {
    return { title: 'Time created', data: headingDataMappers.timeFromISO(data.reportCreated.value) };
  }
  const headingData = data[headingType];

  if (headingData) {
    return { title: headingData.displayName, data: headingDataMappers[headingData.dataType](headingData.value)};
  }

  return {};
};

module.exports.tableDataMappers = tableDataMappers;
module.exports.constructPageHeading = constructPageHeading;
