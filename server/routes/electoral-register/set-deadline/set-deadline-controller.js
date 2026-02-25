(() => {
  "use strict";

  const { validate } = require("validate.js");
  const _ = require("lodash");
  const { dateFilter } = require("../../../components/filters");
  const { erDeadlineDAO } = require("../../../objects/electoral-register");
  const validator = require("../../../config/validation/electoral-register.js");

  module.exports.getSetDeadline = (app) => (req, res) => {
    const tmpErrors = _.clone(req.session.errors);
    const tmpBody = _.clone(req.session.formFields);
    delete req.session.errors;
    delete req.session.formFields;

    const today = new Date();
    let tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    return res.render("electoral-register/set-deadline", {
      pageTitle: "Set deadline",
      postUrl: app.namedRoutes.build("electoral-register.set-deadline.post"),
      minDate: dateFilter(tomorrow, null, "DD/MM/YYYY"),
      cancelUrl: app.namedRoutes.build("electoral-register.get"),
      tmpBody,
      errors: {
        title: "Please check the form",
        count:
          typeof tmpErrors !== "undefined" ? Object.keys(tmpErrors).length : 0,
        items: tmpErrors,
      },
    });
  };

  module.exports.postSetDeadline = (app) => async (req, res, next) => {
    const { setDeadline } = req.body;
    const validatorResult = validate(req.body, validator.setDeadlineDate());

    if (typeof validatorResult !== "undefined") {
      req.session.errors = validatorResult;
      req.session.formFields = req.body;
      return res.redirect(
        app.namedRoutes.build("electoral-register.set-deadline.get"),
      );
    }

    const deadlineDate = dateFilter(setDeadline, "DD/MM/YYYY", "YYYY-MM-DD");

    const payloadCamel = { deadlineDate };

    try {
      await erDeadlineDAO.put(req, payloadCamel);
    } catch (err) {
      app.logger.crit("Error setting deadline", {
        auth: req.session.authentication,
        error: typeof err.error !== "undefined" ? err.error : err.toString(),
      });
      return res.render("_errors/generic", { err });
    }

    req.session.bannerMessage = "Deadline updated.";
    return res.redirect(app.namedRoutes.build("electoral-register.get"));
  };
})();
