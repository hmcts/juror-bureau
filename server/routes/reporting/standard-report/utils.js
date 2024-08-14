/* eslint-disable strict */
const { dateFilter, capitalizeFully, toSentenceCase, capitalise } = require('../../../components/filters');
const moment = require('moment');

const tableDataMappers = {
  String: (data) => isNaN(data) ? capitalizeFully(data) : (data?.toString() || '-' ),
  LocalDate: (data) => data ? dateFilter(data, 'YYYY-mm-dd', 'ddd D MMM YYYY') : '-',
  LocalDateTime: (data) => data ? moment(data).tz('Europe/London').format('D MMM YYYY [at] HH:mm a') : '-',
  List: (data) => {
    if (data) {
      if (Object.keys(data)[0] === 'jurorAddressLine1') {
        let addressString = ''
        for (const [key, value] of Object.entries(data)) {
          if (value !== '') {
            addressString += (key === 'jurorPostcode' ? (capitalise(value)) : (capitalizeFully(value)) + ', ');
          }
        }
        return addressString;
      }

      if (Object.keys(data)[0] === 'reasonableAdjustmentCodeWithDescription') {
        return [`<b>${capitalizeFully(data.reasonableAdjustmentCodeWithDescription)}</b>`, data.jurorReasonableAdjustmentMessage].join(', ');
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
  Long: (data) => data ? data.toString() : '-',
  Integer: (data) => data.toString(),
  LocalTime: (data) => data ? moment(data, 'HH:mm:ss').tz('Europe/London').format('hh:mma') : '-',
  BigDecimal: (data) => {
    return data < 0 
      ? `(£${(Math.round(Math.abs(data) * 100) / 100).toFixed(2).toString()})`
      : `£${(Math.round(data * 100) / 100).toFixed(2).toString()}`
  },
  Boolean: (data) => data ? 'Yes' : 'No',
  Double: (data) => data ? data.toFixed(2).toString() : '-',
};

const headingDataMappers = {
  String: (data) => capitalizeFully(data),
  LocalDate: (data) => dateFilter(data, 'YYYY-mm-dd', 'dddd D MMMM YYYY'),
  timeFromISO: (data) => dateFilter(data, 'YYYY-MM-DDTHH:mm:ss', 'hh:mm:ss a'),
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

const buildTableHeaders = (reportType, tableHeadings) => {
  let tableHeaders;

  if (reportType.bespokeReport && reportType.bespokeReport.tableHeaders) {
    tableHeaders = reportType.bespokeReport.tableHeaders.map((data, index) => ({
      text: data,
      attributes: {
        'aria-sort': index === 0 ? 'ascending' : 'none',
        'aria-label': data,
      },
      classes: reportType.bespokeReport?.tableHeadClasses ? reportType.bespokeReport?.tableHeadClasses[index] : ''
    }));
  } else {
    tableHeaders = tableHeadings.map((data, index) => {
      if (!data.name || data.name === '') return;
      let classes = '';

      if (data.name === 'Service Start Date') {
        classes = classes + ' mod-min-width-150';
      }

      return ({
        html: reportType.tableHeaderTransformer ? reportType.tableHeaderTransformer(data) : data.name,
        attributes: {
          'aria-sort': index === 0 ? 'ascending' : 'none',
          'aria-label': data.name,
        },
        classes: reportType.bespokeReport?.tableHeadClasses
          ? reportType.bespokeReport?.tableHeadClasses[index]
          : classes,
        format: data.dataType === 'BigDecimal' ? 'numeric' : '',
      });
    });
  }

  if (reportType.bespokeReport && reportType.bespokeReport.insertColumns) {
    Object.keys(reportType.bespokeReport.insertColumns).map((key) => {
      tableHeaders.splice(key, 0, {text: reportType.bespokeReport.insertColumns[key][0]});
    });
  }
  return tableHeaders;
};

module.exports.tableDataMappers = tableDataMappers;
module.exports.constructPageHeading = constructPageHeading;
module.exports.buildTableHeaders = buildTableHeaders;
