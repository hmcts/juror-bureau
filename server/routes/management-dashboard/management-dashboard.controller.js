const { link } = require("fs-extra");

(() => {
  'use strict';

  const _ = require("lodash");
  const { toSentenceCase, makeDate, dateFilter, capitalizeFully } = require("../../components/filters");
  const { managementDashboardDAO } = require("../../objects/management-dashboard");

  module.exports.getManagementDashboard = (app) => async (req, res) => {
    let tables = [];
    try {
      for (const [key, value] of Object.entries(tableDefinitions(app)(req, res))) {
        let tableData = {};
        if (value.apiKey) {
          try {
            tableData = await managementDashboardDAO.get(req, value.apiKey);
          } catch (err) {
            app.logger.crit(`Unable to fetch management dashboard data for ${value.apiKey}`, {
              auth: req.session.authentication,
              error: typeof err.error !== 'undefined' ? err.error : err.toString(),
            });
            return res.render('_errors/generic', { err });
          }
        }
        console.log(`Building table for ${key} with definition:`, value, 'and data:', tableData);
        const table = buildTable(app)(value, tableData);
        tables.push(table);
      }
    } catch (err) {
      app.logger.crit('Unable to build management dashboard data', {
        auth: req.session.authentication,
        error: typeof err.error !== 'undefined' ? err.error : err.toString(),
      });
      return res.render('_errors/generic', { err });
    }
    return res.render('management-dashboard/management-dashboard', {
      headingName: 'Management dashboard',
      tables,
    });
  }

  const buildTable = (app) => (tableDefinition, data) => {
    const table = {
      head: [],
      rows: [],
      caption: tableDefinition.caption,
      staticLink: tableDefinition.staticLink || null,
    };

    if (!data.records || data.records.length === 0) {
      return table;
    } else {
      table.reportLink = data.records.length >= 10 ? tableDefinition.reportLink : null,
      tableDefinition.headers.forEach((header) => {
        table.head.push({ text: header.text });
      });
    }

    data.records.forEach((record) => {
      let item = [];
      tableDefinition.headers.forEach((header) => {
        const rawData = record[header.id];
        const formattedData = header.dataFormating ? header.dataFormating(rawData) : rawData;
        if (header.link) {
          const linkUrl = header.link(app)(record);
          item.push({ html: `<a href="${linkUrl}">${formattedData}</a>` });
        } else {
          item.push({ text: formattedData });
        }
      });
      table.rows.push(item);
    });

    return table;
  }

  const tableDefinitions = (app) => (req, res) => {
    return {
      overdueUtilisation: {
        caption: 'Overdue utilisation reports',
        headers: [
          { text: 'Court', id: 'court', dataFormating: (data) => capitalizeFully(data) },
          { text: 'Report last run', id: 'reportLastRun', dataFormating: (data) => dateFilter(makeDate(data), null, 'DD/MM/YYYY') },
          { text: 'Days elapsed', id: 'daysElapsed' },
          { text: 'Utilisation from previoud report', id: 'utilisation', dataFormating: (data) => `${data.toFixed(2)}%` },
        ],
        reportLink: app.namedRoutes.build('reports.overdue-utilisation-report.report.get', { filter: 'all' }),
        apiKey: 'overdue-utilisation',
      },
      incompleteService: {
        caption: 'Courts with incomplete service',
        headers: [
          { id: 'court', text: 'Court', dataFormating: (data) => capitalizeFully(data) },
          { id: 'numberOfIncompleteServices', text: 'Incomplete jurors', dataFormating: (data) => data.toString() },
        ],
        reportLink: app.namedRoutes.build('reports.courts-incomplete-service.report.get', { filter: dateFilter(new Date(), null, 'yyyy-MM-DD') }),
        apiKey: 'incomplete-service',
      },
      weekendAttendance: {
        caption: 'Courts recording weekend attendance this month',
        headers: [
          { 
            id: 'courtLocationNameAndCode',
            text: 'Court',
            dataFormating: (data) => capitalizeFully(data),
            link: (app) => (data) => {
              const locCode = data['courtLocationNameAndCode'].split('(')[1].split(')')[0];
              return app.namedRoutes.build('reports.weekend-attendance-audit.report.get', { filter: locCode });
            },
          },
          { id: 'saturdayTotal', text: 'Saturday', dataFormating: (data) => data && data > 0 ? data.toString() : '-' },
          { id: 'sundayTotal', text: 'Sunday', dataFormating: (data) => data && data > 0 ? data.toString() : '-' },
          { id: 'holidayTotal', text: 'Bank Holiday', dataFormating: (data) => data && data > 0 ? data.toString() : '-' },
          { id: 'totalPaid', text: 'Total paid', dataFormating: (data) => `£${data.toFixed(2)}` },
        ],
        reportLink: app.namedRoutes.build('reports.weekend-attendance.report.get', { filter: 'all' }),
        apiKey: 'weekend-attendance',
      },
      expensePayments: {
        caption: 'Expense payments',
        staticLink: {
          text: 'Court expense payments report',
          link: app.namedRoutes.build('reports.expense-payments.filter.dates.get'),
        },
      },
      expenseLimits: {
        caption: 'Manual adjustments to expense limits',
        headers: [
          { 
            id: 'courtLocationNameAndCode',
            text: 'Court',
            dataFormating: (data) => capitalizeFully(data),
            link: (app) => (data) => {
              const locCode = data['courtLocationNameAndCode'].split('(')[1].split(')')[0];
              return app.namedRoutes.build('reports.expense-limit-adjustments-audit.redirect.get', {
                locCode,
                transportType: data['type'],
              });
            },
          },
          { id: 'type', text: 'Type', dataFormating: (data) => toSentenceCase(data) },
          { id: 'oldLimit', text: 'Old limit', dataFormating: (data) => `£${data.toFixed(2)}` },
          { id: 'newLimit', text: 'New limit', dataFormating: (data) => `£${data.toFixed(2)}` },
          { id: 'changedBy', text: 'Changed by', dataFormating: (data) => capitalizeFully(data) },
        ],
        reportLink: app.namedRoutes.build('reports.expense-limit-adjustments.report.get', { filter: 'all' }),
        apiKey: 'expense-limits',
      },
      outgoingSmsMessages: {
        caption: 'Outgoing SMS messages',
        headers: [
          { id: 'court', text: 'Court', dataFormating: (data) => capitalizeFully(data) },
          { id: 'smsSent', text: 'SMS sent' },
        ],
        reportLink: app.namedRoutes.build('reports.outgoing-sms-messages.filter.dates.get'),
        // apiKey: 'outgoing-sms-messages',
      }
    };
  }

})();
