precision highp float;

uniform sampler2D texture;
uniform float width;
uniform float height;

const float thresholdG = 0.6;
const float thresholdRB = 0.4;

// https://stackoverflow.com/questions/15095909/from-rgb-to-hsv-in-opengl-glsl
// all components are in the range [0-1], including hue.
vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

int interestingPixel(vec2 texCoords) {
	vec4 pixel = texture2D(texture, texCoords);
	vec3 hsv = rgb2hsv(pixel.rgb);
	if (hsv.r * 360.0 > 100.0 && hsv.r * 360.0 < 140.0 && hsv.g > 0.5 && hsv.b > 0.5) {
//	if (pixel.r < thresholdRB && pixel.g > thresholdG && pixel.b < thresholdRB) { // classic green
	//if (pixel.r > 0.5) { // red
	//if (pixel.r > 0.15 && pixel.r < 0.3 && pixel.g > 0.15 && pixel.g < 0.3 && pixel.b > 0.4 && pixel.b < 0.65) { // blue pen
	//if (pixel.r > 0.4 && pixel.r < 0.8 && pixel.g > 0.1 && pixel.g < 0.5 && pixel.b < 0.4) { // orange
		return 1;
	} else {
		return 0;
	}
}

void main(void) {
	int sum = 0;
	// rows are written in the second row (for each row there are 1280 pixels)
	if (int(gl_FragCoord.y) == 1) {
		for (float i = 0.5; i <= 1280.5; i++) {
			if (i > width) break;
			if (gl_FragCoord.x / height >= 1.0) discard;
			vec2 texCoords = vec2(i / width, gl_FragCoord.x / height);
			if (interestingPixel(texCoords) == 1) {
				sum++;
			}
		}
	// columns are written to first row (for each column there are 720 pixels)
	} else if (int(gl_FragCoord.y) == 0) {
		for (float i = 0.5; i <= 720.5; i++) {
			if (i > height) break;
			if (gl_FragCoord.x / width >= 1.0) discard;
			vec2 texCoords = vec2(gl_FragCoord.x / width, i / height);
			if (interestingPixel(texCoords) == 1) {
				sum++;
			}
		}
	} else {
		discard;
	}

	gl_FragColor = vec4(sum, float(sum) * (gl_FragCoord.x + 0.5), 0, 0);
}
