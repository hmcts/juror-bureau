const moment = require('moment');

const validateDateInitial = (date) => {
  const [day, month, year] = date.split('/');
  const intDay = parseInt(day);
  const intMonth = parseInt(month);
  const intYear = parseInt(year);
  const dateAsDate = new Date(intYear, intMonth - 1, intDay);
  const isMonthAndDayValid = isValidDaysAndMonth(intDay, intMonth, intYear);

  return { isMonthAndDayValid, dateAsDate, intYear };
};

const isValidDaysAndMonth = (day, month, year) => {
  return month >= 1 && month <= 12 && day > 0 && day <= daysInMonth(month, year);
};

const daysInMonth = (month, year) => {
  switch (month) {
  case 2:
    return (year % 4 === 0 && year % 100) || year % 400 === 0 ? 29 : 28;
  case 9:
  case 4:
  case 6:
  case 11:
    return 30;
  default:
    return 31;
  }
};

module.exports = {
  parseDate: validateDateInitial,
  moment,
};
