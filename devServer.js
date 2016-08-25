/**
 * Server just used to serve our static front-end for local development.
 * (Previously I was just doing `python -m SimpleHTTPServer` but once 
 * I moved the static files under `public`, this became annoying).
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
