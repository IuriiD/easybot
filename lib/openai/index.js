const { Configuration, OpenAIApi } = require('openai');

const constants = require('../../helpers/constants');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_KEY,
});
const openai = new OpenAIApi(configuration);

const openaiComplete = async (prompt, maxTokens = 256, temperature = 0.7, removeNewLines = true) => {
  const completion = await openai.createCompletion({
    model: constants.MODEL_COMPLETIONS,
    prompt,
    max_tokens: maxTokens,
    temperature,
  });
  console.log('\n[openaiComplete] res: ', completion.data);
  const { text } = completion.data.choices[0];
  if (removeNewLines) {
    const textFormatted = text.replace(/(\r\n|\n|\r)/gm, '').replace(/(")/gm, '');
    console.log('\n[openaiComplete] textFormatted: ', textFormatted);
    return textFormatted;
  }
  console.log('\n[openaiComplete] text: ', text);
  return text;
};

const generateIntentName = async (question) => {
  console.log('\n[generateIntentName] starting with text: ', question);
  try {
    const prompt = `
        Summarize the following text in 3-5 words. Write them in lower case, joined with dashes, for example, "get-weather-forecast":

        ${question}
        `;
    const intentNameText = await openaiComplete(prompt, 40);
    return `${intentNameText}_${Date.now()}`;
  } catch (err) {
    console.log('\n[generateIntentName] err: ', err);
    return null;
  }
};

const retrievalWithAugmentation = async (question, context) => {
  try {
    if (!context) {
      return null;
    }

    const promptWithContext = `
    Answer the question based on the context below.

    Context:
    ${context}

    Question:
    ${question}
    `;
    const res = await openaiComplete(promptWithContext);
    return res.replace('Answer: ', '');
  } catch (err) {
    console.log('\n[retrievalWithAugmentation] err: ', err);
    return null;
  }
};

const openaiEmbed = async (text) => {
  console.log('\n[openaiEmbed] text: ', text);
  const res = await openai.createEmbedding({
    model: constants.MODEL_EMBEDDINGS,
    input: text,
  });
  console.log('\n[openaiEmbed] res: ', res.data);
  return res.data.data[0].embedding;
};

const generateAlternativeUtterances = async (utterance) => {
  console.log('\n[generateAlternativeUtterances] rephrasing the utterance: ', utterance);
  try {
    const prompt = `Rephrase the sentence "${utterance}" in 10 different ways:

        `;
    const alternativeUtterances = await openaiComplete(prompt, 256, 0.7, false);
    const lines = alternativeUtterances.split('\n');
    const utterances = lines.map((line) => {
      if (line) {
        // Remove the leading number ("1. What is the process for beginning a generator?")
        return line
          .trim()
          .split(' ')
          .slice(1)
          .join(' ');
      }
    });
    console.log('\n[generateAlternativeUtterances] resulting utterances: ', utterances);
    return utterances;
  } catch (err) {
    console.log('\n[generateAlternativeUtterances] err: ', err);
    return null;
  }
};

module.exports = {
  openaiEmbed,
  retrievalWithAugmentation,
  generateIntentName,
  generateAlternativeUtterances,
};
