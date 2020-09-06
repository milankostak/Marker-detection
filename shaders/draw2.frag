precision mediump float;

uniform float drawSquare; // 1 draw, 0 not
uniform float width;
uniform float height;
uniform float xCoord;
uniform float yCoord;

uniform sampler2D texture;

void main(void) {
	vec4 cameraColor = texture2D(texture, vec2(gl_FragCoord.x / width, gl_FragCoord.y / height));
	if (drawSquare == 0.0) {
		// draw two lines to point detected marker
		float red = (gl_FragCoord.x > xCoord - 4.0 && gl_FragCoord.x < xCoord + 4.0) ? 1.0 : 0.0;
		float green = (gl_FragCoord.y > yCoord - 4.0 && gl_FragCoord.y < yCoord + 4.0) ? 1.0 : 0.0;

		if ((red > 0.0 || green > 0.0) && xCoord > 0.0 && yCoord > 0.0) gl_FragColor = vec4(red, green, 0, 1);
		else gl_FragColor = cameraColor;
	} else {
		// draw square that is used to show marker for color detection
		float rect = 100.0;
		float rectW = 3.0;
		float leftX = width / 2.0 - rect / 2.0;
		float rightX = leftX + rect;
		float topY = height / 2.0 - rect / 2.0;
		float bottomY = topY + rect;

		bool leftLine = gl_FragCoord.x > leftX - rectW && gl_FragCoord.x < leftX + rectW && gl_FragCoord.y > topY && gl_FragCoord.y < bottomY;
		bool rightLine = gl_FragCoord.x > rightX - rectW && gl_FragCoord.x < rightX + rectW && gl_FragCoord.y > topY && gl_FragCoord.y < bottomY;
		bool bottomLine = gl_FragCoord.y > topY - rectW && gl_FragCoord.y < topY + rectW && gl_FragCoord.x > leftX && gl_FragCoord.x < rightX;
		bool topLine = gl_FragCoord.y > bottomY - rectW && gl_FragCoord.y < bottomY + rectW && gl_FragCoord.x > leftX && gl_FragCoord.x < rightX;
		if (leftLine || rightLine || topLine || bottomLine) {
			gl_FragColor = vec4(0.5, 0.5, 0, 1);
		} else {
			gl_FragColor = cameraColor;
		}
//		gl_FragColor = vec4(gl_FragCoord.x / width, 0, 0, 1);
	}
}
