precision highp float;

uniform sampler2D texture;
uniform float width;
uniform float height;
uniform float targetHue;

const float hueThreshold = 20.0;
const float svThreshold = 0.35;
const float erosionThreshold = 6.5;

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

float distanceInHsv(float fixedTargetHue, float fixedCurrentHue) {
    float diff = abs(fixedTargetHue - fixedCurrentHue);
    float weight = pow((hueThreshold - diff) / hueThreshold, 0.5);
    return weight;// in range <0;1>
}

float getPixelWeight(vec2 texCoords) {
    vec4 pixel = texture2D(texture, texCoords);
    vec3 hsv = rgb2hsv(pixel.rgb);

    // fix circular hue
    float fixedCurrentHue = hsv.x;
    float fixedTargetHue = targetHue;
    if (fixedTargetHue + hueThreshold > 360.0 && fixedCurrentHue < hueThreshold) fixedCurrentHue += 360.0;
    if (fixedTargetHue < hueThreshold && fixedCurrentHue + hueThreshold > 360.0) fixedTargetHue += 360.0;

    bool hueInRange = fixedCurrentHue > fixedTargetHue - hueThreshold && fixedCurrentHue < fixedTargetHue + hueThreshold;
    if (hueInRange && hsv.y > svThreshold && hsv.z > svThreshold) {
        return distanceInHsv(fixedTargetHue, fixedCurrentHue);
    } else {
        return 0.0;
    }
}

void readNeighborPixels(vec2 texCoords, inout float weights[8]) {
    float s = texCoords.s;
    float t = texCoords.t;

    weights[0] = getPixelWeight(vec2(s - 1.0 / width, t - 1.0 / height));// topLeft
    weights[1] = getPixelWeight(vec2(s, t - 1.0 / height));// topMiddle
    weights[2] = getPixelWeight(vec2(s + 1.0 / width, t - 1.0 / height));// topRight
    weights[3] = getPixelWeight(vec2(s - 1.0 / width, t));// middleLeft
    weights[4] = getPixelWeight(vec2(s + 1.0 / width, t));// middleRight
    weights[5] = getPixelWeight(vec2(s - 1.0 / width, t + 1.0 / height));// bottomLeft
    weights[6] = getPixelWeight(vec2(s, t + 1.0 / height));// bottomMiddle
    weights[7] = getPixelWeight(vec2(s + 1.0 / width, t + 1.0 / height));// bottomRight
}

float dilatation(vec2 texCoords) {
    float weights[8];
    readNeighborPixels(texCoords, weights);
    float sum = 0.0;
    float count = 0.0;
    for (int i = 0; i < 8; i++) {
        if (weights[i] != 0.0) {
            sum += weights[i];
            count++;
        }
    }
    return count == 0.0 ? 0.0 : sum / count;
}

float erosion(vec2 texCoords) {
    float weights[8];
    readNeighborPixels(texCoords, weights);
    float sum = 0.0;
    for (int i = 0; i < 8; i++) {
        sum += weights[i];
    }
    return sum;
}

void main(void) {
    float sum = 0.0;
    // rows are written in the second row (for each row there are 1280 pixels)
    if (int(gl_FragCoord.y) == 1) {
        for (float i = 0.5; i <= 1280.5; i++) {
            if (i > width) break;
            if (gl_FragCoord.x / height >= 1.0) discard;

            vec2 texCoords = vec2(i / width, gl_FragCoord.x / height);
            float weight = getPixelWeight(texCoords);

//            // do dilatation operation
//            if (weight == 0.0) {
//                weight = dilatation(texCoords);
//            }
            // do erosion operation
            if (weight != 0.0) {
                float sumE = erosion(texCoords);
                if (sumE < erosionThreshold) weight = 0.0;
            }

            sum += weight;
        }
    }
    // columns are written to first row (for each column there are 720 pixels)
    else if (int(gl_FragCoord.y) == 0) {
        for (float i = 0.5; i <= 720.5; i++) {
            if (i > height) break;
            if (gl_FragCoord.x / width >= 1.0) discard;

            vec2 texCoords = vec2(gl_FragCoord.x / width, i / height);
            float weight = getPixelWeight(texCoords);

//            // do dilatation operation
//            if (weight == 0.0) {
//                weight = dilatation(texCoords);
//            }
            // do erosion operation
            if (weight != 0.0) {
                float sumE = erosion(texCoords);
                if (sumE < erosionThreshold) weight = 0.0;
            }

            sum += weight;
        }
    } else {
        discard;
    }

    // save count (in the row or column); save coordinate that is later used to calculate weighted mean
    gl_FragColor = vec4(sum, gl_FragCoord.x + 0.5, 0, 0);
}
