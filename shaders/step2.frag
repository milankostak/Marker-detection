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
        // R is count of the given pixels (of the given color) in the row/column
        // G is the coordinate of the row/column
        if (pixel.r > 0.5) {
            sum += pixel.r;
            sumAll += pixel.g * pixel.r;
            count++;
        }
    }
    float coord = (sum == 0.0) ? 0.0 : sumAll / sum;

    // once for X axis, once for Y axis
    // sum = the number of all pixels of the given color
    // count = the number of row/columns with at least one pixel of the given color
    gl_FragColor = vec4(coord, sumAll, sum, count);
}
