(function(){
  'use strict';

  const _ = require('lodash');
  const modUtils = require('../../lib/mod-utils');
  const { isCourtUser, isBureauUser, isBureauManager } = require('../../components/auth/user-type');
  const { courtWidgetDefinitions, bureauWidgetDefinitions, widgetTemplates } = require('./dashboard/definitions');
  const { courtDashboardDAO } = require('../../objects/court-dashboard');
  const { courtDetailsDAO } = require('../../objects/administration');
  const { fetchCourtsDAO } = require('../../objects/index')
  const { bureauDashboardDAO, bureauDashboardPoolsUnderResponded } = require('../../objects/bureau-dashboard'); 
  const { capitalizeFully } = require('../../components/filters');

  module.exports.homepage = function(app) {
    return async function(req, res) {
      if (isCourtUser(req) || isBureauUser(req)) {
        return res.redirect(app.namedRoutes.build('homepage.dashboard.get'));
      }

      return res.render('homepage/index.njk');
    };
  };

  // Designed to not show any errors to user if the court dashboard could not be built
  // This is to prevent the user from being locked out of the system if the dashboard fails to load
  // Errors will be logged to the application logs for later investigation
  module.exports.dashboard = function(app) {
    return async function(req, res) {
      if (isCourtUser(req)) {
        return courtDashboard(app)(req, res);
      } else if (isBureauUser(req)) {
        return bureauDashboard(app)(req, res);
      } else {
        return res.status(403).send('Forbidden');
      }
    };
  };

  function courtDashboard(app) {
    return async function(req, res) {
      let courtDetails;
      try {
        courtDetails = modUtils.replaceAllObjKeys((await courtDetailsDAO.get(req, req.session.authentication.locCode)).response, _.camelCase);
      } catch (err) {
        app.logger.crit('Unable to fetch court details', {
          auth: req.session.authentication,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });
      }

      let notifications;
      try {
        notifications = await courtDashboardDAO.get(req, 'notifications', req.session.authentication.locCode);
      } catch (err) {
        app.logger.crit('Unable to fetch notifications', {
          auth: req.session.authentication,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });
      }

      let widgets = [];
      try {
        widgets = await buildDashboardWidgets(app)(req, res)({});
      } catch (err) {
        app.logger.crit('Unable to fetch court widget definitions', {
          auth: req.session.authentication,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });
      }

      console.log('\n\n');

      app.logger.crit('Court Dashboard Data', {
        auth: req.session.authentication,
        data: {
          firstName: 'fname',
          lastName: 'lname',
          addressOne: 'addr1',
          addressTwo: 'addr2',
          addressThree: 'addr3',
          town: 'town',
          county: 'county',
          postcode: 'postcode',
          'e-mail': 'email@email.com',
          data2: {
            phonenumber: 'phone',
          },
          simpleMessage: 'This is a simple message',
        }
      });

      console.log('\n\n');

      res.render('homepage/court-dashboard/dashboard.njk', {
        notifications: notifications ? buildDashboardNotifications(app)(req, res)(notifications) : [],
        alerts: buildDashboardAlerts(app)(req, res),
        widgets,
        headingName: courtDetails ? `${capitalizeFully(courtDetails?.englishCourtName)} (${courtDetails?.courtCode})` : 'Court Dashboard',
      });
    };
  };

  function bureauDashboard(app) {
    return async function(req, res) {

      let pageUrls = {
        homepage: app.namedRoutes.build('homepage.get'),
        clearFilter: app.namedRoutes.build('homepage.dashboard.get'),
      }

      // cache the court list for pools under responded filter
      if (!req.session.dashboardCourtsList) {
        try {
          const courtList = await fetchCourtsDAO.get(req);
          if (courtList && courtList.courts) {
            req.session.dashboardCourtsList = courtList.courts;
          }
        } catch (err) {
          app.logger.crit('Failed to fetch courts list: ', {
            auth: req.session.authentication,
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });
        }
      }

      // get notification data
      let notifications;
      try {
        notifications = await bureauDashboardDAO.get(req, 'notification-management');
      } catch (err) {
        app.logger.crit('Unable to fetch bureau notifications', {
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });
      }
      app.logger.info('Notification Management Data', {
        notifications
      });


      // get pools under responded data
      // if location_code is in query string it will filter the pools list
      let poolsUnderResponded;
      let locCode = req.query['location_code'];
      let queryStringParams = '?status=created&tab=bureau&pageNumber=1&pageLimit=25&sortBy=SERVICE_START_DATE&sortOrder=ASC'
      if (locCode) {
        queryStringParams += `&locCode=${locCode}`;
      }
      try {
        poolsUnderResponded = await bureauDashboardPoolsUnderResponded.get(req, queryStringParams);
      } catch (err) {
        app.logger.crit('Unable to fetch pools under responded data', {
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });
      }

      let widgets = [];
      try {
        widgets = await buildDashboardWidgets(app)(req, res)({});
      } catch (err) {
        app.logger.crit('Unable to fetch bureau widget definitions', {
          auth: req.session.authentication,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });
      }

      res.render('homepage/bureau-dashboard/dashboard.njk', {
        notifications: notifications ? buildDashboardNotifications(app)(req, res)(notifications) : [],
        widgets,
        headingName: 'Jury Central Summoning Bureau',
        pageUrls,
        courts: req.session.dashboardCourtsList ? modUtils.transformCourtNames(req.session.dashboardCourtsList) : [],
        poolList: poolsUnderResponded ? modUtils.transformPoolsUnderRespondedList(poolsUnderResponded.data) : []
      });
    };
  };

  const buildDashboardWidgets = (app) => (req, res) => async (requiredWidgets) => {
    function getSectionsWithMandatoryWidgets(obj) {
      return Object.keys(obj).filter(sectionKey => {
        const widgets = obj[sectionKey]?.widgets;
        if (!widgets) return false;
        return Object.values(widgets).some(widget => widget.mandatory === true);
      });
    }

    const widgetDefs = isCourtUser(req) ? courtWidgetDefinitions(app)(req, res)() : bureauWidgetDefinitions(app)(req, res)();
   
    const requiredSections = [...new Set([
      ...Object.keys(requiredWidgets), 
      ...getSectionsWithMandatoryWidgets(widgetDefs)
    ])];

    let stats = {}
    for (const section of requiredSections) {
      try {
        if (isCourtUser(req)) {
          stats[section] = await courtDashboardDAO.get(req, section, req.session.authentication.locCode);
        } else {
          if (section !== 'pools-under-responded') {
            stats[section] = await bureauDashboardDAO.get(req, section);
          }
          stats['summons-management'].yourWorkLink = app.namedRoutes.build('inbox.todo.get');
          stats['summons-management'].assignRepliesLink = app.namedRoutes.build('allocation.get');
        }
      } catch (err) {
        app.logger.crit(`Unable to fetch ${section} dashboard stats`, {
          auth: req.session.authentication,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });
        stats[section] = {};
      }
    }

    const widgetDefinitions = isCourtUser(req) ? courtWidgetDefinitions(app)(req, res)(stats) : bureauWidgetDefinitions(app)(req, res)(stats);

    const result = {};
    let currentRow = 0;
    let currentRowWidth = 0;

    for (const section in widgetDefinitions) {
      const sectionData = widgetDefinitions[section];
      const widgets = {};

      // Get required widgets for this section
      const requiredWidgetList = requiredWidgets && requiredWidgets[section] ? requiredWidgets[section] : [];

      for (const [key, widgetDef] of Object.entries(sectionData.widgets)) {
        if (!widgetDef.mandatory && !requiredWidgetList.includes(key)) {
          continue;
        }
        // Set the template based on widgetType and widgetTemplates
        let template = widgetDef.template;

        try {
          if (!template && widgetDef.widgetType && widgetTemplates[widgetDef.widgetType]) {
            template = widgetTemplates[widgetDef.widgetType];
          } else if (!template && (!widgetDef.widgetType || !widgetTemplates[widgetDef.widgetType])) {
            throw {
              error: {
                code: 'WIDGET_TEMPLATE_NOT_FOUND',
                message: `No template defined for '${key}' widget in section '${section}'.`,
              }
            };
          }
          widgets[key] = { ...widgetDef, template };
        } catch (err) {
          app.logger.crit(`Error building widget '${key}' in section '${section}'`, {
            auth: req.session.authentication,
            error: typeof err.error !== 'undefined' ? err.error : err.toString(),
          });
          delete widgets[key];
        }
      }

      const sectionColumns = sectionData.columns || Object.values(widgets).reduce((max, widget) => Math.max(max, widget.column || 1), 1);

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

  const buildDashboardNotifications = (app) => (req, res) => (notifications) => {
    const notificationList = [];
    for (const [notificationType, value] of Object.entries(notifications)) {
      let notificationHTML;
      if (value > 0) {
        switch (notificationType) {
          case 'openSummonsReplies':
            notificationHTML = `You have <b>${value}</b>
              <a class="govuk-link govuk-link--no-visited-state" href="${app.namedRoutes.build('inbox.todo.get')}">summons replies</a> 
              with less than a week until service start date to process.
            `;
            break;
          case 'pendingJurors':
              notificationHTML = `You have <b>${value}</b> 
                <a class="govuk-link govuk-link--no-visited-state" href="${app.namedRoutes.build('juror-management.manage-jurors.approve.get')}"> juror${value > 1 ? 's' : ''} to approve</a>
              `;
            break;
          case 'fourWeeksSummonsReplies':
            if (isBureauManager(req)) {
              notificationHTML = `You have <b>${value}</b> 
                <a class="govuk-link govuk-link--no-visited-state" href="${app.namedRoutes.build('allocation.get')}">summons replies</a> 
                with less than four weeks until service start date to process.
              `;
            }
            break;
        }
        if (notificationHTML) {
          notificationList.push(notificationHTML);
        }
      }
    }
    return notificationList;
  };

  const buildDashboardAlerts = (app) => (req, res) => {
    const alertList = [];
    if (isCourtUser(req)) {
      if (modUtils.isFirstWorkingDayOfMonth()) {
        alertList.push(
          {
            type: 'warning',
            html: "Remember to run the <a href='" + app.namedRoutes.build('reports.prepare-monthly-utilisation.filter.get') + "'>monthly wastage and utilisation report</a>"
          } 
        );
      }
    }
    return alertList;
  };

  module.exports.filterPools = function(app) {
    return function(req, res) {
      var queryParams = _.clone(req.query);

      if (req.body?.courtNameOrLocation === '' || typeof req.body?.courtNameOrLocation === 'undefined') {
        // this piece will clear the filter but keep all other search params
        delete queryParams['location_code'];
        return res.redirect(urlBuilder(app, queryParams));
      }

      modUtils.matchUserCourt(req.session.dashboardCourtsList, req.body)
        .then(function(court) {
          queryParams['location_code'] = court.locationCode;
          return res.redirect(urlBuilder(app, queryParams));
        })
        .catch(function() {
          delete queryParams['location_code'];
          return res.redirect(urlBuilder(app, queryParams));
        });
    };
  };

  function urlBuilder(app, params, options) {
    var paramsClone = _.clone(params);

    if (typeof options !== 'undefined') {
      if (options.hasOwnProperty('tab')) {
        paramsClone.tab = options.tab;
      }

      if (options.hasOwnProperty('status')) {
        if (options.status === 'requested') {
          delete paramsClone.tab;
        }
        paramsClone.status = options.status;

        delete paramsClone['page'];
      }

      if (options.clearFilter) {
        delete paramsClone['location_code'];
      }

      if (options.clearSort) {
        delete paramsClone['sortBy'];
        delete paramsClone['sortOrder'];
      }
    }

    return app.namedRoutes.build('homepage.dashboard.get')
      + '?' + new URLSearchParams(paramsClone).toString();
  }

})();
