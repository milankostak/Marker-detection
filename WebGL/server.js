"use strict";

/**
 * Port on which the app is running
 * @type {number}
 */
const PORT = process.env.PORT || 3000;

/**
 * Connected clients
 * @type {Array}
 */
const wsClients = [];

const WebSocket = require('ws');
const express = require('express');
const bodyParser = require('body-parser');
const serveStatic = require('serve-static');

//const fs = require('fs');
//const https = require('https');
//const privateKey  = fs.readFileSync('key2.key', 'utf8');
//const certificate = fs.readFileSync('cert.crt', 'utf8');

const app = express();
// setup server with all important resources and listeners for ajax calls
const server = app
	.use(serveStatic(__dirname, {'alphabet': false}))
	.use(serveStatic(__dirname, {'controller': false}))
	.use(serveStatic(__dirname, {'maze': false}))
	.use(serveStatic(__dirname, {'pong': false}))
	.use(bodyParser.json({limit: '5mb'}))
	.post('/ajax/data', receiveData)
	.post('/ajax/picture', receivePicture)
	.listen(PORT, () => console.log(`App server is running.\nPort number: ${ PORT }`));

//const credentials = {key: privateKey, cert: certificate};
//const httpsServer = https.createServer(credentials, app).listen(3043);

const wsServer = new WebSocket.Server({ server });
console.log("WS: server is running.");

wsServer.on('connection', (ws) => {
	wsClients.push(ws);
	var host = ws.upgradeReq.headers.host;

	console.log("WS: client connected from ", host);
	console.log("WS: number of clients: ", wsClients.length);

	// receive a message from a client
	ws.on('message', (message) => {
		console.log('WS: received message from client %s: %s', host, message);
	});

	// event for closing, remove closing client from an array of active clients
	ws.on('close', (message) => {
		console.log("WS: client closing ", host);
		let index = wsClients.indexOf(ws);
		if (index > -1) {
			wsClients.splice(index, 1);
		}
		console.log("WS: number of clients: ", wsClients.length);
	});
});

/**
 * Receive general JSON data and forward to all connected clients
 * @param  {object} req request object
 * @param  {object} res response object
 */
function receiveData(req, res) {
	res.sendStatus(200);
	// console.log(req.body);
	// code for time measurement
	/*let data = req.body;
	for (let i = 0; i < data.length; i++) {
		let d = data[i];
		if (d.type === "test") {
			console.log(new Date().getTime()-d.time);
		}
	}*/
	forwardToClients(req.body);
}

/**
 * Receive image data and forward to all connected clients
 * @param  {object} req request object
 * @param  {object} res response object
 */
function receivePicture(req, res) {
	res.sendStatus(200);
	//console.log(req.body.dataUrl.substr(0, 50));
	forwardToClients(req.body);
}

/**
 * Method forwards given data to all connected clients
 * @param  {object} body JSON data
 */
function forwardToClients(body) {
	var data = JSON.stringify(body);

	wsClients.forEach((client) => {
		client.send(data);
	});
}
