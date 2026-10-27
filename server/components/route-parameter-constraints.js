'use strict';

function constrainRouteParameters (constraints) {
  return function routeParameterConstraints (req, res, next) {
    for (const [parameter, allowedValues] of Object.entries(constraints)) {
      if (!allowedValues.includes(req.params[parameter])) {
        return next('route');
      }
    }

    return next();
  };
}

module.exports = {
  activeOrAll: constrainRouteParameters({ status: ['active', 'all'] }),
  activateOrDeactivate: constrainRouteParameters({ status: ['activate', 'deactivate'] }),
  court: constrainRouteParameters({ type: ['court'] }),
  courtOrBureau: constrainRouteParameters({ location: ['court', 'bureau'] }),
  expenseStatus: constrainRouteParameters({
    status: ['draft', 'for-approval', 'for-reapproval', 'approved'],
  }),
  exportContactDetails: constrainRouteParameters({ message: ['export-contact-details'] }),
  grantOrRefuse: constrainRouteParameters({ letter: ['grant', 'refuse'] }),
  paper: constrainRouteParameters({ type: ['paper'] }),
  paperOrDigital: constrainRouteParameters({ type: ['paper', 'digital'] }),
  poolOrCourt: constrainRouteParameters({ type: ['pool', 'court'] }),
  summonsReminders: constrainRouteParameters({ document: ['summons-reminders'] }),
  trialOrPool: constrainRouteParameters({ ballotType: ['trial', 'pool'] }),
  constrainRouteParameters,
};
