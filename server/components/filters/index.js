;(function(){
  'use strict';

  const _ = require('lodash')
  const moment = require('moment');
  require ('moment-timezone');

  module.exports = {
    prettify: function(str, upperFirst) {
      var bUpperFirst = (typeof upperFirst === 'undefined')
        , tmpStr = str
          .replace(/([A-Z]+)/g, ' $1')
          .replace(/([A-Z][a-z])/g, ' $1')
          .replace(/\s\s+/g, ' ')
          .toLowerCase();

      if (bUpperFirst) {
        return tmpStr.charAt(0).toUpperCase() + tmpStr.slice(1);
      }
      return tmpStr;
    },

    isString: function(obj) {
      return typeof obj === 'string';
    },

    changelogKeyName: function(str) {
      var result = str
        , replacementMap = {
          'L': 'Limited Mobility',
          'H': 'Hearing Impairment',
          'I': 'Diabetes',
          'V': 'Visual Impairment',
          'R': 'Learning Disability',
          'O': 'Other Adjustment',
          'Other': 'Other CJS',
          'third PartyF Name': 'Third Party First Name',
          'third PartyL Name': 'Third Party Last Name',
        };

      if (typeof str === 'undefined' || !str) {
        return;
      }

      result = result.replace(/([A-Z][a-z])/g, ' $1');

      result = replacementMap[result] || result;

      return result.charAt(0).toUpperCase() + result.slice(1);
    },

    changelogValue: function(str) {
      var result = str
        , replacementMap = {
          'L': 'Yes',
          'H': 'Yes',
          'I': 'Yes',
          'V': 'Yes',
          'R': 'Yes',
          'true': 'Yes',
          'false': 'No',
        };

      if (typeof str === 'undefined' || !str) {
        return;
      }

      result = replacementMap[result] || result;
      return result;
    },

    checkCjsEmployer: function(employerList, employer, outputMatch, outputNoMatch) {
      var matched = _.find(employerList, { employer: employer });

      return (typeof matched !== 'undefined') ? outputMatch : outputNoMatch;
    },

    getCjsEmployer: function(employerList, employer, returnKey) {
      var matched = _.find(employerList, { employer: employer });

      if (typeof matched === 'undefined') {
        return;
      }

      if (typeof returnKey !== 'undefined') {
        return (Object.prototype.hasOwnProperty.call(matched, returnKey)) ? matched[returnKey] : null;
      }

      return matched;
    },

    checkArr: function(arr, key, value, outputMatch, outputNoMatch) {
      var matched = _.find(arr, function(o) {
        return o[key] === value;
      });

      return (typeof matched !== 'undefined') ? outputMatch : outputNoMatch;
    },

    getArr: function(arr, key, value, returnKey) {
      var matched = _.find(arr, function(o) {
        return o[key] === value;
      });

      if (typeof matched === 'undefined') {
        return;
      }

      if (typeof returnKey !== 'undefined') {
        return (Object.prototype.hasOwnProperty.call(matched, returnKey)) ? matched[returnKey] : null;
      }

      return matched;
    },

    dateFilter:function(date, sourceFormat, outputFormat) {
      var result,
        errs = [],
        args = [],
        mnt = null,
        dateFilterDefaultFormat = 'DD/MM/YYYY';
      let inputFormat;

      if (typeof date === 'string') {
        if (/\d\d[-/]\d\d[-/]\d\d\d\d/.exec(date)) {
          inputFormat = 'DD/MM/YYYY';
        }
      }

      if (date && date.length === 3) {
        date[1] = date[1] - 1;
      }

      Array.prototype.push.apply(args, arguments);
      try {
        mnt = moment(date, inputFormat).tz("Europe/London");
      } catch (err) {
        errs.push(err);
      }
      if (mnt) {
        try {
          if (dateFilterDefaultFormat!==null) {
            result = mnt.format(outputFormat || dateFilterDefaultFormat);
          } else {
            result = mnt.format(outputFormat);
          }
        } catch (err) {
          errs.push(err);
        }
      }

      if (errs.length) {
        return errs.join('\n');
      }
      return result;
    },

    capitalise:function(str) {
      var result = str;

      if (typeof str === 'string'){
        result = str.toUpperCase();
      }

      return result;
    },

    replyTypeSort:function(replyType) {
      var result = '0';

      if (typeof replyType === 'string'){
        switch (replyType.toUpperCase()) {
        case 'INELIGIBLE':
          result = '4';
          break;
        case 'EXCUSAL':
          result = '3';
          break;
        case 'DEFERRAL':
          result = '2';
          break;
        case 'NEEDS REVIEW':
          result = '1';
          break;
        default:
          result='0';
        }
      }

      return result;
    },

    translateDate: function(dateValue, sourceFormat, displayFormat, lang) {

      var mnt = require('moment')
        , returnValue;

      // Set defaults
      returnValue = dateValue;
      mnt.locale('en-gb');

      if (lang === 'en'){
        lang = 'en-gb';
      }

      try {
        mnt.locale(lang);
        returnValue = mnt(dateValue, sourceFormat).format(displayFormat);
      } catch (ex){
        console.error(ex);
      }

      mnt.locale('en-gb');
      return returnValue;

    },

    capitalizeFully: function(string) {
      if (!string) return;

      const parts = string.split(' ');

      const capitalizedParts = parts.map(function(part) {
        return part.trim().charAt(0).toUpperCase() + part.trim().slice(1).toLowerCase();
      });

      return capitalizedParts.join(' ');
    },

    transformPoolType: function(poolType) {
      var poolTypes = {
        CRO: 'Crown court',
        COR: 'Coroner’s court',
        CIV: 'Civil court',
        HGH: 'High court',
      };

      return poolTypes[poolType];
    },

    // I dont like this... needs improvement
    buildRecordAddress: function(lines) {
      return lines.filter(function(x, i) {
        return (typeof x !== 'undefined' && x !== null && x !== '' && i < lines.length);
      }).join('<br> ');
    },

    /**
     * just a date builder from an array or empty data
     * @param {number[]} date An array of numbers representing a date
     * @returns {date} The formated date
     */
    makeDate: function(date) {
      const dateRegex = /\d{4}-\d{2}-\d{2}/g;

      // eslint is flagging this but sonar will also flagging if I dont do this........
      if ((!date?.length || !(date instanceof Array)) && !dateRegex.test(date)) {
        return new Date();
      }

      return new Date(date);
    },

    console: function(obj) {
      return JSON.stringify(obj);
    },

    /**
     *
     * @param {string} name The name of the officer that processed the response or AUTO
     * @returns {string} With System if AUTO or the officer's name
     */
    isAutoProcessed: function(name) {
      if (!name || name.toLowerCase() === 'auto') return 'System';
      return name;
    },

    /**
     *
     * @param {string} time The time to be converted (10:00am or 2:30pm)
     * @returns {number | undefined} the converted time (1000 or 1430)
     */
    convertAmPmToLong: function(time) {
      let period = time.match(/(am|pm)/g);
      let digits = time.match(/\d+/g);
      let finalTime;

      if (!period || !digits) return;
      period = period[0];

      if (digits[0] === '12') {
        digits[0] = '0';
      }

      switch (period) {
      case 'am':
        finalTime = +digits.join('');
        break;
      case 'pm':
        digits[0] = +digits[0] + 12;
        finalTime = +digits.join('');
        break;
      }

      if (finalTime > 2359) {
        finalTime = finalTime - 1200;
      }

      return finalTime;
    },

    timeArrayToString: function(timeArray) {
      if (typeof timeArray === 'string') return timeArray;

      let period = 'am';

      if (timeArray[0] > 12 && timeArray[0] <= 24) {
        period = 'pm';
      }

      if (timeArray[1].toString().length === 1) {
        timeArray[1] = '0' + timeArray[1];
      }

      return timeArray.join(':') + period;
    },

    timeStringToArray: function(timeString) {
      if (Array.isArray(timeString)) return timeString;

      let timeArray = [];
      let period = timeString.slice(-2);

      timeArray.push(timeString.slice(0, -5));
      timeArray.push(timeString.slice(-4, -2));

      if (period === 'pm' && timeArray[0] < 12) {
        timeArray[0] = +timeArray[0] + 12;
      }

      return timeArray;
    },

    convert12to24: function(time12) {
      const [time, period] = time12.split(/(?=[APap])/);
      let [hours, minutes] = time.split(':');

      hours = parseInt(hours, 10);
      minutes = parseInt(minutes, 10);

      if (period.toLowerCase() === 'pm' && hours !== 12) {
        hours += 12;
      } else if (period.toLowerCase() === 'am' && hours === 12) {
        hours = 0;
      }

      if (minutes.toString().length === 1) minutes = `0${minutes}`;
      if (hours.toString().length === 1) hours = `0${hours}`;

      return `${hours}:${minutes}`;
    },

    convert24to12: function(time24) {
      let [hours, minutes] = time24.split(':');

      hours = parseInt(hours, 10);
      minutes = parseInt(minutes, 10);

      const period = hours >= 12 ? 'pm' : 'am';

      if (hours > 12) {
        hours -= 12;
      } else if (hours === 0) {
        hours = 12;
      }

      if (minutes.toString().length === 1) minutes = `0${minutes}`;

      return `${hours}:${minutes}${period}`;
    },

    attendanceType: function(type) {
      switch (type) {
      case 'FULL_DAY':
        return 'Full day';
      case 'FULL_DAY_LONG_TRIAL':
        return 'Full day (>10 days)';
      case 'HALF_DAY':
        return 'Half day';
      case 'HALF_DAY_LONG_TRIAL':
        return 'Half day (>10 days)';
      case 'NON_ATTENDANCE':
        return 'Non-attendance day';
      case 'NON_ATTENDANCE_LONG_TRIAL':
        return 'Non-attendance day (>10 days)';
      case 'ABSENT':
        return 'Absent';
      };
    },

    toFixed: function(num, length) {
      const zeros = length || 2;

      if (!num) {
        // LESS GO JS
        return '0.00';
      }

      if (isNaN(num)) {
        return num;
      }

      return parseFloat(num).toFixed(zeros);
    },

    /**
     * Takes in an array/list and returns a grammatically correct string output.
     * @param {array} inputList input list
     * @returns {string} gramatically correct output
     */
    prettyList: (inputList) => {
      return inputList.reduce(
        (acc, current, index) => {
          if (index === inputList.length - 1) {
            return acc + ' and ' + current;
          }
          return acc + ', ' + current;
        },
      );
    },

    fullCourtType: function(court) {
      switch (court) {
      case 'CRO':
        return 'Crown court';
      case 'COR':
        return 'Coroner’s court';
      case 'CIV':
        return 'Civil court';
      case 'HGH':
        return 'High court';
      }
    },

    convert24toHours: function(time24) {
      let [hours, minutes] = time24.split(':');

      hours = parseInt(hours) * 60;
      minutes = parseInt(minutes);

      let time = hours + minutes;

      return Math.round((time / 60) * 100) / 100;
    },

    toCamelCase: function(str) {
      return _.camelCase(str);
    },

    toKebabCase: function(str) {
      return _.kebabCase(str);
    },

    toSentenceCase: function(str) {
      return _.upperFirst(_.lowerCase(str));
    },

    sortCode: function(str) {
      return `${str[0]}${str[1]}-${str[2]}${str[3]}-${str[4]}${str[5]}`
    },

    hoursStringToHoursAndMinutes: function(time) {
      const hours = parseInt(time.split(':')[0]);
      const mins = parseInt(time.split(':')[1]);

      return `${hours > 0 ? hours + (hours > 1 ? ' hours ' : ' hour ') : ''}${mins > 0 ? mins + (mins > 1 ? ' minutes' : ' minute') : ''}`
    },

    timeToDuration: function(time) {
      let hours = parseInt(time.split(':')[0]);
      const mins = parseInt(time.split(':')[1]);
      if (mins > 0) {
        hours += (mins / 60);
      }
      return hours;
    },

    transformCourtName: function(courtObj) {
      return _.startCase(_.toLower(courtObj.locationName)).trim().replace(',', '') + ' (' + courtObj.locationCode + ')';
    },

    arrayIncludes: function(arr, value) {
      return arr.includes(value);
    },

    toMoney: function(value) {
      return value < 0 
        ? `(£${Math.abs(value).toFixed(2)})`
        : `£${(value || 0).toFixed(2)}`;
    },

    jurorStatusToString: function(status) {
      const { getJurorStatus } = require('../../lib/mod-utils');
      return getJurorStatus(status);
    },
    
    historyAttendanceDate: function(date) {
      const regex = /([0-9]{4}-[0-9]{2}-[0-9]{2})/g
      const parts = date?.split(regex);

      return parts?.map((item, index) => {

        if (item.match(regex)) {
          return `${moment(new Date(item)).format('d MMM YYYY')}`
        }
        
        return item;
      }).join('');
    },

    historyAuditLinkify: function(copy) {
      const parts = copy?.split(/([A-Z][0-9]+)/g);
      
      return parts?.map((item) => {
        if (item.match(/[A-Z][0-9]+/)) {
          if (item.startsWith('F')) {
            return `<a href="/reports/financial-audit/${item}" target="_blank">${item}</a>`;
          }
          if (item.startsWith('P')) {
            return `<a href="/reporting/pool-attendance-audit/report/${item}/print" target="_blank">${item}</a>`;
          }
          if (item.startsWith('J')) {
            return `<a href="/reporting/jury-attendance-audit/report/${item}/print" target="_blank">${item}</a>`;
          }
          if (item.startsWith('T')) {
            return `<a href="#" target="_blank">${item}</a>`;
          }
        }
        
        return item;
      }).join('');
    }
  };

})();
