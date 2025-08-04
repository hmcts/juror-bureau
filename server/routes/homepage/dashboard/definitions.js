(() => {
  'use strict';

  const _ = require('lodash');
  const { dateFilter } = require('../../../components/filters');
  const { dateDifference } = require('../../../lib/mod-utils');

  module.exports.widgetTemplates = {
    attendanceDoughnut: 'homepage/court-dashboard/widgets/attendance/attendance-doughnut.njk',
    standardValue: 'homepage/court-dashboard/widgets/standard-value.njk',
    largeValues: 'homepage/court-dashboard/widgets/large-values.njk',
    summonsDoughnut: 'homepage/bureau-dashboard/widgets/summons-management/summons-doughnut.njk',
    placeholder: 'homepage/bureau-dashboard/widgets/placeholder.njk',
    poolsUnderResponded: 'homepage/bureau-dashboard/widgets/pools-under-responded.njk',
  }

  /**
   * Returns the widget definitions for the court dashboard, organised by section.
   *
   * The returned object organises widgets into sections, where:
   * - The top-level keys represent sections of the dashboard (e.g., "attendance", "admin").
   * - Each section contains a `title` and a `widgets` object.
   * - The `widgets` object contains individual widgets, keyed by their unique widget IDs.
   *
   * The `requiredWidgets` parameter is an object, where each key is a section name and the value is an array of widget IDs required for that section.
   * Only widgets marked as `mandatory: true` or included in the relevant section's array in `requiredWidgets` will be included in the output.
   *
   * @example
   * courtWidgetDefinitions({
   *   attendance: ["today-stats", "last-7-days-stats"],
   *   admin: ["unpaid-attendance"]
   * });
   *
   * @param {Object<string, string[]>} requiredWidgets - An object mapping section names to arrays of required widget IDs.
   * @returns {Object<string, WidgetSection>} The widget definitions for the court dashboard.
   *
   * @typedef {Object} Widget
   * @property {boolean} mandatory - Indicates whether the widget is always shown.
   * @property {string} template - Path to the widget's template file.
   * @property {number} column - The column width of the widget (e.g., 1 or 2).
   * @property {Object} [templateOptions] - Additional options for rendering the widget's template.
   * @property {Object} [data] - Data object for widgets that use direct data.
   * @property {Array<Value>} [values] - A list of value objects associated with the widget.
   * @property {boolean} [lineBreak] - Whether to start a new line before this widget.
   *
   * @typedef {Object} Value
   * @property {string} [heading] - The heading or label for the value.
   * @property {*} value - The value to display.
   * @property {string} [suffix] - A suffix to append to the value (e.g., "days").
   * @property {string} [classes] - CSS classes for styling the value.
   * @property {Array<Link>} [links] - A list of links associated with the value.
   * @property {Badge} [badge] - Configuration for a badge displayed alongside the value.
   *
   * @typedef {Object} Link
   * @property {string} href - The URL or route for the link.
   * @property {string} text - The display text for the link.
   *
   * @typedef {Object} Badge
   * @property {Function} [requirements] - A function that returns a boolean determining whether the badge should be displayed.
   * @property {string} text - The text displayed on the badge (e.g., "overdue").
   * @property {string} colour - The colour of the badge (e.g., "red").
   *
   * @typedef {Object} WidgetSection
   * @property {string} title - The title of the section (e.g., "Attendance").
   * @property {Object<string, Widget>} widgets - A collection of widgets in the section, keyed by widget ID.
  */
  module.exports.courtWidgetDefinitions = (app) => (req, res) => (stats) => {
    return {
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
            data: stats?.attendance.attendanceStatsToday || {},
          },  
          'last-7-days-stats': {
            mandatory: true,
            widgetType: 'attendanceDoughnut',
            column: 1,
            templateOptions: {
              title: 'Last 7 days',
              doughnutId: 'last7DaysStats'
            },
            data: stats?.attendance.attendanceStatsLastSevenDays || {},
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
                value: stats?.attendance.totalDueToAttend,
                links: [
                  {
                    href: app.namedRoutes.build('reports.persons-attending-detail.filter.get'),
                    text: 'Persons attending - Summary',
                  },
                ]
              },
              {
                heading: 'Jurors with reasonable adjustments',
                value: stats?.attendance.reasonableAdjustments,
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
                value: stats?.attendance.unconfirmedAttendances,
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
                value: stats?.admin.unpaidAttendances,
                classes: stats?.admin.unpaidAttendances > 50 ? 'mod-red-text' : '',
                ariaLabel: 'Unpaid attendances',
                links: [
                  {
                    href: app.namedRoutes.build('juror-management.unpaid-attendance.get'),
                    text: 'Unpaid attendances',
                  }
                ],
              },
              {
                value: stats?.admin.oldestUnpaidAttendanceDays,
                suffix: stats?.admin.oldestUnpaidAttendanceDays === 1 ? 'day' : 'days',
                classes: stats?.admin.oldestUnpaidAttendanceDays > 30 ? 'mod-red-text' : '',
                ariaLabel: 'Oldest unpaid attendance',
                links: [
                    {
                      href: stats?.admin.oldestUnpaidJuror ? app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.get', {
                        jurorNumber: stats?.admin.oldestUnpaidJuror,
                        locCode: req.session.authentication.locCode,
                        status: 'draft',
                      }) : '',
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
                value: stats?.admin.utilisationReportDate ? dateFilter(stats?.admin.utilisationReportDate, null, 'DD MMMM YYYY [at] h:mm a') : null,
                badge: {
                  showBadge: stats?.admin.utilisationReportDate 
                    ? Math.abs(dateDifference(new Date(), new Date(dateFilter(stats?.admin.utilisationReportDate, null, 'YYYY-MM-DD')), 'days')) > 30 
                    : false,
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
                value: stats?.admin.utilisationReportDate ? (Math.round(stats?.admin.utilisationPercentage * 100) / 100) + '%' : null,
              },
            ]
          },
        },
      }
    };
  };

  module.exports.bureauWidgetDefinitions = (app) => (req, res) => (stats) => {
    return {
      'summons-management': {
        title: 'Summons management',
        widgets: {
            'your-work': {
              mandatory: true,
              widgetType: 'summonsDoughnut',
              column: 1,
              templateOptions: {
                title: '',
                doughnutId: 'yourWorkStats'
            },
            data: stats?.['summons-management'] || {},
          },
          'assign-replies': {
            mandatory: true,
            widgetType: 'summonsDoughnut',
            column: 2,
            templateOptions: {
              title: '',
              doughnutId: 'assignRepliesStats'
            },
            data: stats?.['summons-management'] || {},
          },
        }
      },
      'pool-management': {
        title: 'Pool management',
        widgets: {
          'not-yet-summoned': {
            mandatory: true,
            widgetType: 'largeValues',
            column: 1,
            values: [
              {
                value: stats?.['pool-management'].poolsNotYetSummoned,
                classes: '',
                ariaLabel: 'Pools not yet summoned',
                links: [
                  {
                    href: app.namedRoutes.build('pool-management.get'),
                    text: 'Pools not yet summoned',
                  }
                ],
              },
              {
                value: stats?.['pool-management'].poolsTransferringNextWeek,
                classes: '',
                ariaLabel: 'Pools transferring next week',
                links: [
                  {
                    href: app.namedRoutes.build('pool-management.get') + '?status=created',
                    text: 'Pools transferring next week',
                  }
                ],
                },
            ],
          },
          'deferred-jurors': {
            mandatory: true,
            widgetType: 'largeValues',
            column: 1,
            values: [
              {
                value: stats?.['pool-management'].deferredJurorsWithStartDateNextWeek,
                classes: '',
                ariaLabel: 'Deferred jurors with start date next week',
                links: [
                  {
                    href: '/reporting/deferred-list-date/report/date?filterOwnedDeferrals=true',
                    text: 'Deferred jurors with start date next week',
                  }
                ],
              },
            ],
          },
        },
      },

      'pools-under-responded': {
        title: 'Pools under responded',
        subTitle: 'Less than 5 weeks to go',
        columns: 3,
        widgets: {
            'pools-under-responded': {
              mandatory: true,
              column: 1,
              widgetType: 'placeholder',
              templateOptions: {
                title: '',
            },
            data: {},
          },
        }
      },

    };
  };

})();