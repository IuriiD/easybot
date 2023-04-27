const express = require('express');

const router = express.Router();
const dfWebhook = require('./dfWebhook');

router.get('/health', (req, res) => {
  res.status(200).send('OK');
});

router.use(dfWebhook);

module.exports = router;
