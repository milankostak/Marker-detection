precision highp float;

uniform sampler2D texture;
uniform float width;
uniform float height;

void main(void) {
	float sum = 0.0;
	float sumAll = 0.0;
	float count = 0.0;
	for (float i = 0.5; i <= 1280.5; i++) {
		if (i > max(width, height)) break;
		vec2 texCoords = vec2(i / max(width, height), gl_FragCoord.y / 2.0);
		vec4 pixel = texture2D(texture, texCoords);
		if (pixel.r > 0.5) {
			sum += pixel.r;
			sumAll += pixel.g;
			count++;
		}
	}
	float coord = (sum == 0.0) ? 0.0 : sumAll / sum;

	gl_FragColor = vec4(coord, sumAll, sum, count);
}
