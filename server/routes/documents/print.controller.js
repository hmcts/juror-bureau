(function() {
  'use strict';

  const { reissueLetterDAO } = require('../../objects/documents');
  const letterTemplates = require('./pdf/letter-templates');
  const { LetterType } = require('../../lib/mod-utils');
  const { convert24to12, dateFilter } = require('../../components/filters/index');

  module.exports.printDocuments = function(app) {
    return async function(req, res) {
      const { generateDocument } = require('./pdf/letter-generator');
      const { document } = req.params;
      let jurorNumbers;

      // bit of a problem here... when a pdf is renedered, clicking download seems to resend a request to download
      // so clearing the list here would break that... but would also break in case of the user pressing F5
      jurorNumbers = req.session.documentsJurorsList.checkedJurors.reduce((numbers, juror) => {
        numbers.push(juror.juror_number);
        return numbers;
      }, []);

      const payload = {
        'letter_type': LetterType[document],
        'juror_numbers': jurorNumbers,
      };

      if (document === 'show-cause'){
        payload['show_cause_date'] = dateFilter(req.query.hearingDate, 'DD/MM/YYYY', 'YYYY-MM-DD');
        payload['show_cause_time'] = req.query.hearingTime;
      } else if (document === 'failed-to-attend'){

        payload['details_per_letter'] = FTAPayloadBuilder(jurorNumbers, req.session.documentsJurorsList.data);
      }

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
    case 'show-cause':
      return showCause(data);
    case 'failed-to-attend':
      return failedToAttend(data);
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

      const courtAddress = [
        juror.court_name,
        juror.court_address_line1,
        juror.court_address_line2,
        juror.court_address_line3,
        juror.court_address_line4,
        juror.court_address_line5,
        juror.court_address_line6,
        juror.court_post_code,
      ];

      juror.content = letterTemplates('deferral-refused', {
        welsh: isWelsh,
        courtAddress: courtAddress.filter((line) => line).join('\n'),
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

      const courtAddress = [
        juror.court_name,
        juror.court_address_line1,
        juror.court_address_line2,
        juror.court_address_line3,
        juror.court_address_line4,
        juror.court_address_line5,
        juror.court_address_line6,
        juror.court_post_code,
      ];

      juror.content = letterTemplates('excusal-refused', {
        welsh: isWelsh,
        courtAddress: courtAddress.filter((line) => line).join('\n'),
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
        serviceDate: juror.postponed_to_date,
        serviceTime: juror.attend_time,
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

  function showCause(data) {
    const documents = data.map((juror) => {
      const isWelsh = juror.welsh;

      juror.content = letterTemplates('show-cause', {
        welsh: isWelsh,
        attendanceDate: dateFilter(juror.attendance_date, 'DD MMMM YYYY', 'dddd, DD MMMM, YYYY'),
        noShowDate: dateFilter(juror.no_show_date, 'DD MMMM YYYY', 'dddd, DD MMMM, YYYY'),
        noShowTime: convert24to12(juror.no_show_time),
        courtName: juror.court_name,
      });

      juror.title = isWelsh ? 'GWASANAETH RHEITHGOR' : 'JURY SERVICE';

      return juror;
    });

    return documents;
  }

  function failedToAttend(data) {
    const documents = data.map((juror) => {
      const isWelsh = juror.welsh;

      juror.content = letterTemplates('failed-to-attend', {
        welsh: isWelsh,
        attendanceDate: dateFilter(juror.attendance_date, 'DD MMMM YYYY', 'dddd, DD MMMM, YYYY'),
        replyByDate: dateFilter(juror.reply_by_date, 'DD MMMM YYYY', 'dddd, DD MMMM, YYYY'),
      });

      juror.title = isWelsh ? 'GWASANAETH RHEITHGOR' : 'JURY SERVICE';

      return juror;
    });

    return documents;
  }

  function FTAPayloadBuilder(jurorNumbers, jurorData) {
    let letterPayload = [];

    jurorData.forEach(function(juror){
      if (jurorNumbers.find((jurorNumber) => jurorNumber === juror.juror_number)) {
        let tmpJuror = {
          'juror_number': juror.juror_number,
          'letter_date': juror.absent_date,
        };

        if (!(letterPayload.find((jurorObj) =>
          (jurorObj.juror_number === tmpJuror.juror_number && jurorObj.letter_date === tmpJuror.letter_date)))){
          letterPayload.push(
            tmpJuror,
          );
        };
      }

    });
    return letterPayload;

  }


})();
