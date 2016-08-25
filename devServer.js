/**
 * Server just used to serve our static front-end for local development.
 */

'use strict';

const express = require('express');
const PORT = process.env.PORT || 8000;

let app = express();

app.use('/', express.static('public') );

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.use((req, res) => {
  res.status(404).send('Page not found');
});

app.listen(PORT);

console.log('Dev server started', PORT);
