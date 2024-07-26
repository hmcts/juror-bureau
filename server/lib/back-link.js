const ignoredUrls = ['juror-record/select?'];

function resolveBackLink(req) {
  const url = req.url;
  
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

  if (isIgnoredUrl(url)) {
    return;
  }

  req.session.historyStack.push(url);
}

function isIgnoredUrl(url) {
  return ignoredUrls.some(ignoredUrl => url.includes(ignoredUrl));
}

module.exports = { resolveBackLink };