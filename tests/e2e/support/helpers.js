const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const moment = require('moment');
const momentBusiness = require('moment-business');
const oracledb = require('oracledb');
const dbConfig = require('./dbconfig.js');
const dataGenerator = require('./responseData').baseData;

/**
 * Executes sql file against the OracleDB
 * @param {string} sql The string statement to execute
 * @param {Function} callback Cucumber callback function
 * @return {Void}
 */
module.exports.executeSql = function executeSql(sql) {
  return new Promise((resolve, reject) => {
    oracledb.getConnection(dbConfig, (connErr, connection) => {
      if (connErr) {
        return reject(connErr);
      }

      return connection.execute(`BEGIN ${sql} END;`, {}, {
        autoCommit: true,
      }, executeErr => connection.release((releaseErr) => {
        if (executeErr) {
          return reject(executeErr);
        }

        if (releaseErr) {
          return reject(releaseErr);
        }

        return resolve('success');
      }));
    });
  });
};

/**
 * Executes sql file against the OracleDB
 * @param  {string} file Name of file, without the extension
 * @param {Function} callback Cucumber callback function
 * @param {array} replaceData Key value pairings used for data substitution
 * @return {Void}
 */
module.exports.loadSql = function loadSql(file, callback, replaceData) {
  return new Promise((resolve, reject) => {
    let sql = fs.readFileSync(path.resolve(__dirname, '../', 'sql', `${file}.sql`)).toString();
    const tmpData = _.cloneDeep(replaceData);

    if (typeof tmpData !== 'undefined') {
      if (!Object.prototype.hasOwnProperty.call(tmpData, 'completedAt') || tmpData.completedAt === 'null') {
        tmpData.completedAt = null;
      } else {
        tmpData.completedAt = `TO_DATE('${tmpData.completedAt} 00:00:00', 'YYYY-MM-DD HH24:MI:SS')`;
      }

      Object.keys(tmpData).forEach((key) => {
        sql = sql.split(`[${key}]`).join(tmpData[key]);
      });
    }

    oracledb.getConnection(dbConfig, (connErr, connection) => {
      if (connErr) {
        return reject(connErr);
      }

      return connection.execute(`BEGIN ${sql} END;`, {}, {
        autoCommit: true,
      }, executeErr => connection.release((releaseErr) => {
        if (executeErr) {
          return reject(executeErr);
        }
        if (releaseErr) {
          return reject(releaseErr);
        }

        return resolve('success');
      }));
    });
  });
};


/**
 * Ensures that the LAST_USED column is correctly updated
 * @param  {Function} expect The expect library from Chai
 * @param {Function} callback Cucumber callback function
 * @return {Void}
 */
module.exports.checkLastUsed = function checkLastUsed() {
  return new Promise((resolve, reject) => {
    const sqlCheckQuery = "SELECT LAST_USED, CURRENT_DATE FROM JUROR.PASSWORD WHERE LOGIN = 'samanthak'";

    oracledb.getConnection(dbConfig, (connErr, connection) => {
      if (connErr) {
        return reject(connErr);
      }

      return connection.execute(sqlCheckQuery, {}, (executeErr, result) => connection.release((releaseErr) => {
        if (executeErr) {
          return reject(executeErr);
        }

        if (releaseErr) {
          return reject(releaseErr);
        }
        return resolve({
          lastUpdatedDate: result.rows[0][0].toString().slice(0, 15),
          currentDate: result.rows[0][1].toString().slice(0, 15),
        });
      }));
    });
  });
};

/**
 * Checks that the value from given field of given table matches the given answer
 * @param {string} table The OracleDB table to be checked
 * @param {string} checkField The field to be checked from the OracleDB table
 * @param {string} checkValue The expected value
 * @param {string} whereField The field to be used to find unique record
 * @param {string} whereValue The value used in where check
 * @param {Function} callback Cucumber callback function
 * @param {Function} expect The expect library from Chai
 * @param {boolean} isNot If true, will check that value does not equal provided
 * @return {Void}
 */
// eslint-disable-next-line max-len
module.exports.checkDatabase = function checkDatabase(table, checkField, checkValue, whereField, whereValue) {
  return new Promise((resolve, reject) => {
    const sqlCheckQuery = `SELECT ${checkField} FROM ${table} WHERE ${whereField} = '${whereValue}'`;

    oracledb.getConnection(dbConfig, (connErr, connection) => {
      if (connErr) {
        return reject(connErr);
      }

      return connection.execute(sqlCheckQuery, {}, (executeErr, result) => connection.release((releaseErr) => {
        if (executeErr) {
          return reject(executeErr);
        }

        if (releaseErr) {
          return reject(releaseErr);
        }

        return resolve((result.rows[0][0] !== null) ? result.rows[0][0].toString() : result.rows[0][0]);
      }));
    });
  });
};


/**
 * Checks that the value from given field of given table matches the given answer, in a date format
 * @param {string} table The OracleDB table to be checked
 * @param {string} checkField The field to be checked from the OracleDB table
 * @param {string} checkValue The expected value
 * @param {string} whereField The field to be used to find unique record
 * @param {string} whereValue The value used in where check
 * @param {string} format The momentjs date format to be used for comparison
 * @param {Function} callback Cucumber callback function
 * @param {Function} expect The expect library from Chai
 * @return {Promise}
 */
module.exports.checkDatabaseDate = function checkDatabaseDate(table, checkField, whereField, whereValue, format) {
  return new Promise((resolve, reject) => {
    const sqlCheckQuery = `SELECT TO_CHAR(${checkField}, '${format}') FROM ${table} WHERE ${whereField} = '${whereValue}'`;

    return oracledb.getConnection(dbConfig, (connErr, connection) => {
      if (connErr) {
        return reject(connErr.message);
      }

      return connection.execute(sqlCheckQuery, {}, (executeErr, result) => connection.release((releaseErr) => {
        if (executeErr) {
          return reject(executeErr);
        }

        if (releaseErr) {
          return reject(releaseErr);
        }

        return resolve((result.rows[0][0] !== null) ? result.rows[0][0].toString() : result.rows[0][0]);
      }));
    });
  });
};


/**
 * Checks that the value from given field of given table matches the given answer
 * @param {string} table The OracleDB table to be checked
 * @param {string} checkField The field to be checked from the OracleDB table
 * @param {string} checkValue The expected value
 * @param {string} whereField The field to be used to find unique record
 * @param {string} whereValue The value used in where check
 * @return {Void}
 */
module.exports.countDatabase = function countDatabase(table, checks) {
  return new Promise((resolve, reject) => {
    let sqlCheckQuery = `SELECT * FROM ${table} WHERE`;
    let iChecks = 0;

    for (iChecks; iChecks < checks.length; iChecks += 1) {
      const check = checks[iChecks];
      if (iChecks > 0) {
        sqlCheckQuery += ' AND ';
      }
      sqlCheckQuery += ` ${check.field} = '${check.value}'`;
    }

    oracledb.getConnection(dbConfig, (connErr, connection) => {
      if (connErr) {
        return reject(connErr);
      }

      return connection.execute(sqlCheckQuery, {}, (executeErr, result) => connection.release((releaseErr) => {
        if (executeErr) {
          return reject(executeErr);
        }

        if (releaseErr) {
          return reject(releaseErr);
        }

        return resolve(result.rows.length);
      }));
    });
  });
};


/**
 * Calculate required court date to make record super urgent based on todays date
 *
 * @return {object}
 */
module.exports.calculateSuperUrgency = function calculateSuperUrgency() {
  // Ensure received date is first work day after previous Friday from today
  const superUrgentReceivedDate = moment().day('Friday').subtract(6, 'days');

  // Ensures court date is beyond a Friday
  const courtDate = momentBusiness.addWeekDays(moment().day('Friday').subtract(7, 'days'), 7);

  return {
    receivedAt: superUrgentReceivedDate,
    courtDate,
  };
};


/**
 * Calculate required court date to make record urgent based on todays date
 *
 * @return {object}
 */
module.exports.calculateUrgency = function calculateUrgency() {
  // Ensure received date is first work day after previous Friday from today
  const urgentReceivedDate = moment().day('Friday').subtract(7, 'days');

  // Ensures court date is beyond a Friday
  const courtDate = momentBusiness.addWeekDays(moment().day('Friday').subtract(7, 'days'), 7);

  return {
    receivedAt: urgentReceivedDate,
    courtDate,
  };
};


/**
 * Returns the date for receivedAt required to make a response
 * SLA overdue
 * @return {moment} Moment object
 */
module.exports.calculateSla = function calculateSla() {
  return momentBusiness.subtractWeekDays(moment(), 5);
};


module.exports.generateData = function generateData(givenData = {}) {
  let overwrittenData = {};

  if (Object.prototype.hasOwnProperty.call(givenData, 'processingStatus')) {
    let processingStatus;

    // Map friendly name back to DB name for response status
    switch (givenData.processingStatus) {
      case 'To do':
        processingStatus = 'TODO';
        break;
      case 'Awaiting juror':
        processingStatus = 'AWAITING_CONTACT';
        break;
      case 'Awaiting court reply':
        processingStatus = 'AWAITING_COURT_REPLY';
        break;
      case 'Awaiting translation':
        processingStatus = 'AWAITING_TRANSLATION';
        break;
      case 'Completed':
        processingStatus = 'CLOSED';
        break;
      case 'Closed':
        processingStatus = 'CLOSED';
        break;
      default:
        processingStatus = givenData.processingStatus;
        break;
    }

    overwrittenData = {
      processingStatus,
    };
  }

  const generatedData = dataGenerator(9, 1, 1);

  return _.merge(generatedData, givenData, overwrittenData);
};


module.exports.padTo = function padTo(value, count) {
  let tmpNumber = value;

  if (value <= 9999) {
    tmpNumber = (`123${value}`).slice(-count);
  }

  return tmpNumber;
};

module.exports.zip = function zip(left, right, combiner) {
  const results = [];
  for (let counter = 0; counter < Math.min(left.length, right.length); counter += 1) {
    results.push(combiner(left[counter], right[counter]));
  }

  return results;
};
