"use strict";

const PORT = 3000;

const express = require('express');
const bodyParser = require('body-parser');
const serveStatic = require('serve-static');

// const fs = require('fs');
// const https = require('https');
// const privateKey = fs.readFileSync('key.key', 'utf8');
// const certificate = fs.readFileSync('cert.crt', 'utf8');
// const credentials = {key: privateKey, cert: certificate};

const app = express()
    .use(serveStatic(__dirname, {'controller': false}))
    .use(serveStatic(__dirname, {'controller-compute': false}))
    .use(bodyParser.json({limit: '5mb'}));

// https.createServer(credentials, app).listen(
// 	PORT, () => console.log(`App HTTPS server is running.\nPort number: ${PORT}`)
// );
app.listen(
    PORT, () => console.log(`App HTTP server is running.\nPort number: ${PORT}`)
);
