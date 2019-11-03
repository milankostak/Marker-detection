attribute vec3 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat4 rotation;

varying vec2 textureCoord;

void main(void) {
	textureCoord = aTextureCoord;
	gl_Position = rotation * vec4(aVertexPosition, 1.0);
}
