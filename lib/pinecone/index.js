/* eslint-disable no-restricted-syntax */
// I struggled with the official Pinecone package for JS, and ended with using direct requests with axios
// The official package @pinecone-database/pinecone is for TS and node 18 (this bot-autogeneration project 
// was initially written on vanilla JS and I needed time to install 18 [it's not simply nvm install 18])
// Tried https://www.npmjs.com/package/pinecone-client but also with workarounds

const { encode, decode } = require('gpt-3-encoder');
const axios = require('axios');
const { openaiEmbed } = require('../openai');

const constants = require('../../helpers/constants');

const { PINECONE_ENVIRONMENT, PINECONE_API_KEY, PINECONE_INDEX_NAME } = process.env;

const getContexts = async (text, topK = 5, includeValues = true) => {
  try {
    const vectorsArr = await openaiEmbed(text);
    console.log('\n[getContexts] generated vector: ', vectorsArr.slice(0, 5));

    // Magic strings - the URL needs to be checked in Pinecone console
    const url = `https://${PINECONE_INDEX_NAME}-49a87c0.svc.${PINECONE_ENVIRONMENT}.pinecone.io/query`;
    const headers = {
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': PINECONE_API_KEY,
      },
    };
    const body = {
      vector: vectorsArr,
      topK,
      includeMetadata: true,
      includeValues,
      namespace: '',
    };
    const { data: { matches } = {} } = await axios.post(url, body, headers);

    let contextsCombined = '';
    for (const match of matches) {
      if (match.score >= constants.PINECONE_RELEVANCE_THRESHOLD) {
        contextsCombined += match.metadata.text;
      }
    }

    const tokens = encode(contextsCombined);
    const tokensLimited = tokens.slice(0, constants.MAX_CONTEXT_TOKENS);
    const context = decode(tokensLimited);
    console.log('\n[getContexts] got contexts: ', context.slice(0, 100));
    return context;
  } catch (err) {
    console.log('[getContexts] err: ', err);
    return null;
  }
};

module.exports = {
  getContexts,
};
