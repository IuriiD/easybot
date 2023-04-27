require('dotenv-extended').load();
const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ extended: true }));

app.use(routes);

const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Application starts on port ${port}`);
});
