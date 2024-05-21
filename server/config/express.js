/* eslint-disable strict */
const express = require('express');
const nunjucks = require('express-nunjucks').default;
const njk = require('nunjucks');
const csrf = require('csurf');
const helmet = require('helmet');
const referrerPolicy = require('referrer-policy');
const compression = require('compression');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const errorHandler = require('errorhandler');
const path = require('path');
const filters = require('../components/filters');
const mojFilters = require('@ministryofjustice/frontend/moj/filters/all')();
const config = require('./environment')();
const utils = require('../lib/utils.js');
const modUtils = require('../lib/mod-utils');
const isCourtUser = require('../components/auth/user-type').isCourtUser;
const rateLimit = require('express-rate-limit');

// Grab environment variables to enable/disable certain services
const pkg = require(__dirname + '/../../package.json');
const releaseVersion = pkg.version;

// Basic Auth credentials
const basicAuthUsername = process.env.USERNAME;
const basicAuthPassword = process.env.PASSWORD;

const { SessionConfig } = require('../lib/session-config.js');

const generateNonce = () => {
  return require('crypto').randomBytes(16).toString('base64');
};

module.exports = async function(app) {
  let env = process.env.NODE_ENV || 'development';
  let useAuth = process.env.USE_AUTH || config.useAuth;

  // Ensure provided environment values are lowercase
  env = env.toLowerCase();
  useAuth = useAuth.toLowerCase();

  // rate limiting
  const limiter = rateLimit({
    windowMs: config.rateLimit.time,
    limit: config.rateLimit.max,
    message: config.rateLimit.message,
  });

  app.use(limiter);

  app.use((_, res, next) => {
    res.locals.nonce = generateNonce();
    next();
  });

  // Security hardening
  app.use((req, res, next) => {
    const nonce = `'nonce-${res.locals.nonce}'`;
    const chartJsCsp = '\'sha256-kwpt3lQZ21rs4cld7/uEm9qI5yAbjYzx+9FGm/XmwNU=\'';

    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ['\'none\''],
        styleSrc: ['\'self\'', chartJsCsp],
        scriptSrc: ['\'self\'', 'cdnjs.cloudflare.com', nonce],
        fontSrc: ['\'self\'', 'data:'],
        imgSrc: ['\'self\'', 'data:'],
        connectSrc: ['\'self\''],
      },
    })(req, res, next);
  });
  app.use(helmet.dnsPrefetchControl());
  app.use(helmet.frameguard());
  app.use(helmet.hidePoweredBy());
  app.use(helmet.hsts());
  app.use(helmet.ieNoOpen());
  app.use((_, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, max-age=0, must-revalidate, no-store');
    next();
  });
  app.use(helmet.noSniff());
  app.use(helmet.xssFilter());
  app.use(referrerPolicy());

  // Base Path of the client folder
  app.set('appPath', path.join(config.root, 'client'));

  // Serve all static files
  app.use(express.static(app.get('appPath')));

  app.use(compression());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(methodOverride());

  app.set('trust proxy', 1);
  new SessionConfig().start(app);

  // CSRF Protection
  app.use(csrf());

  // Setup templating engine
  app.set('view engine', 'njk');
  app.set('views', [
    'node_modules/govuk-frontend',
    'node_modules/@ministryofjustice/frontend/',
    path.join(app.get('appPath'), 'templates'),
  ]);

  // add moj filters
  // mojFilters = Object.assign(mojFilters);
  Object.keys(mojFilters).forEach(function(filterName) {
    filters[filterName] = mojFilters[filterName];
  });

  nunjucks(app, {
    autoescape: true,
    watch: true,
    noCache: true,
    filters: filters,
    loader: njk.FileSystemLoader, // Use synchronous loader templates
  });

  // Send data to all views
  app.use(function(req, res, next) {
    res.locals.assetPath = '/';
    res.locals.releaseVersion = 'v' + releaseVersion;
    res.locals.csrftoken = req.csrfToken();
    res.locals.activeUrl = req.originalUrl;
    res.locals.trackingCode = config.trackingCode;
    res.locals.serviceName = 'HMCTS Juror';

    if (config.responseEditEnabled === true){
      res.locals.responseEditEnabled = true;
    } else {
      res.locals.responseEditEnabled = false;
    }

    if (typeof req.session.authentication !== 'undefined' && typeof res.locals.authentication === 'undefined') {
      res.locals.authentication = req.session.authentication;
    }

    res.locals.currentUrl = req.url;

    if (typeof req.session.hasModAccess !== 'undefined') {
      res.locals.hasModAccess = req.session.hasModAccess;
    }

    // Setting headers stops pages being indexed even if indexed pages link to them.
    res.setHeader('X-Robots-Tag', 'noindex');
    next();
  });

  // interceptor to block legacy access to court users
  // if a court user logs in and tries to visit a juror-digital path they will be redirected to the homepage
  // the way this would work is... express have the path on the request object (/inbox or /staff/create)
  // we then split it and grab the parent route (inbox or staff)
  // after we have that we check two conditions, isCourtUser and jurorDigitalPath
  // this works because in the new app we will navigate with modules and every module will have a
  // parent route that will never match none of the current juror-digital paths
  app.use(function(req, res, next) {
    var routePart = req.path.split('/').slice(1)[0];

    if (isCourtUser(req) && modUtils.jurorDigitalPath[routePart]) {
      return res.redirect(app.namedRoutes.build('homepage.get'));
    }

    next();
  });


  // Authenticate against the environment-provided credentials, if running
  // the app in production
  if (env === 'production' && useAuth === 'true'){
    app.use(utils.basicAuth(app.logger, basicAuthUsername, basicAuthPassword, require('basic-auth')));
  }


  // Disallow search index indexing throught Robots.txt,
  // also done above by sending header to all views
  app.get('/robots.txt', function(req, res) {
    res.type('text/plain');
    res.send('User-agent: *\nDisallow: /');
  });


  // error handler
  app.use(function(err, req, res, next) {
    if (err.code !== 'EBADCSRFTOKEN') {
      return next(err);
    }

    res.locals.assetPath = '/';
    res.locals.releaseVersion = 'v' + releaseVersion;
    res.locals.authenticated = false;
    res.locals.trackingCode = config.trackingCode;

    // handle CSRF token errors here
    return res.status(403).render('_errors/403.njk');
  });


  // Configure Error Handling, has to be last
  if ('development' === env || 'test' === env) {
    app.use(errorHandler());
  }

};
