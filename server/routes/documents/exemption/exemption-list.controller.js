(function() {
  'use strict';

  const _ = require('lodash');
  const urljoin = require('url-join');
  const { certificateOfExemptionDAO } = require('../../../objects/documents');
  const letterTemplates = require('../pdf/letter-templates');

  module.exports.getExemptionList = function(app) {
    return async function(req, res) {
      const backLinkUrl = app.namedRoutes.build('documents.get');
      const changeUrl = app.namedRoutes.build('documents.certificate-of-exemption.get');
      const tmpErrors = _.clone(req.session.errors);
      const locCode = req.session.authentication.owner;
      const { caseNumber } = req.params;

      delete req.session.errors;

      try {
        const response = await certificateOfExemptionDAO.getJurorsForExemptionList(req, caseNumber, locCode);

        req.session.exemptionLetter.jurors = response.map(j => j.juror_number);

        app.logger.info('Fetched the list of juror exemption candidates: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: response,
        });

        const printUrl = urljoin(app.namedRoutes.build('documents.certificate-of-exemption-list.print', {
          caseNumber,
        }), urlBuilder(req.query));

        return res.render('documents/exemption/exemption-list.njk', {
          pageIdentifier: 'Certificates of exemption',
          backLinkUrl,
          printUrl,
          caseNumber,
          changeUrl,
          buttonLabel: 'Print certificate of exemption',
          selectedJurors: 0,
          jurors: response,
          totalJurors: response.length,
          totalCheckableJurors: response.length,
          errors: {
            title: 'There is a problem',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          },
        });

      } catch (err) {
        app.logger.crit('Failed to fetch exemption jurors list: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: { ...req.body },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic', { err });
      };
    };
  };

  module.exports.printCertificateOfExemption = function(app) {
    return async function(req, res) {
      const { generateDocument } = require('../pdf/letter-generator');
      const { caseNumber } = req.params;
      const { durationType, durationYears } = req.query;
      const checkedJurors = _.clone(req.session.exemptionLetter.checkedJurors);

      delete req.session.errors;

      const payload = {
        'letter_type': 'CERTIFICATE_OF_EXEMPTION',
        'juror_numbers': checkedJurors,
        'trial_number': caseNumber,
        'judge': req.session.exemptionLetter.judge,
        'exemption_period': durationType === 'indefinitely' ? 'indefinite' : durationYears,
      };

      try {
        const response = await certificateOfExemptionDAO.postPrintLetter(req, payload);


        const content = getLetterTemplate(response);
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

        return res.render('_errors/generic', { err });
      }
    };
  };

  module.exports.checkExemptionJuror = function(app) {
    return function(req, res) {
      const { jurorNumber, action } = req.query;

      if (!req.session.exemptionLetter.checkedJurors) {
        req.session.exemptionLetter.checkedJurors = [];
      }

      if (jurorNumber === 'check-all-jurors') {
        if (action === 'check') {
          req.session.exemptionLetter.checkedJurors = _.clone(req.session.exemptionLetter.jurors);
        } else {
          req.session.exemptionLetter.jurors.forEach(j => {
            delete req.session.exemptionLetter.checkedJurors;
          });
        }
      } else if (action === 'check') {
        req.session.exemptionLetter.checkedJurors.push(jurorNumber);
      } else {
        const index = req.session.exemptionLetter.checkedJurors.indexOf(jurorNumber);

        req.session.exemptionLetter.checkedJurors.splice(index, 1);
      }

      app.logger.info('Checked or unchecked one or more jurors: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        data: {
          jurorNumber,
        },
      });

      return res.send();
    };
  };

  function getLetterTemplate(data) {
    const documents = data.map((juror) => {
      const isWelsh = juror.welsh;

      juror.content = letterTemplates('certificate-of-exemption', {
        welsh: isWelsh,
        firstName: juror.juror_first_name,
        lastName: juror.juror_last_name,
        judge: juror.judge_name,
        exemptionPeriod: juror.period_of_exemption,
        signature: juror.signature,
      });
      juror.title = isWelsh ? 'GWASANAETH RHEITHGOR TYSTYSGRIF ESGUSODI' : 'JURY SERVICE CERTIFICATE OF EXEMPTION';
      juror.subTitle = juror.defendant;
      juror.hideDear = true;

      return juror;
    });

    return documents;
  }

  function urlBuilder(params) {
    var parameters = [];

    if (params.durationType) {
      parameters.push('durationType=' + params.durationType);
    }

    if (params.durationYears) {
      parameters.push('durationYears=' + params.durationYears);
    }

    return  '?' + parameters.join('&');
  }
})();
