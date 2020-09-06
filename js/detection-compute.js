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
 * @version 4.0
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
    // WebGL2RenderingContext
    let gl;
    // WebGL2ComputeRenderingContext
    let glCompute;
    // WebGLProgram
    let computeProgram1, computeProgram2, programDraw, programColor;
    // WebGLBuffer
    let vertexBuffer, indexBuffer;
    // WebGLTexture
    let cameraTexture, cameraTexture2, outputTexture;
    // WebGLFramebuffer
    let fbo;
    // numbers, input width and height
    let width, height;
    // color has to be detected before marker detection can be executed
    let detectedColor = false;
    // float, selected color that is supposed
    let targetHue;
    // marker coordinates
    let markerCoord = [0, 0];
    // Float32Array
    let readBufferColor;

    // time measurement variables
    const MEASURE_TIME = false;
    const FINISH_COUNT = 1000;
    let currentCount = 0, times = [];
    const timeSlots = 3;

    /**
     * Public initialization function. Sets all necessary variables.
     * @public
     * @return {boolean} true or false - the initialization was successful or not
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
        const canvasCompute = document.createElement("canvas");
        glCompute = canvasCompute.getContext("webgl2-compute", {antialias: false});

        canvas = document.querySelector("canvas");
        gl = canvas.getContext("webgl2", {antialias: false});

        // necessary extension for WebGL2
        const extColorBufferFloat = gl.getExtension("EXT_color_buffer_float");
        if (!extColorBufferFloat) {
            console.log("EXT_color_buffer_float is not supported");
            alert("Initialization was not successful. Your browser doesn't support all necessary WebGL2 extensions.");
            return false;
        }
        console.log("WebGL2 was initialized.");

        return true;
    }

    /**
     * Set basic GL parameters
     * @private
     */
    function initBasics() {
        gl.clearColor(0.1, 0.1, 0.1, 1);
        gl.clearDepth(1.0)
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

        // compute shader 1
        computeProgram1 = glCompute.createProgram();
        Utils.initComputeShader(glCompute, computeProgram1, "/shaders/compute1.comp");
        glCompute.linkProgram(computeProgram1);
        glCompute.useProgram(computeProgram1)

        computeProgram1.width = glCompute.getUniformLocation(computeProgram1, "width");
        computeProgram1.height = glCompute.getUniformLocation(computeProgram1, "height");
        computeProgram1.targetHue = glCompute.getUniformLocation(computeProgram1, "targetHue");

        // compute shader 2
        computeProgram2 = glCompute.createProgram();
        Utils.initComputeShader(glCompute, computeProgram2, "/shaders/compute2.comp");
        glCompute.linkProgram(computeProgram2);
        glCompute.useProgram(computeProgram2)

        computeProgram2.width = glCompute.getUniformLocation(computeProgram2, "width");
        computeProgram2.height = glCompute.getUniformLocation(computeProgram2, "height");

        // basic draw program, doesn't do anything special in shaders
        programDraw = gl.createProgram();
        Utils.initShaders(gl, programDraw, "/shaders/draw.vert", "/shaders/draw2.frag", true);
        gl.linkProgram(programDraw);
        gl.useProgram(programDraw);

        programDraw.vertexPositionAttribute = gl.getAttribLocation(programDraw, "aVertexPosition");
        programDraw.rotation = gl.getUniformLocation(programDraw, "rotation");
        programDraw.drawSquare = gl.getUniformLocation(programDraw, "drawSquare");
        programDraw.width = gl.getUniformLocation(programDraw, "width");
        programDraw.height = gl.getUniformLocation(programDraw, "height");
        programDraw.texture = gl.getUniformLocation(programDraw, "texture");
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

        cameraTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, cameraTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        cameraTexture2 = glCompute.createTexture();
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
                result += t[i].toFixed(3) + ", "
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
        glCompute.useProgram(computeProgram1);
        const input1 = new Float32Array(width + height);
        const ssbo1 = glCompute.createBuffer();
        glCompute.bindBuffer(glCompute.SHADER_STORAGE_BUFFER, ssbo1);
        glCompute.bufferData(glCompute.SHADER_STORAGE_BUFFER, input1, glCompute.DYNAMIC_COPY);
        glCompute.bindBufferBase(glCompute.SHADER_STORAGE_BUFFER, 0, ssbo1);

        glCompute.activeTexture(glCompute.TEXTURE0);
        glCompute.bindTexture(glCompute.TEXTURE_2D, cameraTexture2);
        glCompute.texStorage2D(glCompute.TEXTURE_2D, 1, glCompute.RGBA32F, width, height);
        glCompute.bindImageTexture(1, cameraTexture2, 0, false, 0, glCompute.READ_WRITE, glCompute.RGBA32F);

        glCompute.uniform1ui(computeProgram1.width, width);
        glCompute.uniform1ui(computeProgram1.height, height);
        glCompute.uniform1f(computeProgram1.targetHue, targetHue);

        glCompute.dispatchCompute(width + height, 1, 1);
        if (MEASURE_TIME) window.performance.mark("a");

        // glCompute.memoryBarrier(glCompute.SHADER_STORAGE_BARRIER_BIT);
        // const result1 = new Float32Array(width + height);
        // glCompute.getBufferSubData(glCompute.SHADER_STORAGE_BUFFER, 0, result1);
        // console.log(`output: [${result1}]`);

    ///
    /// 2. step: find marker
    ///
        glCompute.useProgram(computeProgram2);
        glCompute.bindBufferBase(glCompute.SHADER_STORAGE_BUFFER, 0, ssbo1);

        const input2 = new Float32Array(8);
        const ssbo2 = glCompute.createBuffer();
        glCompute.bindBuffer(glCompute.SHADER_STORAGE_BUFFER, ssbo2);
        glCompute.bufferData(glCompute.SHADER_STORAGE_BUFFER, input2, glCompute.DYNAMIC_COPY);
        glCompute.bindBufferBase(glCompute.SHADER_STORAGE_BUFFER, 1, ssbo2);

        glCompute.uniform1ui(computeProgram2.width, width);
        glCompute.uniform1ui(computeProgram2.height, height);

        glCompute.dispatchCompute(2, 1, 1);
        if (MEASURE_TIME) window.performance.mark("a");

        glCompute.memoryBarrier(glCompute.SHADER_STORAGE_BARRIER_BIT);
        const result2 = new Float32Array(8);
        glCompute.getBufferSubData(glCompute.SHADER_STORAGE_BUFFER, 0, result2);
        // console.log(`output: [${result2}]`);
        if (MEASURE_TIME) window.performance.mark("a");

        markerCoord = [result2[0], result2[4]]

    ///
    ///  3. step: optionally draw result
    ///
        // draw the output from previous draw cycle into canvas
        renderSimple(runDetection);

    ///
    /// 4. step: save time if turned on
    ///
        if (MEASURE_TIME) {
            let times2 = performance.getEntriesByName("a");
            for (let i = 0; i < timeSlots; i++) {
                times[i].push(times2[i + 1].startTime - times2[i].startTime);
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
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, 10, 10, 0, gl.RGBA, gl.FLOAT, null);

        gl.viewport(0, 0, 10, 10);

        // draw to outputTexture
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, outputTexture, 0);

        // bind input texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, cameraTexture);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawElements(gl.TRIANGLES, indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

        // 1. read data
        gl.readPixels(0, 0, 10, 10, gl.RGBA, gl.FLOAT, readBufferColor);
        // console.log(readBufferColor);
        const hue = new Float32Array(100);
        let saturation = new Float32Array(100);
        let value = new Float32Array(100);
        for (let i = 0, j = 0; i < 400; i += 4, j++) {
            hue[j] = readBufferColor[i];
            saturation[j] = readBufferColor[i + 1];
            value[j] = readBufferColor[i + 2];
        }

        // 2. process hue
        // https://en.wikipedia.org/wiki/Mean_of_circular_quantities
        let sumSin = 0;
        let sumCos = 0;
        hue.forEach(val => {
            sumSin += Math.sin(Utils.toRadians(val));
            sumCos += Math.cos(Utils.toRadians(val));
        });
        // https://en.wikipedia.org/wiki/Talk%3AMean_of_circular_quantities#Don't_need_to_divide_by_n
        let atan = Utils.toDegrees(Math.atan2(sumSin, sumCos));
        if (atan < 0) atan += 360;
        targetHue = atan;
        detectedColor = true;

        // 3. process saturation and value (only to inform user)
        // sort for median purpose
        saturation = saturation.sort();
        value = value.sort();

        // 4. print/debug
        const hsv = [targetHue, saturation[50] * 100, value[50] * 100];
        console.log(hsv);
        const hsl = hsvToHsl(hsv);

        const stringCssHsl = "hsl(" + Math.round(hsl[0]) + ", " + Math.round(hsl[1]) + "%, " + Math.round(hsl[2]) + "%)";
        const stringHsv = "HSV " + Math.round(hsv[0]) + ", " + Math.round(hsv[1]) + "%, " + Math.round(hsv[2]) + "%";

        document.querySelector("#color").style.backgroundColor = stringCssHsl;
        document.querySelector("#color_text").textContent = stringHsv;
        document.querySelector("label#reset").classList.remove("hidden");
    }

    /**
     * Converts HSV to HSL color model.
     * https://stackoverflow.com/questions/3423214/convert-hsb-hsv-color-to-hsl/17668371#17668371
     * @param {(number)[]} hsv three values array
     * @returns {(number)[]}
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

        gl.uniform1f(programDraw.xCoord, markerCoord[0]);
        gl.uniform1f(programDraw.yCoord, markerCoord[1]);

        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(programDraw.texture, 0);
        gl.bindTexture(gl.TEXTURE_2D, cameraTexture);

        gl.viewport(0, 0, width, height);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawElements(gl.TRIANGLES, indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }

    Detection.getDetectedCoordinates = () => {
        return markerCoord;
    };

    /**
     * Update cameraTexture from video feed or image
     * @public
     */
    Detection.updateTexture = (source) => {
        glCompute.activeTexture(glCompute.TEXTURE0);
        glCompute.bindTexture(glCompute.TEXTURE_2D, cameraTexture2);
        glCompute.pixelStorei(glCompute.UNPACK_FLIP_Y_WEBGL, true);
        glCompute.texSubImage2D(glCompute.TEXTURE_2D, 0, 0, 0, width, height, glCompute.RGBA, glCompute.FLOAT, source);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, cameraTexture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        // Firefox warning: Failed to hit GPU-copy fast-path. Falling back to CPU upload.
        // https://bugzilla.mozilla.org/show_bug.cgi?id=1246410
        // https://bugzilla.mozilla.org/show_bug.cgi?id=1322746
        // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, source);
    };

    /**
     * Set external color, usually for testing purpose.
     * Uncomment readData2() !!
     * @param {number} hue
     */
    Detection.setExternalColor = (hue) => {
        targetHue = hue;
        detectedColor = true;
    };

    /**
     * Restart of detection
     */
    Detection.restart = () => {
        detectedColor = false;
    };

    // export Detection object
    return Detection;
})();
