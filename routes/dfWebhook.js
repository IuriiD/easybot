const express = require('express');
const ga = require('actions-on-google');
const df = require('../lib/dialogflow');
const helpers = require('../helpers');
const { retrievalWithAugmentation, generateIntentName, generateAlternativeUtterances } = require('../lib/openai');
const { getContexts } = require('../lib/pinecone');

const router = express.Router();

const gaApp = ga.dialogflow({
  debug: false,
  clientId: process.env.CLIENT_ID,
});

router.post('/webhook', gaApp);

gaApp
  .fallback(async (conv) => {
    const { intent } = conv;
    console.log('\nIntent was triggered: ', intent);

    // We are starting with Default Fallback intent only
    // All user inputs that fall into this intent are processed and
    // new intents are created if relevant contexts are found.
    // We are also checking the relevance score with which any intent besides
    // Default Fallback was hit, and expand those intents with new training phrases

    switch (intent) {
      case 'Default Fallback Intent': {
        const userInput = conv.query;
        console.log('\n[Default Fallback handler] user input: ', userInput);

        const intentName = (await generateIntentName(userInput)) || helpers.createIntentName(userInput);
        console.log('\n[Default Fallback handler] intentName: ', intentName);

        const contexts = await getContexts(userInput);
        console.log('\n[Default Fallback handler] contexts: ', contexts);
        if (!contexts) {
          console.log('\n[Default Fallback handler] no contexts found, returning default fallback response');
          conv.ask(conv.body.queryResult.fulfillmentText);
        }

        const aiResp = await retrievalWithAugmentation(userInput, contexts);
        if (!aiResp) {
          console.log('\n[Default Fallback handler] received null aiResp, returning default fallback response');
          conv.ask(conv.body.queryResult.fulfillmentText);
        }

        const alternativeUtterances = await generateAlternativeUtterances(userInput);
        let trainingPhrases = [userInput];
        if (alternativeUtterances) {
          trainingPhrases = [...trainingPhrases, ...alternativeUtterances];
        }

        const intentAdded = await df.createIntent(intentName, trainingPhrases, [aiResp]);
        console.log('\n[Default Fallback handler] intentAdded: ', JSON.stringify(intentAdded));

        return conv.ask(aiResp);
      }

      default: {
        return conv.ask(conv.body.queryResult.fulfillmentText);
      }
    }
  })
  .catch((conv, error) => {
    console.log(error);
    return conv.ask('Ups, something went wrong... Please try again');
  });

module.exports = router;
