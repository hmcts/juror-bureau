const { isCourtUser } = require('../../components/auth/user-type');

module.exports.getDocuments = function () {
  return function (req, res) {
    let printingMessage;

    if (req.session.documentsJurorsList && req.session.documentsJurorsList.successMessage) {
      printingMessage = req.session.documentsJurorsList.successMessage;
    }

    delete req.session.documentsJurorsList;
    delete req.session.exemptionLetter;

    if (isCourtUser(req, res)) {
      return res.render('documents/index-court.njk');
    }
    return res.render('documents/index-bureau.njk', {
      printingMessage,
    });
  };
};
