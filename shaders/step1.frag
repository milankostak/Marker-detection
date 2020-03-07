precision highp float;

uniform sampler2D texture;
uniform float width;
uniform float height;

const float threshold = 20.0;

//const vec3 targetColor = vec3(120, 1, 1);
uniform vec3 targetColor;// in HSV
uniform vec3 targetVariance;

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

float distanceInHsv(vec3 target, vec3 current) {
    float diff = abs(target.x - current.x);
    float weight = pow((threshold - diff) / threshold, 0.5);
    return weight;// in range <0;1>
}

float getPixelWeight(vec2 texCoords) {
    vec4 pixel = texture2D(texture, texCoords);
    vec3 hsv = rgb2hsv(pixel.rgb);
    bool hueInRange = hsv.x > targetColor.x - threshold && hsv.x < targetColor.x + threshold;
    bool saturationInRange = hsv.y > targetColor.y - 0.1 && hsv.y < targetColor.y + 0.1;
    bool valueInRange = hsv.z > targetColor.z - 0.1 && hsv.z < targetColor.z + 0.1;
    if (hueInRange && saturationInRange && valueInRange) {
        return distanceInHsv(targetColor, hsv);;
    } else {
        return 0.0;
    }
}

void main(void) {
    float sum = 0.0;
    // rows are written in the second row (for each row there are 1280 pixels)
    if (int(gl_FragCoord.y) == 1) {
        for (float i = 0.5; i <= 1280.5; i++) {
            if (i > width) break;
            if (gl_FragCoord.x / height >= 1.0) discard;

            // one pixel to the top
            vec2 texCoordsNeighbor1 = vec2(i / width, (gl_FragCoord.x - 1.0) / height);
            float weightN1 = getPixelWeight(texCoordsNeighbor1);

            // one pixel to the bottom
            vec2 texCoordsNeighbor2 = vec2(i / width, (gl_FragCoord.x + 1.0) / height);
            float weightN2 = getPixelWeight(texCoordsNeighbor2);

            vec2 texCoords = vec2(i / width, gl_FragCoord.x / height);
            float weight = getPixelWeight(texCoords);

            float finalWeight;
            if (weightN1 == 0.0 && weightN2 == 0.0) {
                finalWeight = 0.0;// ignore solitary pixels
            } else {
                finalWeight = (weightN1 + weightN2 + weight) / 3.0;
            }

            sum += finalWeight;
        }
        // columns are written to first row (for each column there are 720 pixels)
    } else if (int(gl_FragCoord.y) == 0) {
        for (float i = 0.5; i <= 720.5; i++) {
            if (i > height) break;
            if (gl_FragCoord.x / width >= 1.0) discard;

            // one pixel to the left
            vec2 texCoordsNeighbor1 = vec2((gl_FragCoord.x - 1.0) / width, i / height);
            float weightN1 = getPixelWeight(texCoordsNeighbor1);

            // one pixel to the right
            vec2 texCoordsNeighbor2 = vec2((gl_FragCoord.x + 1.0) / width, i / height);
            float weightN2 = getPixelWeight(texCoordsNeighbor2);

            vec2 texCoords = vec2(gl_FragCoord.x / width, i / height);
            float weight = getPixelWeight(texCoords);

            float finalWeight;
            if (weightN1 == 0.0 && weightN2 == 0.0) {
                finalWeight = 0.0;// ignore solitary pixels
            } else {
                finalWeight = (weightN1 + weightN2 + weight) / 3.0;
            }

            sum += finalWeight;
        }
    } else {
        discard;
    }

    // save count (in the row or column); save weight - sum  * coord (used later)
    gl_FragColor = vec4(sum, gl_FragCoord.x + 0.5, 0, 0);
}
