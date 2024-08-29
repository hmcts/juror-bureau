/* eslint-disable strict */
const { dateFilter, capitalizeFully, toSentenceCase, capitalise, toCamelCase, makeDate } = require('../../../components/filters');
const moment = require('moment');
const { snakeToCamel } = require('../../../lib/mod-utils');

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
  LocalTime: (data) => data ? moment(data, 'HH:mm:ss').format('hh:mma') : '-',
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
  timeFromISO: (data) => dateFilter(data, 'YYYY-MM-DDTHH:mm:ss', 'h:mm:ss a'),
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

const buildTableHeaders = (reportType, tableHeadings, query = {}) => {
  let tableHeaders;
  const { sortBy, sortDirection } = query;

  const resolveSortDirection = (key) => {
    if (!sortBy) return reportType.defaultSortColumn === key ? 'ascending' : 'none';
    return sortBy === key ? (sortDirection ? sortDirection : 'ascending') : 'none';
  };

  if (reportType.bespokeReport && reportType.bespokeReport.tableHeaders) {
    tableHeaders = reportType.bespokeReport.tableHeaders.map((data, index) => ({
      text: data,
      attributes: {
        'aria-sort': resolveSortDirection(toCamelCase(data)),
        'aria-label': data,
        'data-sort-key': toCamelCase(data),
        'data-is-print-sortable': true,
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
          'aria-sort': resolveSortDirection(toCamelCase(data.id)),
          'aria-label': data.name,
          'data-sort-key': toCamelCase(data.id),
          'data-is-print-sortable': true,
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

function sort(sortBy, sortDirection) {
  return (a, b) => {
    const [_a, _b] = formatSortableData(a, b, sortBy);
      
    if (isNumber(_a) && isNumber(_b)) {
      return sortDirection === 'descending' ? _b - _a : _a - _b;
    }

    if (sortDirection === 'descending') {
      return _b.localeCompare(_a);
    } else {
      return _a.localeCompare(_b);
    }
  }
}

function formatSortableData(a, b, sortBy) {
  let _a = a[snakeToCamel(sortBy)] || '-';
  let _b = b[snakeToCamel(sortBy)] || '-';

  if (sortBy === 'jurorPostalAddress') {
    _a = Object.values(a.jurorPostalAddress).join(' ');
    _b = Object.values(b.jurorPostalAddress).join(' ');
  }

  if (sortBy === 'jurorReasonableAdjustmentWithMessage') {
    _a = a.jurorReasonableAdjustmentWithMessage
      ? Object.values(a.jurorReasonableAdjustmentWithMessage).join(' ') : '-';
    _b = b.jurorReasonableAdjustmentWithMessage
      ? Object.values(b.jurorReasonableAdjustmentWithMessage).join(' ') : '-';
  }

  if (sortBy === 'contactDetails') {
    _a = a.contactDetails ? Object.values(a.contactDetails).join(' ') : '-';
    _b = b.contactDetails ? Object.values(b.contactDetails).join(' ') : '-';
  }

  if (sortBy === 'month') {
    _a = dateFilter(a.month, 'mmmm yyyy', 'yyyy-MM-DD');
    _b = dateFilter(b.month, 'mmmm yyyy', 'yyyy-MM-DD');
  }

  if (sortBy === 'date' && (Array.isArray(_a) && Array.isArray(_b))) {
    _a = dateFilter(makeDate(_a), null, 'yyyy-MM-DD');
    _b = dateFilter(makeDate(_b), null, 'yyyy-MM-DD');
  }

  if (isNumber(_a) && _b === '-') {
    _b = 0;
  }
  if (isNumber(_b) && _a === '-') {
    _a = 0;
  }

  return [_a.toString(), _b.toString()];
}

function isNumber(n) {
  return !isNaN(parseFloat(n)) && !(moment(n, 'yyyy-MM-DD', true).isValid());
}

module.exports.tableDataMappers = tableDataMappers;
module.exports.constructPageHeading = constructPageHeading;
module.exports.buildTableHeaders = buildTableHeaders;
module.exports.sort = sort;
