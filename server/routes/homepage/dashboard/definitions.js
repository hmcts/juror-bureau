(() => {
  'use strict';

  const _ = require('lodash');
  const { dateFilter } = require('../../../components/filters');
  const { dateDifference } = require('../../../lib/mod-utils');

  const widgetTemplates = {
    attendanceDoughnut: 'homepage/court-dashboard/widgets/attendance/attendance-doughnut.njk',
    standardValue: 'homepage/court-dashboard/widgets/standard-value.njk',
    largeValues: 'homepage/court-dashboard/widgets/large-values.njk',
  }

  module.exports.widgetDefinitions = (app) => (req, res) => async (list, stats) => {

    /**
     * This file defines the structure and types for the widget definitions used in the dashboard.
     *
     * The `widgetDefinitions` object organises widgets into sections, where:
     * - The top-level keys represent sections of the dashboard (e.g., "attendance", "admin").
     * - Each section contains a `title` and a `widgets` object.
     * - The `widgets` object contains individual widgets, keyed by their unique widget IDs.
     *
     * Example:
     * {
     *   attendance: {
     *     title: "Attendance",
     *     widgets: {
     *       "today-stats": { ...widget definition... },
     *       "last-7-days-stats": { ...widget definition... }
     *     }
     *   },
     *   admin: {
     *     title: "Admin",
     *     widgets: {
     *       "unpaid-attendance": { ...widget definition... },
     *       "monthly-utilisation-report": { ...widget definition... }
     *     }
     *   }
     * }
     *
     * Type Definitions:
     *
     * @typedef {Object} Widget
     * Represents a single widget in the dashboard.
     *
     * @property {boolean} mandatory - Indicates whether the widget is always shown.
     * @property {string} template - Path to the widget's template file.
     * @property {number} column - The column width of the widget (e.g., 1 or 2).
     * @property {Object} [templateOptions] - Additional options for rendering the widget's template.
     * @property {Object} [data] - Data object for widgets that use direct data.
     * @property {Array<Value>} [values] - A list of value objects associated with the widget.
     * @property {boolean} [lineBreak] - Whether to start a new line before this widget.
     *
     * @typedef {Object} Value
     * Represents a single value displayed within a widget.
     *
     * @property {string} [heading] - The heading or label for the value.
     * @property {*} value - The value to display.
     * @property {string} [suffix] - A suffix to append to the value (e.g., "days").
     * @property {string} [classes] - CSS classes for styling the value.
     * @property {Array<Link>} [links] - A list of links associated with the value.
     * @property {Badge} [badge] - Configuration for a badge displayed alongside the value.
     *
     * @typedef {Object} Link
     * Represents a hyperlink associated with a value.
     *
     * @property {string} href - The URL or route for the link.
     * @property {string} text - The display text for the link.
     *
     * @typedef {Object} Badge
     * Represents a badge displayed alongside a value.
     *
     * @property {Function} [requirments] - A function that returns a boolean determining whether the badge should be displayed.
     * @property {string} text - The text displayed on the badge (e.g., "overdue").
     * @property {string} colour - The colour of the badge (e.g., "red").
     *
     * @typedef {Object} WidgetSection
     * Represents a section of widgets in the dashboard.
     *
     * @property {string} title - The title of the section (e.g., "Attendance").
     * @property {Object<string, Widget>} widgets - A collection of widgets in the section, keyed by widget ID.
     *
     * @type {Object<string, WidgetSection>}
     * Defines the structure of the widget definitions for the dashboard.
    */

    const widgetDefinitions = {
      'attendance': {
        title: 'Attendance',
        widgets: {
          'today-stats': {
            mandatory: true,
            widgetType: 'attendanceDoughnut',
            column: 1,
            templateOptions: {
              title: 'Today',
              doughnutId: 'todayStats'
            },
            data: stats.attendance.attendanceStatsToday || {},
          },
          'last-7-days-stats': {
            mandatory: true,
            widgetType: 'attendanceDoughnut',
            column: 1,
            templateOptions: {
              title: 'Last 7 days',
              doughnutId: 'last7DaysStats'
            },
            data: stats.attendance.attendanceStatsLastSevenDays || {},
          },
          'next-7-days-stats': {
            mandatory: true,
            widgetType: 'standardValue',
            lineBreak: true,
            column: 2,
            templateOptions: {
              title: 'Next 7 days',
            },
            values: [
              {
                heading: 'Total due to attend',
                value: stats.attendance.totalDueToAttend,
                links: [
                  {
                    href: app.namedRoutes.build('reports.persons-attending-detail.filter.get'),
                    text: 'Persons attending - Summary',
                  },
                ]
              },
              {
                heading: 'Jurors with reasonable adjustments',
                value: stats.attendance.reasonableAdjustments,
                links: [
                  {
                    href:  app.namedRoutes.build('reports.reasonable-adjustments.filter.get'),
                    text: 'Reasonable adjustments report',
                  },
                ]
              }
            ]
          },
          'unconfirmed-attendance': {
            mandatory: true,
            widgetType: 'standardValue',
            column: 2,
            values: [
              {
                heading: 'Unconfirmed attendances',
                value: stats.attendance.unconfirmedAttendances,
                links: [
                  {
                    href: app.namedRoutes.build('reports.unconfirmed-attendance.filter.get'),
                    text: 'Unconfirmed attendance report',
                  },
                  {
                    href: app.namedRoutes.build('juror-management.attendance.get'),
                    text: 'Record attendance',
                  }
                ]
              },
            ]
          },
        }
      },
      'admin': {
        title: 'Admin',
        widgets: {
          'unpaid-attendance': {
            mandatory: true,
            widgetType: 'largeValues',
            lineBreak: true,
            column: 1,
            values: [
              {
               value: stats.admin.unpaidAttendances,
               classes: stats.admin.unpaidAttendances > 50 ? 'mod-red-text' : '',
               links: [
                  {
                    href: app.namedRoutes.build('juror-management.unpaid-attendance.get'),
                    text: 'Unpaid attendances',
                  }
                ],
              },
              {
                value: stats.admin.oldestUnpaidAttendanceDays,
                suffix: stats.admin.oldestUnpaidAttendanceDays === 1 ? 'day' : 'days',
                classes: stats.admin.oldestUnpaidAttendanceDays > 30 ? 'mod-red-text' : '',
                links: [
                   {
                     href: app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.get', {
                        jurorNumber: stats.admin.oldestUnpaidJuror,
                        locCode: req.session.authentication.locCode,
                        status: 'draft',
                     }),
                     text: 'Oldest unpaid attendance',
                   }
                 ],
               },
            ],
          },
          'monthly-utilisation-report': {
            mandatory: true,
            widgetType: 'standardValue',
            column: 1,
            values: [
              {
                heading: 'Date monthly utilisation report last run',
                value: stats.admin.utilisationReportDate ? dateFilter(stats.admin.utilisationReportDate, null, 'DD MMMM YYYY [at] h:mm a') : null,
                badge: {
                  showBadge: stats.admin.utilisationReportDate ? Math.abs(dateDifference(new Date(), stats.admin.utilisationReportDate, 'days')) > 30 : false,
                  text: 'overdue',
                  colour: 'red',
                },
                links: [
                  {
                    href: app.namedRoutes.build('reports.prepare-monthly-utilisation.filter.get'),
                    text: 'Prepare monthly utilisation report',
                  }
                ]
              },
              {
                heading: 'Last run monthly utilisation percentage',
                value: stats.admin.utilisationReportDate ? (Math.round(stats.admin.utilisationPercentage * 100) / 100) + '%' : null,
              },
            ]
          },
        },
      }
    };

    const result = {};
    let currentRow = 0;
    let currentRowWidth = 0;

    for (const section in widgetDefinitions) {
      const sectionData = widgetDefinitions[section];
      const widgets = {};

      for (const [key, widgetDef] of Object.entries(sectionData.widgets)) {
        if (!widgetDef.mandatory && !list.includes(key)) {
          continue;
        }
        // Set the template based on widgetType and widgetTemplates
        let template = widgetDef.template;
        if (!template && widgetDef.widgetType && widgetTemplates[widgetDef.widgetType]) {
          template = widgetTemplates[widgetDef.widgetType];
        } else {
          throw {
            error: {
              code: 'WIDGET_TEMPLATE_NOT_FOUND',
              message: `No template defined for '${key}' widget in section '${section}'.`,
            }
          };
        }
        widgets[key] = { ...widgetDef, template };
      }

      const sectionColumns = Object.values(widgets).reduce((max, widget) => Math.max(max, widget.column || 1), 1);

      if (currentRowWidth + sectionColumns > 3) {
        currentRow++;
        currentRowWidth = 0;
      }

      result[section] = {
        ...sectionData,
        columns: sectionColumns,
        row: currentRow,
        widgets,
      };

      currentRowWidth += sectionColumns;
    }

    return result;
  };

})();