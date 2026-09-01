export const VERT = `#version 300 es
layout(location = 0) in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

export const SIM_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uState;
uniform vec2 uTexel;
uniform float uDamping;
uniform float uSpread;
uniform vec2 uDrop;
uniform float uAmp;
uniform float uRadius;
in vec2 vUv;
out vec4 fragColor;

void main() {
  vec2 c = texture(uState, vUv).rg;
  float h = c.r;
  float v = c.g;
  float n = texture(uState, vUv + vec2(0.0, uTexel.y)).r;
  float s = texture(uState, vUv - vec2(0.0, uTexel.y)).r;
  float e = texture(uState, vUv + vec2(uTexel.x, 0.0)).r;
  float w = texture(uState, vUv - vec2(uTexel.x, 0.0)).r;
  float lap = n + s + e + w - 4.0 * h;
  v += lap * uSpread;
  v *= uDamping;
  h += v;
  h *= 0.996;
  if (uAmp > 0.0 && uRadius > 0.0) {
    vec2 d = (vUv - uDrop) * vec2(1.0, uTexel.x / max(uTexel.y, 1e-6));
    float r = length(d) / uRadius;
    h += uAmp * exp(-r * r * 4.5);
  }
  fragColor = vec4(h, v, 0.0, 1.0);
}
`;

export const DISPLAY_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uState;
uniform sampler2D uImage;
uniform sampler2D uGlyphs;
uniform vec2 uResolution;
uniform vec2 uTexel;
uniform float uHasImage;
uniform vec2 uImageSize;
uniform float uDither;
uniform int uStyle;
uniform int uAscii;
uniform int uMap;
uniform float uWaves;
in vec2 vUv;
out vec4 fragColor;

float lum(vec3 c) {
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

float ign(vec2 p) {
  return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}

float bayer8(vec2 p) {
  ivec2 i = ivec2(mod(floor(p), 8.0));
  int idx = i.x + i.y * 8;
  int m = 0;
  if (idx == 0) m = 0; else if (idx == 1) m = 32; else if (idx == 2) m = 8; else if (idx == 3) m = 40;
  else if (idx == 4) m = 2; else if (idx == 5) m = 34; else if (idx == 6) m = 10; else if (idx == 7) m = 42;
  else if (idx == 8) m = 48; else if (idx == 9) m = 16; else if (idx == 10) m = 56; else if (idx == 11) m = 24;
  else if (idx == 12) m = 50; else if (idx == 13) m = 18; else if (idx == 14) m = 58; else if (idx == 15) m = 26;
  else if (idx == 16) m = 12; else if (idx == 17) m = 44; else if (idx == 18) m = 4; else if (idx == 19) m = 36;
  else if (idx == 20) m = 14; else if (idx == 21) m = 46; else if (idx == 22) m = 6; else if (idx == 23) m = 38;
  else if (idx == 24) m = 60; else if (idx == 25) m = 28; else if (idx == 26) m = 52; else if (idx == 27) m = 20;
  else if (idx == 28) m = 62; else if (idx == 29) m = 30; else if (idx == 30) m = 54; else m = 22;
  return float(m) / 64.0;
}

vec3 ramp3(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  t = clamp(t, 0.0, 1.0);
  if (t < 0.33) return mix(a, b, t / 0.33);
  if (t < 0.66) return mix(b, c, (t - 0.33) / 0.33);
  return mix(c, d, (t - 0.66) / 0.34);
}

vec3 colormap(float t) {
  if (uMap == 1) return ramp3(t, vec3(0.04), vec3(0.23, 0.25, 0.28), vec3(0.77, 0.80, 0.83), vec3(0.96));
  if (uMap == 2) return ramp3(t, vec3(0.08, 0.03, 0.02), vec3(0.48, 0.16, 0.06), vec3(0.88, 0.48, 0.16), vec3(0.96, 0.89, 0.72));
  if (uMap == 3) return ramp3(t, vec3(0.02, 0.06, 0.09), vec3(0.11, 0.31, 0.47), vec3(0.49, 0.72, 0.84), vec3(0.93, 0.96, 0.98));
  if (uMap == 4) return ramp3(t, vec3(0.05), vec3(0.24, 0.27, 0.31), vec3(0.73, 0.75, 0.78), vec3(0.95, 0.95, 0.93));
  return ramp3(t, vec3(0.016, 0.06, 0.09), vec3(0.04, 0.24, 0.29), vec3(0.17, 0.70, 0.76), vec3(0.89, 0.97, 0.97));
}

vec2 coverUv(vec2 uv) {
  float ia = uImageSize.x / max(uImageSize.y, 1.0);
  float va = uResolution.x / max(uResolution.y, 1.0);
  vec2 s = ia > va ? vec2(va / ia, 1.0) : vec2(1.0, ia / va);
  return (uv - 0.5) * s + 0.5;
}

float sampleAtlas(int id, vec2 uv) {
  float i = clamp(float(id), 0.0, 31.0);
  vec2 a = vec2((i + clamp(uv.x, 0.001, 0.999)) / 32.0, clamp(uv.y, 0.001, 0.999));
  return texture(uGlyphs, a).r;
}

vec2 glyphCell(float amt) {
  float s = mix(17.0, 10.0, clamp(amt, 0.0, 1.0));
  float aspect = uAscii == 2 ? 0.52 : 0.62;
  return vec2(s * aspect, s);
}

vec3 asciiColor(vec3 col, float bit) {
  vec3 paper = col * 0.16 + vec3(0.01, 0.02, 0.025);
  vec3 ink = col * 1.08 + vec3(0.08);
  return mix(paper, ink, bit);
}

vec3 applyDither(vec3 col, vec2 p, float amt) {
  if (amt < 0.01) return col;
  float t = lum(col);
  if (uStyle == 5) {
    vec2 gc = glyphCell(amt);
    vec2 guv = (fract(p / gc) - 0.5) * 1.1 + 0.5;
    vec2 cuv = (floor(p / gc) + 0.5) * gc / uResolution;
    vec2 stepv = gc / uResolution;
    float h = texture(uState, cuv).r;
    float hL = texture(uState, cuv - vec2(stepv.x, 0.0)).r;
    float hR = texture(uState, cuv + vec2(stepv.x, 0.0)).r;
    float hD = texture(uState, cuv - vec2(0.0, stepv.y)).r;
    float hU = texture(uState, cuv + vec2(0.0, stepv.y)).r;
    vec3 plate = col;
    if (uHasImage > 0.5) plate = texture(uImage, coverUv(cuv)).rgb;
    float L = lum(uHasImage > 0.5 ? plate : col);
    L = clamp(L + h * 0.22, 0.0, 1.0);
    int id = 0;
    if (uAscii == 2) {
      vec2 g = vec2(hR - hL, hU - hD);
      if (uHasImage > 0.5) {
        float pL = lum(texture(uImage, coverUv(cuv - vec2(stepv.x, 0.0))).rgb);
        float pR = lum(texture(uImage, coverUv(cuv + vec2(stepv.x, 0.0))).rgb);
        float pD = lum(texture(uImage, coverUv(cuv - vec2(0.0, stepv.y))).rgb);
        float pU = lum(texture(uImage, coverUv(cuv + vec2(0.0, stepv.y))).rgb);
        g += vec2(pR - pL, pU - pD) * 0.9;
      }
      float mag = length(g);
      if (mag < 0.028) {
        id = 0;
      } else if (abs(g.x) > abs(g.y) * 1.3) {
        id = 17;
      } else if (abs(g.y) > abs(g.x) * 1.3) {
        id = 16;
      } else if (g.x * g.y > 0.0) {
        id = 18;
      } else {
        id = 15;
      }
    } else if (uAscii == 1) {
      id = 10 + int(clamp(L, 0.0, 0.999) * 5.0);
    } else if (uAscii == 3) {
      id = 19 + int(clamp(L, 0.0, 0.999) * 8.0);
    } else if (uAscii == 4) {
      float b = bayer8(floor(p / gc));
      id = int(clamp(L + (b - 0.5) * 0.28, 0.0, 0.999) * 10.0);
    } else {
      id = int(clamp(L, 0.0, 0.999) * 10.0);
    }
    float bit = sampleAtlas(id, guv);
    vec3 print = asciiColor(col, bit);
    return mix(col, print, smoothstep(0.06, 0.62, amt));
  }
  if (uStyle == 1) {
    float n = ign(p);
    float q = step(n, t);
    vec3 dith = mix(col * 0.12, col * 1.05, q);
    return mix(col, dith, amt);
  }
  if (uStyle == 2) {
    vec2 g = fract(p / 7.0) - 0.5;
    float d = length(g);
    float q = step(d, mix(0.48, 0.08, t));
    vec3 dith = mix(col * 0.1, col * 1.08, 1.0 - q);
    return mix(col, dith, amt);
  }
  if (uStyle == 3) {
    float s1 = abs(fract((p.x + p.y) / 6.0) - 0.5);
    float s2 = abs(fract((p.x - p.y) / 6.0) - 0.5);
    float h = mix(s1, min(s1, s2), step(0.45, t));
    float q = step(h, mix(0.08, 0.42, t));
    vec3 dith = mix(col * 0.12, col * 1.04, q);
    return mix(col, dith, amt);
  }
  if (uStyle == 4) {
    float q = step(0.5, t);
    vec3 dith = mix(vec3(0.04), vec3(0.92), q);
    return mix(col, dith, amt);
  }
  float b = bayer8(p);
  float q = step(b, t);
  vec3 dith = mix(col * 0.14, col * 1.06, q);
  return mix(col, dith, amt);
}

void main() {
  vec2 st = texture(uState, vUv).rg;
  float h = st.r;
  float hx = texture(uState, vUv + vec2(uTexel.x, 0.0)).r;
  float hy = texture(uState, vUv + vec2(0.0, uTexel.y)).r;
  vec3 nrm = normalize(vec3((h - hx) * 26.0, 1.0, (h - hy) * 26.0));
  vec3 light = normalize(vec3(-0.28, 0.78, 0.48));
  float diff = clamp(dot(nrm, light), 0.0, 1.0);
  float spec = pow(clamp(dot(nrm, normalize(light + vec3(0.0, 1.0, 0.0))), 0.0, 1.0), 8.0);
  float fres = pow(1.0 - clamp(nrm.y, 0.0, 1.0), 2.2);

  vec3 base;
  if (uHasImage > 0.5) {
    vec2 uv = coverUv(vUv);
    uv += nrm.xz * 0.04 * uWaves;
    base = texture(uImage, uv).rgb;
    base *= 0.7 + 0.42 * diff;
    base += spec * 0.22 + fres * 0.08;
  } else {
    float t = clamp(0.38 + h * 1.65 + diff * 0.34 + spec * 0.2, 0.0, 1.0);
    base = colormap(t);
    base += spec * 0.16 + fres * 0.05;
  }

  fragColor = vec4(applyDither(base, vUv * uResolution, uDither), 1.0);
}
`;
