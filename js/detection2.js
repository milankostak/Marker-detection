"use strict";

/**
 * Detection object holds all necessary functions for detecting location of marker
 * It is assigned by its inner anonymous self-invoking function. By using this approach some variables and functions can remain private.
 *
 * @public
 * @requires transforms.js
 * @requires webgl-utils.js
 * // @requires sender.js
 * @type {Object}
 * @author Milan Košťák
 * @version 2.0
 */
const Detection = (function() {

	/**
	 * Main object which is exported into public Detection variable.
	 * @public
	 * @type {Object}
	 */
	const Detection = {};

	// HTMLCanvasElement
	let canvas;
	// WebGLRenderingContext or WebGL2RenderingContext
	let gl;
	// WebGLProgram
	let program3, program4, programDraw;
	// WebGLBuffer
	let vertexBuffer, indexBuffer, textureBuffer;
	// WebGLTexture
	let cameraTexture, outputTexture, outputTexture2;
	// WebGLFramebuffer
	let fbo;
	// precision of reading from texture, either FLOAT or HALF_FLOAT_OES
	let texturePrecision;
	// format of texture depending on the version of WebGL that is used, either RGBA or RGBA32F
	let internalFormatTexture;
	// numbers, input width and height
	let width, height;
	// Float32Array
	let readBuffer, readBuffer2;
	// sequence of marker location
	let positionSequence = 0;
	// id of interval
	let markerFoundCheckInterval;
	// number, check every 50 ms if marker is lost
	const markerFoundCheckIntervalTime = 50;
	// boolean, if it remains false for 50ms then it means marker was lost
	let dataSent = true;
	// time measurement variables
	const MEASURE_TIME = false, MEASURE_GPU = false;
	const FINISH_COUNT = 1000;
	let currentCount = 0, times = []
	const timeSlots = 3;

	let timerQueryExt, timerQuery;
	let queryRead = true;

	/**
	 * Public initialization function. Sets all necessary variables.
	 * @public
	 * @return {boolean} true or false if the initialization was successful
	 */
	Detection.init = function() {
		if (!initWebGL()) return false;
		initBasics();
		initPrograms();
		initFB();
		initTextures();
		initBuffers();
		if (MEASURE_TIME) initTimeMeasurement();
		
		/*let img = new Image();
		img.src = "integral1.png";
		img.onload = function () {
			setupAfterLoad(img);
			refreshTexture(img);
			Detection.repaint();
		};*/

		return true;
	};
/*
	function setupAfterLoad(img) {
		width = canvas.width = img.width;
		height = canvas.height = img.height;

		let arraySize = Math.max(width, height) * 4 * 2; // 4 = RGBA, 2 rows
		readBuffer = new Float32Array(arraySize);
		readBuffer2 = new Float32Array(2 * 4);
	}

	function refreshTexture(img) {
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, cameraTexture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	}
*/
	/**
	 * Init canvas and gl and get texture precision from extension
	 * @private
	 */
	function initWebGL() {
		canvas = document.querySelector("canvas");
		gl = canvas.getContext("webgl2", {antialias:false});

		// if WebGL2 is not supported try to fall-back to version 1
		if (!gl) {
			gl = canvas.getContext("experimental-webgl", {antialias:false});

			// even WebGL1 is not supported - not much to do without it
			if (!gl) {
				alert("Initialization of WebGL was not successful. Your browser probably doesn't support it.");
				return false;
			}

			// extension that is necessary for loading or reading float data to or from GPU when using WebGL1
			let floatExtension = gl.getExtension("OES_texture_float");
			if (!floatExtension) {
				floatExtension = gl.getExtension("OES_texture_half_float");
				if (!floatExtension) {
					console.log("OES_texture_float nor OES_texture_half_float are supported.");
					alert("Initialization was not successful. Your browser doesn't support all necessary WebGL1 extensions.");
					return false;
				}
				texturePrecision = floatExtension.HALF_FLOAT_OES;
				console.log("Using OES_texture_half_float");
			} else {
				texturePrecision = gl.FLOAT;
				console.log("Using OES_texture_float");
			}
			internalFormatTexture = gl.RGBA;
			console.log("WebGL1 was initialized.");

			if (MEASURE_GPU) timerQueryExt = gl.getExtension('EXT_disjoint_timer_query');
		} else {
			// necessary extension for WebGL2
			const exten = gl.getExtension("EXT_color_buffer_float");
			if (!exten) {
				console.log("EXT_color_buffer_float is not supported");
				alert("Initialization was not successful. Your browser doesn't support all necessary WebGL2 extensions.");
				return false;
			}
			internalFormatTexture = gl.RGBA32F;
			texturePrecision = gl.FLOAT;
			console.log("WebGL2 was initialized.");

			// https://www.khronos.org/registry/webgl/extensions/EXT_disjoint_timer_query_webgl2/
			if (MEASURE_GPU) timerQueryExt = gl.getExtension('EXT_disjoint_timer_query_webgl2');
		}
		if (MEASURE_GPU && !timerQueryExt) console.log("Timer query extension is not supported.");
		return true;
	}

	/**
	 * Set basic GL parameters
	 * @private
	 */
	function initBasics() {
		gl.clearColor(0.1, 0.1, 0.1, 1);
		gl.clearDepth(1.0);
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);
	}

	/**
	 * Init WebGL programs
	 * @private
	 */
	function initPrograms() {
		program3 = gl.createProgram();
		Utils.initShaders(gl, program3, "/shaders/main.vert", "/shaders/step1.frag", true);
		gl.linkProgram(program3);
		gl.useProgram(program3);

		program3.vertexPositionAttribute = gl.getAttribLocation(program3, "aVertexPosition");
		program3.texture = gl.getUniformLocation(program3, "texture");
		program3.width = gl.getUniformLocation(program3, "width");
		program3.height = gl.getUniformLocation(program3, "height");

		program4 = gl.createProgram();
		Utils.initShaders(gl, program4, "/shaders/main.vert", "/shaders/step2.frag", true);
		gl.linkProgram(program4);
		gl.useProgram(program4);

		program4.vertexPositionAttribute = gl.getAttribLocation(program4, "aVertexPosition");
		program4.texture = gl.getUniformLocation(program4, "texture");
		program4.width = gl.getUniformLocation(program4, "width");
		program4.height = gl.getUniformLocation(program4, "height");

		// basic draw program, doesn't do anything special in shaders
		programDraw = gl.createProgram();
		Utils.initShaders(gl, programDraw, "/shaders/draw.vert", "/shaders/draw.frag", true);
		gl.linkProgram(programDraw);
		gl.useProgram(programDraw);

		programDraw.vertexPositionAttribute = gl.getAttribLocation(programDraw, "aVertexPosition");
		programDraw.vertexTexCoordAttribute = gl.getAttribLocation(programDraw, "aTextureCoord");
		programDraw.rotation = gl.getUniformLocation(programDraw, "rotation");
		programDraw.texture = gl.getUniformLocation(programDraw, "texture");
		programDraw.coordTexture = gl.getUniformLocation(programDraw, "coordTexture");
		programDraw.xCoord = gl.getUniformLocation(programDraw, "xCoord");
		programDraw.yCoord = gl.getUniformLocation(programDraw, "yCoord");
	}

	/**
	 * Init WebGL frame buffer
	 * @private
	 */
	function initFB() {
		fbo = gl.createFramebuffer();
	}

	/**
	 * Init all WebGL textures
	 * @private
	 */
	function initTextures() {
		outputTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, outputTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		outputTexture2 = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, outputTexture2);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		cameraTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, cameraTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	}

	/**
	 * Prepare data for drawing (basic face)
	 * @private
	 */
	function initBuffers() {
		let scene = new Utils.Scene();
		scene.add(new Utils.Face(1, 1, 0, 0, 0, {strip: false}));

		vertexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(scene.vertices), gl.STATIC_DRAW);
		vertexBuffer.itemSize = 3;
		vertexBuffer.numItems = scene.vertices.length;

		indexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(scene.indices), gl.STATIC_DRAW);
		indexBuffer.itemSize = 1;
		indexBuffer.numItems = scene.indices.length;

		textureBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(scene.textureCoords), gl.STATIC_DRAW);
		textureBuffer.itemSize = 2;
		textureBuffer.numItems = scene.textureCoords.length;
	}

	function initTimeMeasurement() {
		for (var i = 0; i < timeSlots; i++) {
			times[i] = [];
		}
	}

	/**
	 * Set all things that need to know the dimension of source video.
	 * Function is called when this information is available.
	 * @public
	 * @param  {Number} videoWidth  width of source video
	 * @param  {Number} videoHeight height of source video
	 */
	Detection.setupAfterVideoStreamIsReady = function(videoWidth, videoHeight) {
		width = canvas.width = videoWidth;
		height = canvas.height = videoHeight;

		//Sender.add({type: "setup", width: width, height: height});

		// allocate readBuffer for reading pixels
		// do it now, because it is time consuming operation
		let arraySize = Math.max(width, height) * 4 * 2; // 4 = RGBA, 2 rows
		readBuffer = new Float32Array(arraySize);
		readBuffer2 = new Float32Array(2 * 4); // 2 pixels
	};

	/**
	 * Main function
	 * Runs the key algorithm
	 * @public
	 */
	Detection.repaint = function() {

		if (MEASURE_TIME && ++currentCount === FINISH_COUNT) {
			let t = [];

			for (var i = 0; i < timeSlots; i++) {
				t.push(times[i].reduce((a, b) => (a + b)) / times[i].length);
			}
			let result = "";
			for (var i = 0; i < timeSlots; i++) {
				result += t[i].toFixed(2) + ", "
			}

			console.log(result);
			//alert(result);

			currentCount = 0;
			initTimeMeasurement();
		}

		if (MEASURE_TIME) {
			window.performance.clearMarks()
			window.performance.mark("a");
		}
	///
	/// 1. step: sum all interesting pixels in every row and column
	///
		gl.useProgram(program3);
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		gl.vertexAttribPointer(program3.vertexPositionAttribute, vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(program3.vertexPositionAttribute);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

		// bind framebuffer
		gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

		gl.uniform1f(program3.width, width);
		gl.uniform1f(program3.height, height);

		gl.bindTexture(gl.TEXTURE_2D, outputTexture);
		// target, level, internalformat, width, height, border, format, type, ArrayBufferView? pixels)
		gl.texImage2D(gl.TEXTURE_2D, 0, internalFormatTexture, Math.max(width, height), 2, 0, gl.RGBA, texturePrecision, null);

		gl.viewport(0, 0, Math.max(width, height), 2);

		// draw to outputTexture
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, outputTexture, 0);

		// bind input texture
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, cameraTexture);

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		if (MEASURE_GPU && timerQuery) {
			let available = (gl instanceof WebGLRenderingContext) ?
				timerQueryExt.getQueryObjectEXT(timerQuery, timerQueryExt.QUERY_RESULT_AVAILABLE_EXT) :
				gl.getQueryParameter(timerQuery, gl.QUERY_RESULT_AVAILABLE);
			let disjoint = gl.getParameter(timerQueryExt.GPU_DISJOINT_EXT);

			if (available && !disjoint) {
				let timeElapsed = (gl instanceof WebGLRenderingContext) ?
					timerQueryExt.getQueryObjectEXT(timerQuery, timerQueryExt.QUERY_RESULT_EXT) :
					gl.getQueryParameter(timerQuery, gl.QUERY_RESULT);
				//console.log("timeElapsed ", timeElapsed);
				times.push(timeElapsed);
				currentCount++;
				if (currentCount > FINISH_COUNT) {
					console.log(times.reduce((a, b) => (a + b)) / times.length);
					times = [];
					currentCount = 0;
				}
				queryRead = true;
			} else {
				console.log("not available");
			}
		}
		if (MEASURE_GPU && queryRead) {
			timerQuery = (gl instanceof WebGLRenderingContext) ?
				timerQueryExt.createQueryEXT() :
				gl.createQuery();

			if (gl instanceof WebGLRenderingContext) timerQueryExt.beginQueryEXT(timerQueryExt.TIME_ELAPSED_EXT, timerQuery);
			else gl.beginQuery(timerQueryExt.TIME_ELAPSED_EXT, timerQuery);
		}
		gl.drawElements(gl.TRIANGLES, indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
		if (MEASURE_GPU && queryRead) {
			if (gl instanceof WebGLRenderingContext) timerQueryExt.endQueryEXT(timerQueryExt.TIME_ELAPSED_EXT);
			else gl.endQuery(timerQueryExt.TIME_ELAPSED_EXT);
		}

		if (MEASURE_TIME) window.performance.mark("a");
		//readData();
	///
	/// 2. step: find marker
	///
		gl.useProgram(program4);
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		gl.vertexAttribPointer(program4.vertexPositionAttribute, vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(program4.vertexPositionAttribute);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

		// bind framebuffer
		gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

		gl.uniform1f(program4.width, width);
		gl.uniform1f(program4.height, height);

		gl.bindTexture(gl.TEXTURE_2D, outputTexture2);
		// target, level, internalformat, width, height, border, format, type, ArrayBufferView? pixels)
		gl.texImage2D(gl.TEXTURE_2D, 0, internalFormatTexture, 1, 2, 0, gl.RGBA, texturePrecision, null);

		gl.viewport(0, 0, 1, 2);

		// draw to outputTexture2
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, outputTexture2, 0);

		// bind input texture
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, outputTexture);

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.drawElements(gl.TRIANGLES, indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

		if (MEASURE_TIME) window.performance.mark("a");
	///
	/// 3. step: read data
	///
		//readData2();

	///
	//  4. step: optionally draw result
	///
		// draw the output from previous draw cycle into canvas
		gl.useProgram(programDraw);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		gl.vertexAttribPointer(programDraw.vertexPositionAttribute, vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(programDraw.vertexPositionAttribute);

		gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
		gl.vertexAttribPointer(programDraw.vertexTexCoordAttribute, textureBuffer.itemSize, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(programDraw.vertexTexCoordAttribute);

		gl.uniformMatrix4fv(programDraw.rotation, false, Utils.convert(new Mat4RotX(Math.PI)));

		gl.activeTexture(gl.TEXTURE0);
		gl.uniform1i(programDraw.texture, 0);
		gl.bindTexture(gl.TEXTURE_2D, cameraTexture);

		gl.activeTexture(gl.TEXTURE1);
		gl.uniform1i(programDraw.coordTexture, 1);
		gl.bindTexture(gl.TEXTURE_2D, outputTexture2);

		gl.viewport(0, 0, width, height);

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.drawElements(gl.TRIANGLES, indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

	///
	/// 5. step: save time if turned on
	///
		if (MEASURE_TIME) {
			let times2 = performance.getEntriesByName("a");

			for (var i = 0; i < timeSlots; i++) {
				times[i].push(times2[i+1].startTime - times2[i].startTime);
			}
		}
	};

	var xCoord, yCoord;

	/**
	 * Read output data from frame buffer after first step.
	 * Can be used for debugging purpose otherwise it is useless, because second step is doing the same but faster.
	 */
	function readData() {
		const realWidth = Math.max(width, height);
		// https://stackoverflow.com/questions/28282935/working-around-webgl-readpixels-being-slow
		gl.readPixels(0, 0, realWidth, 2, gl.RGBA, gl.FLOAT, readBuffer);
		//console.log(readBuffer);
		if (MEASURE_TIME) window.performance.mark("a");

		let sumRow = 0, sumRowAll = 0;
		for (let i = realWidth * 4; i < realWidth * 4 + height * 4; i += 4) { // every 1st pixel in each row and each pixel has four values (RGBA)
			let value = readBuffer[i];
			if (value > 0.5) {
				sumRow += value;
				sumRowAll += readBuffer[i + 1];
			}
		}
		yCoord = sumRowAll / sumRow;

		let sumCol = 0, sumColAll = 0;
		for (let i = 0; i < width * 4; i += 4) { // every pixel in the 1st row and each pixel has four values (RGBA)
			let value = readBuffer[i];
			if (value > 0.5) {
				sumCol += value;
				sumColAll += readBuffer[i + 1];
			}
		}
		xCoord = sumColAll / sumCol;

		console.log(xCoord, sumColAll, sumCol, "xCoord, col");
		console.log(yCoord, sumRowAll, sumRow, "yCoord, row");
	}

	/**
	 * Read output data from frame buffer after second step.
	 * Can be used to obtain resulting coordinates which can be send over the netwrk somewhere else.
	 */
	function readData2() {
		gl.readPixels(0, 0, 1, 2, gl.RGBA, gl.FLOAT, readBuffer2);
		//console.log(readBuffer2);
		if (MEASURE_TIME) window.performance.mark("a");

		send({max: 100, x: readBuffer2[4], y: readBuffer2[0], count: 1});
	}

	/**
	 * Update cameraTexture from video feed
	 */
	Detection.updateTexture = function(video) {
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, cameraTexture);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

		// Firefox warning: Failed to hit GPU-copy fast-path. Falling back to CPU upload.
		// https://bugzilla.mozilla.org/show_bug.cgi?id=1246410
		// https://bugzilla.mozilla.org/show_bug.cgi?id=1322746
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
	};

	/**
	 * Reset sequence variable and set interval for sending position.
	 * @public
	 */
	Detection.restart = function() {
		// restart the sequence so the receiver can also restart the relative position
		positionSequence = 0;
		markerFoundCheckInterval = setInterval(checkIfMarkerFound, markerFoundCheckIntervalTime);
	};

	/**
	 * Clear sending interval and try to send any possible remaining data
	 * @public
	 */
	Detection.finish = function() {
		clearInterval(markerFoundCheckInterval);
		let obj = {
			type: "marker",
			time: new Date().getTime(),
			sequence: -1
		};
		//Sender.add(obj)
	};

	/**
	 * Create object and put it into queue for sending
	 * @private
	 * @param  {Object} obj2 information about marker
	 */
	function send(obj2) {
		let obj = {
			type: "marker",
			time: new Date().getTime(),
			sequence: ++positionSequence,
			max: obj2.max,
			x: obj2.x,
			y: obj2.y,
			count: obj2.count
		};
		//Sender.add(obj);
		dataSent = true;
	}

	/**
	 * Function for sending found marker position to the server
	 * @private
	 */
	function checkIfMarkerFound() {
		if (!dataSent) {
			let obj = {
				type: "marker",
				time: new Date().getTime(),
				sequence: ++positionSequence,
				max: 0,
				x: 0,
				y: 0,
				count: 0
			};
			//Sender.add(obj)
		}
		dataSent = false;
	}

	// export Detection object
	return Detection;
})();
