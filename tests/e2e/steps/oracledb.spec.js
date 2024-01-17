const moment = require('moment');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const loadSql = require('../support/helpers').loadSql;
const checkDatabase = require('../support/helpers').checkDatabase;
const checkDatabaseDate = require('../support/helpers').checkDatabaseDate;
const countDatabaseHelper = require('../support/helpers').countDatabase;
const checkLastUsed = require('../support/helpers').checkLastUsed;
const calculateSuperUrgency = require('../support/helpers').calculateSuperUrgency;
const calculateUrgency = require('../support/helpers').calculateUrgency;
const responseData = require('../support/responseData').data;
const generateData = require('../support/helpers').generateData;
const executeSql = require('../support/helpers').executeSql;
const padTo = require('../support/helpers').padTo;

module.exports = function steps() {
  this.Given(/^I truncate the database tables$/, { timeout: 30 * 1000 }, (callback) => {
    loadSql('truncate')
      .then((result) => {
        expect(result).to.equal('success');
        callback();
      })
      .catch((err) => {
        callback(err);
      });
  });

  this.Given(/^I setup the db with the file named "([^"]*)"$/, (file, callback) => {
    loadSql(file)
      .then((result) => {
        expect(result).to.equal('success');
        callback();
      })
      .catch((err) => {
        callback(err);
      });
  });

  this.Given(/^I add the "([^"]*)" data$/, (file, callback) => {
    loadSql(file, callback)
      .then((result) => {
        expect(result).to.equal('success');
        callback();
      })
      .catch((err) => {
        callback(err);
      });
  });


  this.Then(/^the column last_used in the password table should contain the current date$/, (callback) => {
    checkLastUsed(expect, callback)
      .then((result) => {
        expect(result.lastUpdatedDate).to.equal(result.currentDate);
        callback();
      })
      .catch((err) => {
        callback(err);
      });
  });

  // eslint-disable-callback-line max-len
  this.Then(/^I check the "([^"]*)" table for "([^"]*)" within the "([^"]*)" field for "([^"]*)" "([^"]*)"$/, (table, checkValue, checkField, whereField, whereValue, callback) => {
    checkDatabase(table, checkField, checkValue, whereField, whereValue)
      .then((result) => {
        expect(result).to.equal((checkValue === '' || checkValue === 'NULL') ? null : checkValue);
        callback();
      })
      .catch((err) => {
        callback(err);
      });
  });

  // eslint-disable-callback-line max-len
  this.Then(/^I check the "([^"]*)" table does not have "([^"]*)" within the "([^"]*)" field for "([^"]*)" "([^"]*)"$/, (table, checkValue, checkField, whereField, whereValue, callback) => {
    checkDatabase(table, checkField, checkValue, whereField, whereValue)
      .then((result) => {
        expect(result).to.not.equal((checkValue === '' || checkValue === 'NULL') ? null : checkValue);
        callback();
      })
      .catch((err) => {
        callback(err);
      });
  });

  this.Then(/^I check that "([^"]*)" table has a result for "([^"]*)" "([^"]*)" AND "([^"]*)" "([^"]*)"$/, (table, checkFieldOne, checkValueOne, checkFieldTwo, checkValueTwo, callback) => {
    const checks = [{
      field: checkFieldOne,
      value: checkValueOne,
    }, {
      field: checkFieldTwo,
      value: checkValueTwo,
    }];

    countDatabaseHelper(table, checks)
      .then((result) => {
        expect(result).to.be.above(0);
        callback();
      })
      .catch((err) => {
        callback(err);
      });
  });

  this.Then(/^I check the "([^"]*)" table for "([^"]*)" within the "([^"]*)" date field with format "([^"]*)" for "([^"]*)" "([^"]*)"$/, (table, checkValue, checkField, format, whereField, whereValue, callback) => {
    checkDatabaseDate(table, checkField, whereField, whereValue, format)
      .then((result) => {
        expect(result).to.equal(checkValue);
        callback();
      })
      .catch((err) => {
        callback(err);
      });
  });

  // eslint-disable-callback-line max-len
  this.Then(/^I check the "([^"]*)" table for a date "([^"]*)" months in the future within the "([^"]*)" date field for "([^"]*)" "([^"]*)"$/, (table, countValue, checkField, whereField, whereValue, callback) => {
    const checkValue = moment().add(countValue, 'months').format('YYYY-MM-DD');

    checkDatabaseDate(table, checkField, whereField, whereValue, 'YYYY-MM-DD')
      .then((result) => {
        expect(result.substr(0, 7)).to.equal((checkValue === '' || checkValue === 'NULL') ? null : checkValue.substr(0, 7));
        callback();
      })
      .catch((err) => {
        callback(err);
      });
  });

  // eslint-disable-callback-line max-len
  this.Then(/^I check the "([^"]*)" table for todays date within the "([^"]*)" date field for "([^"]*)" "([^"]*)"$/, (table, checkField, whereField, whereValue, callback) => {
    const checkValue = moment().format('YYYY-MM-DD');

    checkDatabaseDate(table, checkField, whereField, whereValue, 'YYYY-MM-DD')
      .then((result) => {
        expect(result).to.equal((checkValue === '' || checkValue === 'NULL') ? null : checkValue);
        callback();
      })
      .catch((err) => {
        callback(err);
      });
  });

  this.Given(/^I generate responses$/, (callback) => {
    const responsePromiseArr = [];

    responseData.forEach((jurorData) => {
      responsePromiseArr.push(loadSql('jurorTemplate', null, jurorData));
    });

    // Insert all generated data and wait for all to succeed or a failure to happen
    Promise.all(responsePromiseArr)
      .then((responses) => {
        let iResponse = 0;
        responseData.forEach(() => {
          expect(responses[iResponse]).to.equal('success');
          iResponse += 1;
        });

        callback();
      })
      .catch((err) => {
        callback(err);
      });
  });

  this.Given(/^I generate unassigned responses$/, (callback) => {
    const responsePromiseArr = [];

    responseData.forEach((jurorData) => {
      responsePromiseArr.push(loadSql('jurorTemplate', _.merge(jurorData, { assignee: '' })));
    });

    // Insert all generated data and wait for all to succeed or a failure to happen
    Promise.all(responsePromiseArr)
      .then((responses) => {
        let iResponse = 0;
        responseData.forEach(() => {
          expect(responses[iResponse]).to.equal('success');
          iResponse += 1;
        });

        callback();
      })
      .catch((err) => {
        callback(err);
      });
  });

  this.Given(/^I add a generated unassigned response with the juror number "([^"]*)" and the status "([^"]*)"$/, (jurorNumber, status, callback) => {
    const jurorData = generateData({
      jurorNumber,
      processingStatus: status,
      assignee: '',
    });

    if (status === 'CLOSED') {
      jurorData.completedAt = moment().format('YYYY-MM-DD');
    }

    loadSql('jurorTemplate', callback, jurorData)
      .then((result) => {
        expect(result).to.equal('success');
        callback();
      })
      .catch((err) => {
        callback(err);
      });
  });

  this.Given(/^I generate "([^"]*)" responses assigned to "([^"]*)"$/, (number, assignee, callback) => {
    let iCount = 0;
    let sql = '';
    const desiredNumber = parseInt(number, 10);

    for (iCount; iCount < desiredNumber; iCount += 1) {
      const jurorData = generateData({
        jurorNumber: `${padTo(iCount, 4)}98765`,
        dateReceived: moment().subtract(iCount, 'days').format('YYYY-MM-DD'),
        assignee,
        completedAt: null,
      });
      let tmpSql = fs.readFileSync(path.resolve(__dirname, '../', 'sql', 'jurorTemplate.sql')).toString();

      if (typeof jurorData !== 'undefined') {
        Object.keys(jurorData).forEach((key) => {
          tmpSql = tmpSql.split(`[${key}]`).join(jurorData[key]);
        });
      }

      sql += '\n';
      sql += tmpSql;
    }

    executeSql(sql)
      .then((result) => {
        expect(result).to.equal('success');
        callback();
      })
      .catch((err) => {
        callback(err);
      });
  });

  this.Given(/^I add a generated response with the juror number "([^"]*)" and the status "([^"]*)" for assignee "([^"]*)"$/, (jurorNumber, status, assignee, callback) => {
    const jurorData = generateData({
      jurorNumber,
      processingStatus: status,
      assignee,
    });

    if (status === 'CLOSED') {
      jurorData.completedAt = moment().format('YYYY-MM-DD');
    }

    loadSql('jurorTemplate', callback, jurorData)
      .then((result) => {
        expect(result).to.equal('success');
        callback();
      })
      .catch((err) => {
        callback(err);
      });
  });

  this.Given(/^I add a generated response with the juror number "([^"]*)" and the status "([^"]*)"$/, (jurorNumber, status, callback) => {
    const jurorData = generateData({
      jurorNumber,
      processingStatus: status,
    });

    if (status === 'CLOSED') {
      jurorData.completedAt = moment().format('YYYY-MM-DD');
    }

    loadSql('jurorTemplate', callback, jurorData)
      .then((result) => {
        expect(result).to.equal('success');
        callback();
      })
      .catch((err) => {
        callback(err);
      });
  });

  this.Given(/^I add a generated response with the juror number "([^"]*)", the status "([^"]*)" and the POOL status "([^"]*)"$/, (jurorNumber, processingStatus, poolStatus, callback) => {
    const jurorData = generateData({
      jurorNumber,
      processingStatus,
      poolStatus,
    });

    if (processingStatus === 'CLOSED') {
      jurorData.completedAt = moment().format('YYYY-MM-DD');
    }

    loadSql('jurorTemplate', callback, jurorData)
      .then((result) => {
        expect(result).to.equal('success');
        callback();
      })
      .catch((err) => {
        callback(err);
      });
  });

  this.Given(/^I add a Super Urgent response with the status "([^"]*)" and assignee "([^"]*)"$/, (status, assignee, callback) => {
    const urgencyDates = calculateSuperUrgency();

    const jurorData = generateData({
      jurorNumber: 123123123,
      title: 'Mr',
      firstName: 'Super',
      lastName: 'Urgent',
      email: 'mr.super@urgent.com',
      dob: '1984-07-24',
      addressLineOne: '4 Knutson Trail',
      addressLineTwo: 'Scotland',
      addressLineThree: 'Aberdeen',
      addressLineFour: 'United Kingdom',
      addressPostcode: 'AB21 3RY',

      hPhone: '44(703)209-6993',
      wPhone: '44(109)549-5625',
      mPhone: '44(145)525-2390',
      locCode: '446',

      dateReceived: urgencyDates.receivedAt.format('YYYY-MM-DD'),
      dateSummoned: urgencyDates.courtDate.format('YYYY-MM-DD'),
      superUrgent: 'Y',
      urgent: 'N',
      processingStatus: status,
      assignee,
    });

    if (status === 'CLOSED') {
      jurorData.completedAt = moment().format('YYYY-MM-DD');
    }

    loadSql('jurorTemplate', callback, jurorData)
      .then((result) => {
        expect(result).to.equal('success');
        callback();
      })
      .catch((err) => {
        callback(err);
      });
  });

  this.Given(/^I add an Urgent response with the status "([^"]*)" and assignee "([^"]*)"$/, (status, assignee, callback) => {
    const urgencyDates = calculateUrgency();

    const jurorData = generateData({
      jurorNumber: 321321321,
      title: 'Mr',
      firstName: 'Urgent',
      lastName: 'Only',
      email: 'mr.urgent@only.com',
      dob: '1984-07-24',
      addressLineOne: '4 Knutson Trail',
      addressLineTwo: 'Scotland',
      addressLineThree: 'Aberdeen',
      addressLineFour: 'United Kingdom',
      addressPostcode: 'AB21 3RY',

      hPhone: '44(703)209-6993',
      wPhone: '44(109)549-5625',
      mPhone: '44(145)525-2390',
      locCode: '446',

      dateReceived: urgencyDates.receivedAt.format('YYYY-MM-DD'),
      dateSummoned: urgencyDates.courtDate.format('YYYY-MM-DD'),
      superUrgent: 'N',
      urgent: 'Y',
      processingStatus: status,
      assignee,
    });

    if (status === 'CLOSED') {
      jurorData.completedAt = moment().format('YYYY-MM-DD');
    }

    loadSql('jurorTemplate', callback, jurorData)
      .then((result) => {
        expect(result).to.equal('success');
        callback();
      })
      .catch((err) => {
        callback(err);
      });
  });

  this.Given(/^I add a SLA Overdue response with the status "([^"]*)" and assignee "([^"]*)"$/, (status, assignee, callback) => {
    const jurorData = generateData({
      jurorNumber: 654987321,
      title: 'Mr',
      firstName: 'Sla',
      lastName: 'Overdue',
      email: 'mr.sla@overdue.com',
      dob: '1984-07-24',
      addressLineOne: '4 Knutson Trail',
      addressLineTwo: 'Scotland',
      addressLineThree: 'Aberdeen',
      addressLineFour: 'United Kingdom',
      addressPostcode: 'AB21 3RY',

      hPhone: '44(703)209-6993',
      wPhone: '44(109)549-5625',
      mPhone: '44(145)525-2390',
      locCode: '446',

      dateReceived: moment().subtract(30, 'days').format('YYYY-MM-DD'),
      dateSummoned: moment().add(60, 'days').format('YYYY-MM-DD'),
      processingStatus: status,
      assignee,
    });

    if (status === 'CLOSED') {
      jurorData.completedAt = moment().format('YYYY-MM-DD');
    }

    loadSql('jurorTemplate', callback, jurorData)
      .then((result) => {
        expect(result).to.equal('success');
        callback();
      })
      .catch((err) => {
        callback(err);
      });
  });
};
