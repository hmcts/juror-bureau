(function() {
  'use strict';

  const { reissueLetterDAO } = require('../../objects/documents');
  const letterTemplates = require('./pdf/letter-templates');
  const { formatLetterDate, LetterType } = require('../../lib/mod-utils');

  module.exports.printDocuments = function(app) {
    return async function(req, res) {
      const { generateDocument } = require('./pdf/letter-generator');
      const { document } = req.params;

      // bit of a problem here... when a pdf is renedered, clicking download seems to resend a request to download
      // so clearing the list here would break that... but would also break in case of the user pressing F5

      const jurorNumbers = req.session.documentsJurorsList.checkedJurors.reduce((numbers, juror) => {
        numbers.push(juror.juror_number);
        return numbers;
      }, []);

      const payload = {
        'letter_type': LetterType[document],
        'juror_numbers': jurorNumbers,
      };

      try {
        const response = await reissueLetterDAO.printCourtLetters(app, req, payload);

        const content = getLetterTemplate(document, response);
        const letter = await generateDocument(content, req.session.authentication.staff.name);

        app.logger.info('Generated documents for the selected jurors', {
          userId: req.session.authentication.login,
          jwt: req.session.authToken,
        });

        res.contentType('application/pdf');
        return res.send(letter);
      } catch (err) {
        app.logger.crit('Unable to generate and print selected jurors', {
          userId: req.session.authentication.login,
          jwt: req.session.authToken,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic');
      }
    };
  };

  function getLetterTemplate(letterType, data) {
    switch (letterType) {
    case 'deferral-granted':
      return deferralGranted(data);
    case 'deferral-refused':
      return deferralRefused(data);
    case 'excusal-granted':
      return excusalGranted(data);
    case 'excusal-refused':
      return excusalRefused(data);
    case 'postponement':
      return postponement(data);
    case 'withdrawal':
      return withdrawal(data);
    }
  }

  function deferralGranted(data) {
    const documents = data.map((juror) => {
      const isWelsh = juror.welsh;

      juror.content = letterTemplates('deferral-granted', {
        serviceDate: juror.deferred_to_date,
        serviceTime: juror.attend_time,
        welsh: isWelsh,
      });

      juror.title = isWelsh ? 'GWASANAETH RHEITHGOR' : 'DEFERRAL OF JURY SERVICE';

      return juror;
    });

    return documents;
  }

  function deferralRefused(data) {
    const documents = data.map((juror) => {
      const isWelsh = juror.welsh;

      juror.content = letterTemplates('deferral-refused', {
        welsh: isWelsh,
        courtAddress: Object.values(juror.courtAddress).join('\n'),
      });

      juror.title = isWelsh ? 'GWASANAETH RHEITHGOR' : 'JURY SERVICE';

      return juror;
    });

    return documents;
  }

  function excusalGranted(data) {
    const documents = data.map((juror) => {
      const isWelsh = juror.welsh;

      juror.content = letterTemplates('excusal-granted', {
        welsh: isWelsh,
      });

      juror.title = isWelsh ? 'ESGUSODI RHAG GORFOD GWASANAETHU AR REITHGOR' : 'EXCUSAL OF JURY SERVICE';

      return juror;
    });

    return documents;
  }

  function excusalRefused(data) {
    const documents = data.map((juror) => {
      const isWelsh = juror.welsh;

      juror.content = letterTemplates('excusal-refused', {
        welsh: isWelsh,
        courtAddress: Object.values(juror.courtAddress).join('\n'),
      });

      juror.title = isWelsh ? 'GWASANAETH RHEITHGOR' : 'JURY SERVICE';

      return juror;
    });

    return documents;
  }

  function postponement(data) {
    const documents = data.map((juror) => {
      const isWelsh = juror.welsh;

      juror.content = letterTemplates('postponement', {
        serviceDate: formatLetterDate(new Date(), 'dddd D MMMM YYYY', isWelsh),
        serviceTime: '09:45 AM',
        welsh: isWelsh,
      });

      juror.title = isWelsh ? 'GOHIRIO GWASANAETH RHEITHGOR' : 'POSTPONEMENT OF JURY SERVICE';

      return juror;
    });

    return documents;
  }

  function withdrawal(data) {
    const documents = data.map((juror) => {
      const isWelsh = juror.welsh;

      juror.content = letterTemplates('withdrawal', {
        welsh: isWelsh,
      });

      juror.title = isWelsh ? 'GWASANAETH RHEITHGOR' : 'JURY SERVICE';

      return juror;
    });

    return documents;
  }

})();
