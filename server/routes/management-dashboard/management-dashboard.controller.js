(() => {
  'use strict';

  const _ = require('lodash');
  const { toSentenceCase, makeDate, dateFilter, capitalizeFully } = require("../../components/filters");
  const { managementDashboardDAO } = require("../../objects/management-dashboard");

  module.exports.getManagementDashboard = (app) => async (req, res) => {
    let sections = [];
    try {
      for (const [key, definition] of Object.entries(tableDefinitions(app)(req, res))) {
        let rawData = {};
        if (definition.apiKey) {
          try {
            rawData = await managementDashboardDAO.get(req, definition.apiKey);
          } catch (err) {
            app.logger.crit(`Unable to fetch management dashboard data for ${definition.apiKey}`, {
              auth: req?.session?.authentication,
              error: err?.error ?? err?.toString(),
            });
          }
        }
        const section = buildSection(app)(definition, rawData);
        if (definition.chart) {
          section.chart = {
            template: definition.chart.template,
            data: definition.chart.chartData(rawData),
          };
        }
        sections.push(section);
      }
      return res.render('management-dashboard/management-dashboard', {
        headingName: 'Management dashboard',
        sections,
      });
    } catch (err) {
      app.logger.crit('Unable to build management dashboard data', {
        auth: req?.session?.authentication,
        error: err?.error ?? err?.toString(),
      });
    }
  };

  const buildSection = (app) => (tableDefinition, data) => {
    const section = {
      table: {
        head: [],
        rows: [],
      },
      heading: tableDefinition.heading,
      subHeading: tableDefinition.subHeading || null,
      staticLink: tableDefinition.staticLink || null,
      exportReportLink: tableDefinition.exportReportLink || null,
    };
    if (!data.records || data.records.length === 0) {
      return section;
    } else {
      section.reportLink = data.records.length >= 10 ? tableDefinition.reportLink : null;
      tableDefinition.headers?.forEach((header) => {
        section.table.head.push({ text: header.text });
      });
    }
    data.records.forEach((record) => {
      let item = [];
      tableDefinition.headers.forEach((header) => {
        const rawData = record[header.id];
        const formattedData = header.dataFormatting ? header.dataFormatting(rawData) : rawData;
        if (header.link) {
          const linkUrl = header.link(app)(record);
          item.push({ html: `<a href="${linkUrl}">${formattedData}</a>` });
        } else {
          item.push({ text: formattedData });
        }
      });
      section.table.rows.push(item);
    });
    return section;
  };

  const tableDefinitions = (app) => (req, res) => {
    const getLocCode = (data, id = 'courtLocationNameAndCode') => {
      return data[id]?.split('(')[1]?.split(')')[0];
    };
    const getYear = () => getLastAprilFirst().getFullYear();
    return {
      overdueUtilisation: {
        heading: 'Overdue utilisation reports',
        headers: [
          { 
            text: 'Court',
            id: 'court',
            dataFormatting: capitalizeFully,
            link: app => data => app.namedRoutes.build('authentication.select-court.get', {
              locCode: getLocCode(data, 'court'),
            }),
          },
          { text: 'Report last run', id: 'reportLastRun', dataFormatting: d => dateFilter(makeDate(d), null, 'DD/MM/YYYY') },
          { text: 'Days elapsed', id: 'daysElapsed' },
          { text: 'Utilisation from previous report', id: 'utilisation', dataFormatting: d => `${d.toFixed(2)}%` },
        ],
        reportLink: app.namedRoutes.build('reports.overdue-utilisation-report.report.get', { filter: 'all' }),
        apiKey: 'overdue-utilisation',
      },
      incompleteService: {
        heading: 'Courts with incomplete service',
        headers: [
          { 
            id: 'court',
            text: 'Court',
            dataFormatting: capitalizeFully,
            link: app => data => app.namedRoutes.build('reports.incomplete-service.report.get', {
              filter: dateFilter(new Date(), null, 'yyyy-MM-DD')
            }) + `?courtLocCode=${getLocCode(data, 'court')}`,
          },
          { id: 'numberOfIncompleteServices', text: 'Incomplete jurors', dataFormatting: d => d.toString() },
        ],
        reportLink: app.namedRoutes.build('reports.courts-incomplete-service.report.get', { filter: dateFilter(new Date(), null, 'yyyy-MM-DD') }),
        apiKey: 'incomplete-service',
      },
      weekendAttendance: {
        heading: 'Courts recording weekend attendance this month',
        headers: [
          {
            id: 'courtLocationNameAndCode',
            text: 'Court',
            dataFormatting: capitalizeFully,
            link: app => data => app.namedRoutes.build('reports.weekend-attendance-audit.report.get', { filter: getLocCode(data) }),
          },
          { id: 'saturdayTotal', text: 'Saturday', dataFormatting: d => d && d > 0 ? d.toString() : '-' },
          { id: 'sundayTotal', text: 'Sunday', dataFormatting: d => d && d > 0 ? d.toString() : '-' },
          { id: 'holidayTotal', text: 'Bank Holiday', dataFormatting: d => d && d > 0 ? d.toString() : '-' },
          { id: 'totalPaid', text: 'Total paid', dataFormatting: d => `£${d.toFixed(2)}` },
        ],
        reportLink: app.namedRoutes.build('reports.weekend-attendance.report.get', { filter: 'all' }),
        apiKey: 'weekend-attendance',
      },
      expensePayments: {
        heading: 'Expense payments',
        staticLink: {
          text: 'Court expense payments report',
          link: app.namedRoutes.build('reports.expense-payments.filter.dates.get'),
        },
      },
      expenseLimits: {
        heading: 'Manual adjustments to expense limits',
        headers: [
          {
            id: 'courtLocationNameAndCode',
            text: 'Court',
            dataFormatting: capitalizeFully,
            link: app => data => app.namedRoutes.build('reports.expense-limit-adjustments-audit.report.get', {
                filter: getLocCode(data)
              }) + `?transportType=${_.camelCase(data.type)}`
              + `&revisionNumber=${data.revisionNumber}`,
          },
          { id: 'type', text: 'Type', dataFormatting: toSentenceCase },
          { id: 'oldLimit', text: 'Old limit', dataFormatting: d => `£${d.toFixed(2)}` },
          { id: 'newLimit', text: 'New limit', dataFormatting: d => `£${d.toFixed(2)}` },
          { id: 'changedBy', text: 'Changed by', dataFormatting: capitalizeFully },
        ],
        reportLink: app.namedRoutes.build('reports.expense-limit-adjustments.report.get', { filter: 'all' }),
        apiKey: 'expense-limits',
      },
      outgoingSmsMessages: {
        heading: 'Outgoing SMS messages',
        subHeading: `Sent since 1st April ${getYear()}.`,
        headers: [
          {
            id: 'courtLocationNameAndCode',
            text: 'Court',
            dataFormatting: capitalizeFully,
            link: app => data => app.namedRoutes.build('authentication.select-court.get', {
              locCode: getLocCode(data),
            }),
          },
          { id: 'messagesSent', text: 'SMS sent' },
        ],
        reportLink: app.namedRoutes.build('reports.outgoing-sms-messages.filter.dates.get'),
        apiKey: 'sms-messages',
        chart: {
          template: 'sms-doughnut',
          chartData: data => ({
            used: data.totalMessagesSent || 0,
            remaining: 40000 - (data.totalMessagesSent || 0),
          }),
        },
        exportReportLink:
          app.namedRoutes.build('management-dashboard.outgoing-sms-messages.report.export') +
          `?fromDate=${dateFilter(getLastAprilFirst(), null, 'yyyy-MM-DD')}` +
          `&toDate=${dateFilter(new Date(), null, 'yyyy-MM-DD')}`,
      },
    };
  };

  const getLastAprilFirst = () => {
    const today = new Date();
    const year = today.getMonth() < 3 || (today.getMonth() === 3 && today.getDate() < 1)
      ? today.getFullYear() - 1
      : today.getFullYear();
    return new Date(year, 3, 1);
  }

})();
