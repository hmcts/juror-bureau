const moment = require('moment');
const faker = require('faker');
const _ = require('lodash');

let iCount = 0;
const todoCount = 6;
const pendingCount = 3;
const completedCount = 2;

const data = [];

function baseData(jurorNumberPrefix, jurorNumberPostfix, receivedDays) {
  const daysSinceReceived = (typeof receivedDays === 'undefined') ? jurorNumberPostfix : receivedDays;
  faker.locale = 'en_GB';

  return {
    jurorNumber: `${jurorNumberPrefix}8765432${jurorNumberPostfix}`,
    title: faker.name.prefix().replace(/'/g, ''),
    firstName: faker.name.firstName().replace(/'/g, ''),
    lastName: faker.name.lastName().replace(/'/g, ''),
    email: faker.internet.email(),
    dob: moment(faker.date.between('1968-01-01', '1990-12-31')).format('YYYY-MM-DD'),
    addressLineOne: faker.address.streetAddress().replace(/'/g, ''),
    addressLineTwo: faker.address.city().replace(/'/g, ''),
    addressLineThree: faker.address.county().replace(/'/g, ''),
    addressLineFour: 'United Kingdom',
    addressPostcode: 'AB21 3RY',

    hPhone: `0${faker.random.number({ min: 1000000000, max: 1999999999 })}`,
    wPhone: `0${faker.random.number({ min: 1000000000, max: 1999999999 })}`,
    mPhone: `0${faker.random.number({ min: 7000000000, max: 7999999999 })}`,
    locCode: '446',

    dateReceived: moment().subtract(daysSinceReceived, 'days').format('YYYY-MM-DD'),
    dateSummoned: moment().add(faker.random.number({ min: 60, max: 70 }), 'days').format('YYYY-MM-DD'),
    poolStatus: 1,
    assignee: 'samanthak',
    urgent: 'N',
    superUrgent: 'N',
    processingStatus: 'TODO',
  };
}


for (iCount = 0; iCount < todoCount; iCount += 1) {
  data.push(_.merge(baseData(1, iCount), {
    processingStatus: 'TODO',
  }));
}


for (iCount = 0; iCount < pendingCount; iCount += 1) {
  data.push(_.merge(baseData(2, iCount), {
    processingStatus: 'AWAITING_CONTACT',
  }));
}


for (iCount = 0; iCount < completedCount; iCount += 1) {
  data.push(_.merge(baseData(3, iCount), {
    processingStatus: 'CLOSED',
    completedAt: moment().format('YYYY-MM-DD'),
  }));
}

module.exports.data = data;
module.exports.baseData = baseData;
