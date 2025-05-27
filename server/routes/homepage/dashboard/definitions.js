(() => {
  'use strict';

  const _ = require('lodash');
  const { attendanceStats, unconfirmedAttendances, monthlyUtilisationStats, unpaidAttendances } = require('../../../objects/court-dashboard');
  const { dateFilter } = require('../../../components/filters');
  const { dateDifference } = require('../../../lib/mod-utils');

  module.exports.widgetDefinitions = (app) => (req, res) => async (list) => {

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
   * @property {boolean} required - Indicates whether the widget is mandatory.
   * @property {string} template - Path to the widget's template file.
   * @property {number} column - The column width of the widget (e.g., 1 or 2).
   * @property {Object} [templateOptions] - Additional options for rendering the widget's template.
   * @property {Function} [rawData] - An async function to fetch raw data for the widget.
   * @property {Array<Value>} [values] - A list of value objects associated with the widget.
   * 
   * @typedef {Object} Value
   * Represents a single value displayed within a widget.
   * 
   * @property {string} heading - The heading or label for the value.
   * @property {string} rawDataValueId - The key used to fetch the value from the widget's raw data.
   * @property {Function} [valueTransform] - A function to transform the raw value before display.
   * @property {string} [suffix] - A suffix to append to the value (e.g., "days").
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
            template: 'homepage/court-dashboard/widgets/attendance/attendance-doughnut.njk',
            column: 1,
            templateOptions: {
              title: 'Today',
              doughnutId: 'todayStats'
            },
            rawData: async (req) => {
              try {
                return await attendanceStats.get(
                    req,
                    req.session.authentication.locCode,
                    'today'
                  );
              } catch (err) {
                app.logger.crit('Unable to fetch attendance stats', {
                  auth: req.session.authentication,
                  token: req.session.authToken,
                  data: {
                    locationCode: req.session.authentication.locCode,
                    period: 'today',
                  },
                  error: typeof err.error !== 'undefined' ? err.error : err.toString(),
                });
                return {};
              }
            }
          },
          'last-7-days-stats': {
            mandatory: true,
            template: 'homepage/court-dashboard/widgets/attendance/attendance-doughnut.njk',
            column: 1,
            templateOptions: {
              title: 'Last 7 days',
              doughnutId: 'last7DaysStats'
            },
            rawData: async (req) => {
              try {
                return await attendanceStats.get(
                    req,
                    req.session.authentication.locCode,
                    'last7days'
                  );
              } catch (err) {
                app.logger.crit('Unable to fetch attendance stats', {
                  auth: req.session.authentication,
                  token: req.session.authToken,
                  data: {
                    locationCode: req.session.authentication.locCode,
                    period: 'last7days',
                  },
                  error: typeof err.error !== 'undefined' ? err.error : err.toString(),
                });
                return {};
              }
            }
          },
          'next-7-days-stats': {
            mandatory: true,
            template: 'homepage/court-dashboard/widgets/standard-value.njk',
            lineBreak: true,
            column: 2,
            rawData: async (req) => {
              try {
                return await attendanceStats.get(
                  req,
                  req.session.authentication.locCode,
                  'next7days'
                );
              } catch (err) {
                app.logger.crit('Unable to fetch attendance stats', {
                  auth: req.session.authentication,
                  token: req.session.authToken,
                  data: {
                    locationCode: req.session.authentication.locCode,
                    period: 'next7days',
                  },
                  error: typeof err.error !== 'undefined' ? err.error : err.toString(),
                });
                return {};
              }
            },
            templateOptions: {
              title: 'Next 7 days',
            },
            values: [
              {
                heading: 'Total due to attend',
                rawDataValueId: 'totalDueToAttend',
                links: [
                  {
                    href: app.namedRoutes.build('reports.persons-attending-detail.filter.get'),
                    text: 'Persons attending - Summary',
                  },
                ]
              },
              {
                heading: 'Jurors with reasonable adjustments',
                rawDataValueId: 'totalReasonableAdjustments',
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
            template: 'homepage/court-dashboard/widgets/standard-value.njk',
            column: 2,
            rawData: async (req) => {
              try {
                return await unconfirmedAttendances.get(
                  req,
                  req.session.authentication.locCode,
                );
              } catch (err) {
                app.logger.crit('Unable to fetch unconfirmed attendance stats', {
                  auth: req.session.authentication,
                  token: req.session.authToken,
                  data: {
                    locationCode: req.session.authentication.locCode,
                  },
                  error: typeof err.error !== 'undefined' ? err.error : err.toString(),
                });
                return {};
              }
            },
            values: [
              {
                heading: 'Unconfirmed attendances',
                rawDataValueId: 'totalUnconfirmed',
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
            template: 'homepage/court-dashboard/widgets/large-values.njk',
            lineBreak: true,
            column: 1,
            rawData: async (req) => {
              try {
                return await unpaidAttendances.get(
                  req,
                  req.session.authentication.locCode,
                );
              } catch (err) {
                app.logger.crit('Unable to fetch unpaid attendance stats', {
                  auth: req.session.authentication,
                  token: req.session.authToken,
                  data: {
                    locationCode: req.session.authentication.locCode,
                  },
                  error: typeof err.error !== 'undefined' ? err.error : err.toString(),
                });
                return {};
              }
            },
            values: [
              {
               rawDataValueId: 'unpaidAttendances',
               links: [
                  {
                    href: app.namedRoutes.build('juror-management.unpaid-attendance.get'),
                    text: 'Unpaid attendances',
                  }
                ],
              },
              {
                rawDataValueId: 'oldestUnpaidDate',
                valueTransform: (date) => {
                  return Math.abs(dateDifference(new Date(date), new Date(), 'days'));
                },
                suffix: 'days',
                links: [
                   {
                     href: app.namedRoutes.build('juror-management.unpaid-attendance.get'),
                     text: 'Oldest unpaid attendance',
                   }
                 ],
               },
            ],
          },
          'monthly-utilisation-report': {
            mandatory: true,
            template: 'homepage/court-dashboard/widgets/standard-value.njk',
            column: 1,
            rawData: async (req) => {
              try {
                return await monthlyUtilisationStats.get(
                  req,
                  req.session.authentication.locCode,
                );
              } catch (err) {
                app.logger.crit('Unable to fetch monthly utilisation stats', {
                  auth: req.session.authentication,
                  token: req.session.authToken,
                  data: {
                    locationCode: req.session.authentication.locCode,
                  },
                  error: typeof err.error !== 'undefined' ? err.error : err.toString(),
                });
                return {};
              }
            },
            values: [
              {
                heading: 'Date monthly utilisation report last run',
                rawDataValueId: 'lastDate',
                valueTransform: (value) => {
                  return dateFilter(value, 'yyyy-MM-DD', 'DD MMMM YYYY');
                },
                badge: {
                  requirments: (date) => {
                    const today = new Date();
                    const lastDate = new Date(date);
                    console.log(Math.abs(dateDifference(lastDate, today, 'days')));
                    return Math.abs(dateDifference(today, lastDate, 'days')) > 30;
                  },
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
            ]
          },
        },
      }
    };

    const result = {};

    let currentRow = 0; // Start with the first row
    let currentRowWidth = 0; // Track the current row's column usage

    for (const section in widgetDefinitions) {
      const sectionData = widgetDefinitions[section];
      const widgets = {};

      for (const [key, value] of Object.entries(sectionData.widgets)) {
        if (!value.mandatory && !list.includes(key)) {
          continue; // Skip widgets that are not mandatory and not in the list
        }

        // Exclude the `required` key from the returned object
        const { rawData, values, ...rest } = value;

        // If `rawData` is a function, execute it and assign the result
        const resolvedData = typeof rawData === 'function' ? await rawData(req) : rawData;

        // Populate `values` with the resolved data and apply `valueTransform` if it exists
        const resolvedValues = values?.map((item) => {
          let value = resolvedData?.[item.rawDataValueId] || item.value || null;

          // Check badge requirments before including the badge
          const badge =
            item.badge &&
            ( // Include the badge if:
              !item.badge.requirments || // No requirements defined
              (typeof item.badge.requirments === 'function' && item.badge.requirments(value)) // Requirements return true
            )
              ? item.badge
              : undefined;

          if (item.valueTransform && typeof item.valueTransform === 'function') {
            value = item.valueTransform(value);
          }

          return { ...item, value, badge };
        });

        // Add the processed widget back to the widgets object
        widgets[key] = { ...rest, rawData: resolvedData, values: resolvedValues };
      }

      // Calculate the maximum column value for this section
      const sectionColumns = Object.values(widgets).reduce((max, widget) => Math.max(max, widget.column || 1), 1);

      // If adding this section exceeds the row limit, move to the next row
      if (currentRowWidth + sectionColumns > 3) {
        currentRow++;
        currentRowWidth = 0; // Reset the row width for the new row
      }

      // Assign the current row to the section
      result[section] = {
        ...sectionData,
        columns: sectionColumns, // Maximum column value for this section
        row: currentRow, // Assign the row number
        widgets, // Include the transformed widgets as an object
      };

      // Update the current row width
      currentRowWidth += sectionColumns;
    }

    return result;
  };

})();