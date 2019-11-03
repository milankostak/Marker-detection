precision mediump float;

uniform sampler2D texture;
uniform sampler2D coordTexture;

varying vec2 textureCoord;

void main(void) {
	float xCoord = texture2D(coordTexture, vec2(0.5, 0.25)).r;
	float yCoord = texture2D(coordTexture, vec2(0.5, 0.75)).r;
	//gl_FragColor = vec4(xCoord, yCoord, 0, 1);

	float red = (gl_FragCoord.x > xCoord - 4.0 && gl_FragCoord.x < xCoord + 4.0) ? 1.0 : 0.0;
	float green = (gl_FragCoord.y > yCoord - 4.0 && gl_FragCoord.y < yCoord + 4.0) ? 1.0 : 0.0;

	if ((red > 0.0 || green > 0.0) && xCoord > 0.0 && yCoord > 0.0) gl_FragColor = vec4(red, green, 0, 1);
	else gl_FragColor = texture2D(texture, textureCoord);
}
