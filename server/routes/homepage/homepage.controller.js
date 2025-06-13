(function(){
  'use strict';

  const { isCourtUser } = require('../../components/auth/user-type');
  const { courtWidgetDefinitions, widgetTemplates } = require('./dashboard/definitions');
  const { courtDashboardDAO } = require('../../objects/court-dashboard');


  module.exports.homepage = function(app) {
    return async function(req, res) {

      if (isCourtUser(req)) {
        return res.redirect(app.namedRoutes.build('homepage.dashboard.get'));
      }

      return res.render('homepage/index.njk');
    };
  };

  module.exports.dashboard = function(app) {
    return async function(req, res) {
      let notifcations;
      try {
        notifcations = await courtDashboardDAO.get(req, 'notifications', req.session.authentication.locCode);
      } catch (err) {
        app.logger.crit('Unable to fetch notifications', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });
      }

      let widgets = [];
      try {
        widgets = await buildDashboardWidgets(app)(req, res)({});
      } catch (err) {
        app.logger.crit('Unable to fetch widget definitions', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });
        return res.render('_errors/generic', { err });
      }

      res.render('homepage/court-dashboard/dashboard.njk', {
        notifications: buildDashboardNotifications(app)(req, res)(notifcations),
        widgets,
        courtName: 'Chester Crown Court',
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

    const requiredSections = [...new Set([
      ...Object.keys(requiredWidgets), 
      ...getSectionsWithMandatoryWidgets(courtWidgetDefinitions(app)(req, res)())
    ])];

    let stats = {}
    for (const section of requiredSections) {
      try {
        stats[section] = await courtDashboardDAO.get(req, section, req.session.authentication.locCode);
      } catch (err) {
        app.logger.crit(`Unable to fetch ${section} dashboard stats`, {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });
      }
    }

    const widgetDefinitions = courtWidgetDefinitions(app)(req,res)(stats);

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

  const buildDashboardNotifications = (app) => (req, res) => (notifcations) => {
    const notifcationList = [];
    for (const [notificationType, value] of Object.entries(notifcations)) {
      let notificationHTML;
      if (value > 0) {
        switch (notificationType) {
          case 'openSummonsReplies':
            notificationHTML = `You have <b>${value}</b> <a href="#" class="govuk-link">summons replies</a> with less than a week until service start date to process.`;
            break;
          case 'pendingJurors':
            notificationHTML = `You have <b>${value}</b> <a href="${app.namedRoutes.build('juror-management.manage-jurors.approve.get')}"> juror${value > 1 ? 's' : ''} to approve</a>`
            break;
        }
        notifcationList.push(notificationHTML);
      }
    }

    return notifcationList;
  };

})();
