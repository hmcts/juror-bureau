/* eslint-disable strict */
const { dateFilter, capitalizeFully, toSentenceCase } = require('../../../components/filters');

const tableDataMappers = {
  String: (data) => isNaN(data) ? capitalizeFully(data) : data.toString(),
  LocalDate: (data) => data ? dateFilter(data, 'YYYY-mm-dd', 'ddd D MMM YYYY') : '-',
  List: (data) => {
    if (data) {
      if (Object.keys(data)[0] === 'jurorAddressLine1') {
        return Object.values(data).reduce(
          (acc, current) => {
            if (current !== '') {
              return acc + ', ' + current;
            }
            return acc;
          },
        );
      }

      if (Object.keys(data)[0] === 'reasonableAdjustmentCodeWithDescription') {
        return [data.reasonableAdjustmentCodeWithDescription, data.jurorReasonableAdjustmentMessage].join(', ');
      }

      let listText = '';

      Object.keys(data).forEach((element, index) => {
        if (data[element] !== '') {
          listText = listText
            + `${toSentenceCase(element)}: ${data[element]}`
            + `${index === Object.keys(data).length - 1 ? '' : ', '}`;
        }
      });
      return listText || '-';
    }
    return '-';
  },
  Long: (data) => data.toString(),
  Integer: (data) => data.toString(),
};

const headingDataMappers = {
  String: (data) => capitalizeFully(data),
  LocalDate: (data) => dateFilter(data, 'YYYY-mm-dd', 'dddd D MMMM YYYY'),
  timeFromISO: (data) => {
    let time = data.split('T')[1].split('.')[0];

    if (parseInt(time.split(':')[0]) === 12) {
      return time + 'pm';
    } else if (parseInt(time.split(':')[0]) > 12) {
      return `${parseInt(time.split(':')[0]) - 12}:${time.split(':').slice(1).join(':')}pm`;
    }

    return time + ' am';
  },
  Integer: (data) => data.toString(),
  Long: (data) => data.toString(),
};

const constructPageHeading = (headingType, data) => {
  if (headingType === 'reportDate') {
    return { title: 'Report created', data: headingDataMappers.LocalDate(data.reportCreated.value) };
  } else if (headingType === 'reportTime') {
    if (data.timeCreated) {
      return { title: 'Time created', data: headingDataMappers.timeFromISO(data.timeCreated.value) };
    }
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
