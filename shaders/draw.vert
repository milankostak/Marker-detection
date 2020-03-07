attribute vec3 aVertexPosition;

uniform mat4 rotation;

void main(void) {
    gl_Position = rotation * vec4(aVertexPosition, 1.0);
}
