const whitelistedUrls = [
  '/juror-management/record/',
  '/juror-management/juror/',
  '/juror-management/approve-expenses',
  '/juror-management/unpaid-attendance',
  '/juror-record/search',
  '/pool-management',
  '/summons-replies/response',
  '/response',
  '/search',
  '/inbox',
  '/pending',
  '/completed'
];

const bypassUrls = [
  '/juror-record/select',
  '/submit-paper',
  '/digital/process',
  '/paper/process',
  '/responded/digital',
  '/responded/paper',
  '/digital/deferral',
  '/paper/deferral',
  '/digital/excusal',
  '/paper/excusal',
  '/digital/disqualify',
  '/paper/disqualify',
  '/details/edit',
  '/details/ineligible-age',
  '/multiple-tabs',
  '/delete-juror-attendance',
  '/juror-management/approve-expenses/view-expenses/',
  '/on-call/confirm',
  '/on-call/validate',
];

const assetUrls = [
  '/assets/',
  '/js/',
  '/css/',
  '/.well-known/'
];

const jurorTabBureauRegex = /juror-management(\/)record(\/)([0-9]{9})(\/)(details|summons|attendance|notes|history)/;
const jurorTabCourtRegex = /juror-management(\/)record(\/)([0-9]{9})(\/)(overview|details|expenses|attendance|notes|history)/;

function resolveBackLink(req) {
  const url = req.url;
  let isTabURL = false;

  if (isAssetUrl(url) || isBypassUrl(url)) {
    return;
  }

  if (req.session.authentication.activeUserType === 'BUREAU' && jurorTabBureauRegex.test(url)) {
    isTabURL = true;
  }
  if (req.session.authentication.activeUserType === 'COURT' && jurorTabCourtRegex.test(url)) {
    isTabURL = true;
  }


  if (!isUrlWhitelisted(url)) {
    // if the url is not whitelisted we don't want to keep it in the history stack
    req.session.historyStack = [];
    return;
  }
  
  if (!req.session.historyStack || req.session.historyStack.length === 0) {
    // the history stack keeps all the "current" pages visited
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

  if (isTabURL) {
    // do nothing, it's a tab within a page
    return;
  }

  if (req.session.historyStack[req.session.historyStack.length - 2] === url) {
    // back-link click
    req.session.historyStack.pop();
    req.session.historyStack.pop();
  }

  // add url to the history stack
  req.session.historyStack.push(url);

  // check for special case - view juror record from summons replies from summons management
  if (req.session.historyStack.length >= 3) {

    const jurorDetailsRegex1 = /summons-replies(\/)response(\/)([0-9]{9})(\/)view-juror-record/;
    const jurorDetailsRegex2 = /juror-record(\/)search\?jurorNumber=([0-9]{9})/;
    const jurorDetailsRegex3 = /juror-management(\/)record(\/)([0-9]{9})(\/)overview/; 
    let matched = 0

    if (req.session.historyStack[req.session.historyStack.length - 1].match(jurorDetailsRegex3)) {
      matched++;
    }
    if (req.session.historyStack[req.session.historyStack.length - 2].match(jurorDetailsRegex2)) {
      matched++;
    }
    if (req.session.historyStack[req.session.historyStack.length - 3].match(jurorDetailsRegex1)) {
      matched++;
    }
    if (matched === 3) {
      req.session.historyStack.splice(req.session.historyStack.length - 3, 2); 
    }
  }

}

function isUrlWhitelisted(url) {
  return whitelistedUrls.some(whitelistedUrl => url.includes(whitelistedUrl));
}

function isBypassUrl(url) {
  return bypassUrls.some(bypassUrl => url.includes(bypassUrl));
}

function isAssetUrl(url) {
  return assetUrls.some(assetUrl => url.includes(assetUrl));
}

module.exports = { resolveBackLink };
