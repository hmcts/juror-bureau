'use strict';

const methods = require('methods');
const Router = require('named-routes');

const PARAMETER_NAME = '[A-Za-z_$][A-Za-z0-9_$]*';

class NamedRoutes extends Router {
  extendExpress (app) {
    const namedRoutes = this;

    this.expressMode = true;
    app.namedRoutes = this;
    app._routingContext = [];

    methods.forEach((method) => {
      const originalMethod = app[method];

      if (typeof originalMethod !== 'function') {
        return;
      }

      app[method] = function (path) {
        if (method === 'get' && arguments.length === 1 && typeof path === 'string') {
          return this.set(path);
        }

        const args = this._routingContext.concat(Array.prototype.slice.call(arguments));
        const legacyPath = args[0];
        const constraints = constraintsFromPath(legacyPath);
        let routeName = '';

        if (typeof args[1] === 'string') {
          routeName = args[1];
          args[1] = function (req, res, next) {
            req.route.name = routeName;
            next();
          };
        }

        namedRoutes.add(method, legacyPath, [], { name: routeName });

        const registrationArgs = args.slice();
        const constraintGuard = createConstraintGuard(constraints);

        registrationArgs[0] = toExpress5Path(legacyPath);

        if (constraintGuard) {
          registrationArgs.splice(1, 0, constraintGuard);
        }

        originalMethod.apply(this, registrationArgs);

        return this;
      };
    });

    app.all = function () {
      const args = Array.prototype.slice.call(arguments);

      methods.forEach((method) => {
        if (method !== 'm-search' && typeof app[method] === 'function') {
          app[method].apply(app, args);
        }
      });

      return app;
    };

    return this;
  }
}

function toExpress5Path (path) {
  if (Array.isArray(path)) {
    return path.map(toExpress5Path);
  }

  if (typeof path !== 'string') {
    return path;
  }

  let wildcardIndex = 0;
  let expressPath = path
    .replace(new RegExp(`/:(?<name>${PARAMETER_NAME})\\([^)]+\\)\\?`, 'g'), '{/:$<name>}')
    .replace(new RegExp(`:(?<name>${PARAMETER_NAME})\\([^)]+\\)`, 'g'), ':$<name>')
    .replace(new RegExp(`/:(?<name>${PARAMETER_NAME})\\?`, 'g'), '{/:$<name>}');

  expressPath = expressPath.replace(/\/\*(?![A-Za-z0-9_$])/g, (match, offset, value) => {
    const name = wildcardIndex === 0 ? 'legacySplat' : `legacySplat${wildcardIndex}`;

    wildcardIndex += 1;

    if (offset === 0 && value === '/*') {
      return `/{*${name}}`;
    }

    return `/*${name}`;
  });

  return expressPath;
}

function constraintsFromPath (path) {
  if (typeof path !== 'string') {
    return [];
  }

  const constraints = [];
  const constraintPattern = new RegExp(`:(${PARAMETER_NAME})\\(([^)]+)\\)(\\?)?`, 'g');
  let match;

  while ((match = constraintPattern.exec(path)) !== null) {
    constraints.push({
      name: match[1],
      allowedValues: match[2].split('|'),
      optional: match[3] === '?',
    });
  }

  return constraints;
}

function createConstraintGuard (constraints) {
  if (constraints.length === 0) {
    return null;
  }

  return function legacyRouteConstraintGuard (req, res, next) {
    for (const constraint of constraints) {
      const value = req.params[constraint.name];

      if (typeof value === 'undefined' && constraint.optional) {
        continue;
      }

      if (!constraint.allowedValues.includes(value)) {
        return next('route');
      }
    }

    return next();
  };
}

module.exports = NamedRoutes;
module.exports.constraintsFromPath = constraintsFromPath;
module.exports.createConstraintGuard = createConstraintGuard;
module.exports.toExpress5Path = toExpress5Path;
