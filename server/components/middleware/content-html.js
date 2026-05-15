//const filterXSS = require("xss");
const { Logger } = require('../logger');

function containsHtml(value) {
  if (typeof value!== 'string') return false;

  /*
  const sanitisedValue= filterXSS(value, {
    whitelist: {}, // empty whitelist, means remove all tags
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script'] // remove content of script tags
  });
  */

  const sanitisedValue = value.replace(/<\/?[^>]+>/g, '');

  if (sanitisedValue !== value) {
    return true;
  }
  return false; 
}

function htmlScan(value, path, scanResults) {
  if (typeof value === "string") {
    if (containsHtml(value)) {
      scanResults.push({ path, value });
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => htmlScan(item, `${path}[${index}]`, scanResults));
    return;
  }
  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, child]) => {
      const nextPath = path ? `${path}.${key}` : key;
      htmlScan(child, nextPath, scanResults);
    });
  }
}

module.exports.detectHtmlContent = function (req, res, next) {

  if (req.method === 'GET') {
    return next();
  }
  const scanResults = [];

  htmlScan(req.body, "body", scanResults);
  htmlScan(req.query, "query", scanResults);
  htmlScan(req.params, "params", scanResults);
  
  if (scanResults.length > 0) {
    Logger.instance.crit(`XSS detected in ${req.method} ${req.originalUrl} -> ${scanResults[0].path}: ${scanResults[0].value}`);
    return res.status(400).render('_errors/400.njk');
  }

  next();
}