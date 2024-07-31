const whitelistedUrls = [
  '/juror-management/record/',
  '/juror-record/search',
  '/pool-management',
  '/summons-replies/response',
  '/search',
];

const bypassUrls = [
  '/juror-record/select',
];

function resolveBackLink(req) {
  const url = req.url;

  if (isAssetUrl(url) || isBypassUrl(url)) {
    return;
  }

  if (!isUrlWhitelisted(url)) {
    // if the url is not whitelisted we don't want to keep it in the history stack
    req.session.historyStack = [];
    return;
  }
  
  if (!req.session.historyStack || req.session.historyStack.length === 0) {
    // the history stack keeps all the "curren" pages visited
    // this way we will be able to identify a refresh or a back-link click....
    // refresh should match historyStack[0] and back-link should match historyStack[1]
    // if it is a refresh we keep the stack normal and if it is a back-link click we need to pop 2 (?) elements
    req.session.historyStack = [];
    req.session.historyStack.push(url);
    return;
  }

  if (req.session.historyStack[req.session.historyStack.length - 1] === url) {
    // do nothing, it is a refresh
    return;
  }

  if (req.session.historyStack[req.session.historyStack.length - 2] === url) {
    // back-link click
    req.session.historyStack.pop();
    req.session.historyStack.pop();
  }

  req.session.historyStack.push(url);
}

function isUrlWhitelisted(url) {
  return whitelistedUrls.some(whitelistedUrl => url.includes(whitelistedUrl));
}

function isBypassUrl(url) {
  return bypassUrls.some(bypassUrl => url.includes(bypassUrl));
}

function isAssetUrl(url) {
  return url.includes('/assets/', '/js/', '/css/');
}

module.exports = { resolveBackLink };
