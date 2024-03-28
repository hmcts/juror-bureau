module.exports = {
  trialPayloadBuilder: function (body) {
    const payload = {};

    payload.trialNumber = body.trialNumber;
    payload.trialType = body.trialType;
    payload.parties = body.trialType === 'criminal' ? body.defendants : body.respondents;
    payload.startDate = body.startDate;
    payload.judge = body.judge;
    payload.court = body.court;
    payload.courtroom = body.courtroom;
    payload.protected = body.protected;
    payload._csrf = body._csrf;
    payload.active = true;

    return payload;
  },
};
