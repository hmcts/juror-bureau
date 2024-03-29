module.exports.flowLetterGet = (req, res, {
  serviceTitle,
  pageIdentifier,
  currentApp,
  letterMessage,
  letterType,
  postUrl,
  cancelUrl,
}) => {
  const errors = req.session.errors;

  delete req.session.errors;

  return res.render('custom-components/letter-flow/send-letter', {
    errors,
    serviceTitle,
    pageIdentifier,
    currentApp,
    letterMessage,
    letterType,
    postUrl,
    cancelUrl,
  });
};

module.exports.flowLetterPost = (req, res, {
  errorRoute,
  pageIdentifier,
  serviceTitle,
  currentApp,
  completeRoute,
}) => {
  if (!req.body.printLetters) {
    req.session.errors = {
      count: 1,
      items: {
        printLetters: [{
          summary: 'Select whether you want to print this letter',
          details: 'Select whether you want to print this letter',
        }],
      },
    };
    return res.redirect(errorRoute);
  }

  if (req.body.printLetters === 'yes') {
    req.session.documentsJurorsList = { checkedJurors: [{ 'juror_number': req.params.jurorNumber || req.params.id }] };

    return res.render('custom-components/letter-flow/redirect', {
      letterType: req.body.letterType,
      completeRoute,
      pageIdentifier,
      serviceTitle,
      currentApp,
    });
  }

  return res.redirect(completeRoute);
};
