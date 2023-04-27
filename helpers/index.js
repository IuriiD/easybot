function createIntentName(firstTrainingPhrase) {
  const trainingPhraseReplaced = firstTrainingPhrase.replace(/\s/g, '_');
  const strLength = trainingPhraseReplaced.length;
  let strFixedLength = '';
  if (strLength > 20) {
    strFixedLength = trainingPhraseReplaced.substring(0, 21);
  } else {
    const filler = '_'.repeat(20 - strLength);
    strFixedLength = `${trainingPhraseReplaced}${filler}`;
  }
  return `${strFixedLength}_${Date.now()}`;
}

function getSession(conv) {
  const { session } = conv.body;
  const sessionIdArr = session.split('/');
  return sessionIdArr[sessionIdArr.length - 1];
}

function getIntentUUID(conv) {
  const { intent } = conv.body.queryResult;
  const intentPathArr = intent.name.split('/');
  return intentPathArr[intentPathArr.length - 1];
}

module.exports = {
  createIntentName,
  getSession,
  getIntentUUID,
};
