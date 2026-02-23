(() => {
  'use strict';

  const _ = require('lodash');
  const { validate } = require('validate.js');
  const { localAuthorityInfoDAO, editLocalauthorityNotesDAO } = require('../../../../objects/electoral-register');
  const validator = require('../../../../config/validation/electoral-register');

  module.exports.getEditNotes = (app) => async (req, res) => {
    const { laCode } = req.params;

    const tmpErrors = _.clone(req.session.errors);
    const tmpBody = _.clone(req.session.formFields);
    delete req.session.errors;
    delete req.session.formFields;

    let localAuthorityInfo;
    try {
      localAuthorityInfo = await localAuthorityInfoDAO.get(req, laCode);
      app.logger.info('Fetched local authority information for editing notes', {
        auth: req.session.authentication,
        laCode
      })
    } catch (err) {
      app.logger.crit('Error fetching local authority information for editing notes', {
        auth: req.session.authentication,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });
    }

    return res.render('electoral-register/edit-notes.njk', {
      localAuthorityInfo,
      cancelUrl: app.namedRoutes.build('electoral-register.local-authority.get', { laCode }),
      tmpBody,
      errors: {
        title: 'Please check the form',
        count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
        items: tmpErrors,
      },
    });
  };

  module.exports.postEditNotes = (app) => async (req, res) => {
    const { laCode } = req.params;

    const validatorResult = validate(req.body, validator.editNotes());

    if (typeof validatorResult !== 'undefined') {
      req.session.errors = validatorResult;
      req.session.formFields = req.body;
      return res.redirect(app.namedRoutes.build('electoral-register.local-authority.edit-notes.get', { laCode }));
    }

    const payload = {
      laCode,
      notes: req.body.notes,
    }

    try {
      await editLocalauthorityNotesDAO.put(req, payload);
      
      app.logger.info('Edited local authority notes', {
        auth: req.session.authentication,
        laCode,
      });
    } catch (err) {
      app.logger.crit('Error editing local authority notes', {
        auth: req.session.authentication,
        body: payload,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      return res.render('_errors/generic', { err });
    }

    return res.redirect(app.namedRoutes.build('electoral-register.local-authority.get', { laCode }));
  };

})();
