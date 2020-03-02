precision highp float;

uniform sampler2D texture;
uniform float width;
uniform float height;

const float thresholdG = 0.6;
const float thresholdRB = 0.4;

int interestingPixel(vec2 texCoords) {
	vec4 pixel = texture2D(texture, texCoords);
	if (pixel.r < thresholdRB && pixel.g > thresholdG && pixel.b < thresholdRB) { // classic green
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
