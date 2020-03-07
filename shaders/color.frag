precision highp float;

uniform sampler2D texture;
uniform float width;
uniform float height;

// https://stackoverflow.com/questions/15095909/from-rgb-to-hsv-in-opengl-glsl
// https://en.wikipedia.org/wiki/HSL_and_HSV
vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    // all components are in the range <0;1>, including hue
    vec3 hsv = vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
    // convert hue to range <0;360>
    return vec3(hsv.x * 360.0, hsv.yz);
}

void main(void) {
    float rect = 100.0;
    float leftX = width / 2.0 - rect / 2.0;
    float topY = height / 2.0 - rect / 2.0;

    float x = leftX + gl_FragCoord.x * 10.0;
    float y = topY + gl_FragCoord.y * 10.0;
    float r = 0.0, g = 0.0, b = 0.0;

    for (float i = 0.0; i < 10.0; i++) {
        for (float j = 0.0; j < 10.0; j++) {
            vec4 color = texture2D(texture, vec2((i + x) / width, (j + y) / height));
            r += color.r;
            g += color.g;
            b += color.b;
        }
    }

    vec3 rgb = vec3(r / 100.0, g / 100.0, b / 100.0);
    vec3 hsv = rgb2hsv(rgb);
    gl_FragColor = vec4(hsv, 1.0);
}
