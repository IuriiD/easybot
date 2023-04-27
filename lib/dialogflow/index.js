const Dialogflow = require('dialogflow');

const projectId = process.env.PROJECT_ID;

const dfCredentials = {
  projectId,
  credentials: {
    client_email: process.env.CLIENT_EMAIL,
    private_key: process.env.PRIVATE_KEY,
  },
};

const intentsClient = new Dialogflow.IntentsClient(dfCredentials);
const agentPath = intentsClient.projectAgentPath(projectId);

async function getIntent(intentPath) {
  const response = await intentsClient.getIntent({ name: intentPath, intentView: 'INTENT_VIEW_FULL' });
  if (response) return response[0];
  return false;
}

async function patchIntentApiCall(intent) {
  const request = {
    intent,
  };
  try {
    const response = intentsClient.updateIntent(request);
    return response;
  } catch (error) {
    return error;
  }
}

async function updateIntent2(intentPath, newTrainingPhrase) {
  const intent = await getIntent(intentPath);
  if (!intent) throw new Error(`Failed to find an intent with intentPath ${intentPath}`);

  const newTrainingPhraseObj = {
    parts: [
      {
        text: newTrainingPhrase,
      },
    ],
    type: 'EXAMPLE',
  };
  intent.trainingPhrases.push(newTrainingPhraseObj);

  const response = await intentsClient.updateIntent({ intent });
  return response;
}

async function updateIntent(intentPath, newTrainingPhrase) {
  let intent;
  try {
    console.log('intentPath=', intentPath);
    intent = await getIntent(intentPath);
  } catch (error) {
    throw new Error(error);
  }

  try {
    const newTrainingPhraseObj = {
      parts: [
        {
          text: newTrainingPhrase,
        },
      ],
      type: 'EXAMPLE',
    };
    console.log('\n\nOriginal intent');
    console.log(JSON.stringify(intent));
    intent.trainingPhrases.push(newTrainingPhraseObj);
    console.log('\n\nUpdated intent');
    console.log(JSON.stringify(intent));
  } catch (error) {
    throw new Error('Failed to compose updated training phrases object');
  }

  try {
    const response = await patchIntentApiCall(intent);
    return response;
  } catch (error) {
    throw new Error(error);
  }
}

// createIntent('test_test', ['where are you?'], ["I'm here"]).then((res) => console.log(res));
async function createIntent(displayName, trainingPhrasesParts, messageTexts) {
  const trainingPhrases = [];

  trainingPhrasesParts.forEach((trainingPhrasesPart) => {
    const part = {
      text: trainingPhrasesPart,
    };

    // Here we create a new training phrase for each provided part.
    const trainingPhrase = {
      type: 'EXAMPLE',
      parts: [part],
    };

    trainingPhrases.push(trainingPhrase);
  });

  const messageText = {
    text: messageTexts,
  };

  const message = {
    text: messageText,
  };

  const intent = {
    displayName,
    trainingPhrases,
    messages: [message],
    webhookState: 'WEBHOOK_STATE_ENABLED',
  };

  const createIntentRequest = {
    parent: agentPath,
    intent,
  };

  const response = await intentsClient.createIntent(createIntentRequest);
  return response;
}

module.exports = {
  createIntent,
  updateIntent,
  updateIntent2,
};
