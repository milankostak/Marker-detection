"use strict";

/**
 * Detection object holds all necessary functions for detecting location of marker
 * It is assigned by its inner anonymous self-invoking function. By using this approach some variables and functions can remain private.
 *
 * @public
 * @requires transforms.js
 * @requires webgl-utils.js
 * @type {Object}
 * @author Milan Košťák
 * @version 3.0 alpha
 */
const Detection = (() => {

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
	let program3, program4, programDraw, programColor;
	// WebGLBuffer
	let vertexBuffer, indexBuffer;
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
	// color has to be detected before marker detection can be executed
	let detectedColor = false;
	// Float32Array, color that is supposed to be detected with its variance
	let targetColor, targetVariance;
	// Float32Array
	let readBuffer, readBuffer2, readBufferColor;
	// time measurement variables
	const MEASURE_TIME = false, MEASURE_GPU = false;
	const FINISH_COUNT = 1000;
	let currentCount = 0, times = [];
	const timeSlots = 3;

	let timerQueryExt, timerQuery;
	let queryRead = true;

	/**
	 * Public initialization function. Sets all necessary variables.
	 * @public
	 * @return {boolean} true or false if the initialization was successful
	 */
	Detection.init = () => {
		if (!initWebGL()) return false;
		initBasics();
		initPrograms();
		initFB();
		initTextures();
		initBuffers();
		if (MEASURE_TIME) initTimeMeasurement();
		return true;
	};

	/**
	 * Init canvas and gl and get texture precision from extension
	 * @private
	 */
	function initWebGL() {
		canvas = document.querySelector("canvas");
		gl = canvas.getContext("webgl2", {antialias: false});

		// if WebGL2 is not supported try to fall-back to version 1
		if (!gl) {
			gl = canvas.getContext("experimental-webgl", {antialias: false});

			// even WebGL1 is not supported - not much to do without it
			if (!gl) {
				alert("Initialization of WebGL was not successful. Your browser probably doesn't support it.");
				return false;
			}

			// extension that is necessary for loading or reading float data to or from GPU when using WebGL1
			let floatExtension = gl.getExtension("OES_texture_float");
			if (!floatExtension) {
				// if float is not available then at least half_float
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
			const extColorBufferFloat = gl.getExtension("EXT_color_buffer_float");
			if (!extColorBufferFloat) {
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
		// program that detects color of a marker
		programColor = gl.createProgram();
		Utils.initShaders(gl, programColor, "/shaders/main.vert", "/shaders/color.frag", true);
		gl.linkProgram(programColor);
		gl.useProgram(programColor);

		programColor.vertexPositionAttribute = gl.getAttribLocation(programColor, "aVertexPosition");
		programColor.width = gl.getUniformLocation(programColor, "width");
		programColor.height = gl.getUniformLocation(programColor, "height");
		programColor.texture = gl.getUniformLocation(programColor, "texture");


		program3 = gl.createProgram();
		Utils.initShaders(gl, program3, "/shaders/main.vert", "/shaders/step1.frag", true);
		gl.linkProgram(program3);
		gl.useProgram(program3);

		program3.vertexPositionAttribute = gl.getAttribLocation(program3, "aVertexPosition");
		program3.texture = gl.getUniformLocation(program3, "texture");
		program3.width = gl.getUniformLocation(program3, "width");
		program3.height = gl.getUniformLocation(program3, "height");
		program3.targetColor = gl.getUniformLocation(program3, "targetColor");
		program3.targetVariance = gl.getUniformLocation(program3, "targetVariance");


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
		programDraw.rotation = gl.getUniformLocation(programDraw, "rotation");
		programDraw.drawSquare = gl.getUniformLocation(programDraw, "drawSquare");
		programDraw.width = gl.getUniformLocation(programDraw, "width");
		programDraw.height = gl.getUniformLocation(programDraw, "height");
		programDraw.texture = gl.getUniformLocation(programDraw, "texture");
		programDraw.coordTexture = gl.getUniformLocation(programDraw, "coordTexture");
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
	}

	/**
	 * Generate time slots
	 * @private
	 */
	function initTimeMeasurement() {
		for (let i = 0; i < timeSlots; i++) {
			times[i] = [];
		}
	}

	/**
	 * Set all things that need to know the dimension of source video.
	 * Function is called when this information is available.
	 * @public
	 * @param  {Number} videoWidth  width of the source video
	 * @param  {Number} videoHeight height of the source video
	 */
	Detection.setupAfterVideoStreamIsReady = (videoWidth, videoHeight) => {
		width = canvas.width = videoWidth;
		height = canvas.height = videoHeight;

		// allocate readBuffer for reading pixels
		// do it now, because it is a time consuming operation
		let arraySize = Math.max(width, height) * 4 * 2; // 4 = RGBA, 2 rows
		readBuffer = new Float32Array(arraySize);
		readBuffer2 = new Float32Array(2 * 4); // 2 pixels
		readBufferColor = new Float32Array(10 * 10 * 4); // 10×10 grid, RGBA
	};

	/**
	 * Main function
	 * @param runDetection if false then only show video, if true then run color or marker detection
	 * @public
	 */
	Detection.repaint = (runDetection) => {
		if (!runDetection) {
			renderSimple(false);
			return;
		}

		if (!detectedColor) {
			detectColor();
			renderSimple(false);
			return;
		}

		if (MEASURE_TIME && ++currentCount === FINISH_COUNT) {
			let t = [];

			for (let i = 0; i < timeSlots; i++) {
				t.push(times[i].reduce((a, b) => (a + b)) / times[i].length);
			}
			let result = "";
			for (let i = 0; i < timeSlots; i++) {
				result += t[i].toFixed(2) + ", "
			}

			console.log(result);
			// alert(result);

			currentCount = 0;
			initTimeMeasurement();
		}

		if (MEASURE_TIME) {
			window.performance.clearMarks();
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
		// noinspection JSSuspiciousNameCombination
		gl.uniform1f(program3.height, height);

		gl.uniform3fv(program3.targetColor, targetColor);
		gl.uniform3fv(program3.targetVariance, targetVariance);

		gl.bindTexture(gl.TEXTURE_2D, outputTexture);
		// target, level, internalFormat, width, height, border, format, type, ArrayBufferView? pixels)
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
				// console.log("timeElapsed ", timeElapsed);
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
		// readData();
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
		// noinspection JSSuspiciousNameCombination
		gl.uniform1f(program4.height, height);

		gl.bindTexture(gl.TEXTURE_2D, outputTexture2);
		// target, level, internalFormat, width, height, border, format, type, ArrayBufferView? pixels)
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
	// 	readData2();

	///
	///  4. step: optionally draw result
	///
		// draw the output from previous draw cycle into canvas
		renderSimple(runDetection);

	///
	/// 5. step: save time if turned on
	///
		if (MEASURE_TIME) {
			let times2 = performance.getEntriesByName("a");

			for (let i = 0; i < timeSlots; i++) {
				times[i].push(times2[i+1].startTime - times2[i].startTime);
			}
		}
	};

	function detectColor() {
		gl.useProgram(programColor);

		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		gl.vertexAttribPointer(programColor.vertexPositionAttribute, vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(programColor.vertexPositionAttribute);

		// bind framebuffer
		gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

		gl.uniform1f(programColor.width, width);
		// noinspection JSSuspiciousNameCombination
		gl.uniform1f(programColor.height, height);

		gl.bindTexture(gl.TEXTURE_2D, outputTexture);
		// target, level, internalFormat, width, height, border, format, type, ArrayBufferView? pixels)
		gl.texImage2D(gl.TEXTURE_2D, 0, internalFormatTexture, 10, 10, 0, gl.RGBA, texturePrecision, null);

		gl.viewport(0, 0, 10, 10);

		// draw to outputTexture
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, outputTexture, 0);

		// bind input texture
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, cameraTexture);

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.drawElements(gl.TRIANGLES, indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

		gl.readPixels(0, 0, 10, 10, gl.RGBA, gl.FLOAT, readBufferColor);
		// console.log(readBufferColor);

		const sum = [0, 0, 0];
		const min = [readBufferColor[0], readBufferColor[1], readBufferColor[2]];
		const max = [readBufferColor[0], readBufferColor[1], readBufferColor[2]];
		for (let i = 0; i < 400; i += 4) {
			for (let j = 0; j < 3; j++) {
				let value = readBufferColor[i + j];
				if (value > max[j]) max[j] = value;
				if (value < max[j]) max[j] = value;
				sum[j] += value;
			}
		}

		// subtract extreme values
		for (let j = 0; j < 3; j++) {
			sum[j] -= min[j];
			sum[j] -= max[j];
			sum[j] /= 98;
		}
		const meanHue = sum[0];
		const meanSaturation = sum[1];
		const meanValue = sum[2];
		console.log(meanHue, meanSaturation, meanValue);

		// calculate variance
		const sumOfDiffs = [0, 0, 0];
		const mean = [meanHue, meanSaturation, meanValue];
		for (let i = 0; i < 400; i += 4) {
			for (let j = 0; j < 3; j++) {
				let value = readBufferColor[i + j];
				sumOfDiffs[j] += Math.pow(value - mean[j], 2);
			}
		}
		// subtract extreme values
		for (let j = 0; j < 3; j++) {
			sumOfDiffs[j] -= Math.pow(max[j] - mean[j], 2);
			sumOfDiffs[j] -= Math.pow(min[j] - mean[j], 2);
			sumOfDiffs[j] /= 98;
			// sumOfDiffs[j] = Math.sqrt(sumOfDiffs[j]);
		}
		const varianceHue = sumOfDiffs[0];
		const varianceSaturation = sumOfDiffs[1];
		const varianceValue = sumOfDiffs[2];
		console.log(varianceHue, varianceSaturation, varianceValue);

		if (meanHue !== 0) {
			detectedColor = true;
			targetColor = Float32Array.from(mean);
			targetVariance = Float32Array.from([varianceHue, varianceSaturation, varianceValue]);

			const hsl = hsvToHsl([meanHue, meanSaturation * 100, meanValue * 100]);
			const string = "hsl(" + Math.round(hsl[0]) + ", " + Math.round(hsl[1]) + "%, " + Math.round(hsl[2]) + "%)";
			document.querySelector("#color").style.backgroundColor = string;
			document.querySelector("#color_text").textContent = string;
			document.querySelector("label#reset").classList.remove("hidden");
		}
	}

	/**
	 * Converts HSV to HSL color model.
	 * https://stackoverflow.com/questions/3423214/convert-hsb-hsv-color-to-hsl/17668371#17668371
	 */
	function hsvToHsl(hsv) {
		// determine the lightness in the range [0, 100]
		const l = (2 - hsv[1] / 100) * hsv[2] / 2;
		// [0, 360]
		const h = hsv[0];
		// [0, 100]
		let s = hsv[1] * hsv[2] / (l < 50 ? l * 2 : 200 - l * 2);
		// correct a division-by-zero error
		if (isNaN(s)) s = 0;
		return [h, s, l];
	}

	/**
	 * Render only camera texture with coordinates of found marker
	 * @private
	 */
	function renderSimple(runDetection) {
		gl.useProgram(programDraw);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		gl.vertexAttribPointer(programDraw.vertexPositionAttribute, vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(programDraw.vertexPositionAttribute);

		gl.uniformMatrix4fv(programDraw.rotation, false, Utils.convert(new Mat4RotX(Math.PI)));
		gl.uniform1f(programDraw.drawSquare, detectedColor || runDetection ? 0.0 : 1.0);
		gl.uniform1f(programDraw.width, width);
		// noinspection JSSuspiciousNameCombination
		gl.uniform1f(programDraw.height, height);

		gl.activeTexture(gl.TEXTURE0);
		gl.uniform1i(programDraw.texture, 0);
		gl.bindTexture(gl.TEXTURE_2D, cameraTexture);

		gl.activeTexture(gl.TEXTURE1);
		gl.uniform1i(programDraw.coordTexture, 1);
		gl.bindTexture(gl.TEXTURE_2D, outputTexture2);

		gl.viewport(0, 0, width, height);

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.drawElements(gl.TRIANGLES, indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
	}

	/**
	 * Read output data from frame buffer after first step.
	 * Can be used for debugging purpose otherwise it is useless, because second step is doing the same but faster.
	 */
	function readData() {
		const realWidth = Math.max(width, height);
		// https://stackoverflow.com/questions/28282935/working-around-webgl-readpixels-being-slow
		gl.readPixels(0, 0, realWidth, 2, gl.RGBA, gl.FLOAT, readBuffer);
		// console.log(readBuffer);
		if (MEASURE_TIME) window.performance.mark("a");

		let sumRow = 0, sumRowAll = 0;
		for (let i = realWidth * 4; i < realWidth * 4 + height * 4; i += 4) { // every 1st pixel in each row and each pixel has four values (RGBA)
			let value = readBuffer[i];
			if (value > 0.5) {
				sumRow += value;
				sumRowAll += readBuffer[i + 1];
			}
		}
		const yCoord = sumRowAll / sumRow;

		let sumCol = 0, sumColAll = 0;
		for (let i = 0; i < width * 4; i += 4) { // every pixel in the 1st row and each pixel has four values (RGBA)
			let value = readBuffer[i];
			if (value > 0.5) {
				sumCol += value;
				sumColAll += readBuffer[i + 1];
			}
		}
		const xCoord = sumColAll / sumCol;

		console.log(xCoord, sumColAll, sumCol, "xCoord, col");
		console.log(yCoord, sumRowAll, sumRow, "yCoord, row");
	}

	/**
	 * Read output data from frame buffer after second step.
	 * Can be used to obtain resulting coordinates which can be send over the network somewhere else.
	 */
	function readData2() {
		gl.readPixels(0, 0, 1, 2, gl.RGBA, gl.FLOAT, readBuffer2);
		// console.log(readBuffer2);
		if (MEASURE_TIME) window.performance.mark("a");
	}

	Detection.getReadBuffer2 = () => {
		return readBuffer2;
	};

	/**
	 * Update cameraTexture from video feed or image
	 * @public
	 */
	Detection.updateTexture = (source) => {
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, cameraTexture);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

		// Firefox warning: Failed to hit GPU-copy fast-path. Falling back to CPU upload.
		// https://bugzilla.mozilla.org/show_bug.cgi?id=1246410
		// https://bugzilla.mozilla.org/show_bug.cgi?id=1322746
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
	};

	Detection.restart = function() {
		detectedColor = false;
	};

	Detection.finish = function() {

	};

	// export Detection object
	return Detection;
})();
