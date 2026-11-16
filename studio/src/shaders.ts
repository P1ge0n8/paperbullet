export const VERT = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`

export const WALL = /* glsl */ `
uniform sampler2D uSlide; uniform float uOn; uniform float uShutter; uniform float uTime;
uniform vec2 uOpen; uniform float uBoost;
varying vec2 vUv;
const float PAD = 1.250;
const float KEY = 0.0;
void main(){
  // plane uv -> frame uv, undoing the keystone so the slide fills the trapezoid
  vec2 p = (vUv - 0.5) * PAD;
  p.x /= 1.0 + KEY * p.y;
  vec2 f = p + 0.5;
  vec2 c = f - 0.5;
  float r = length(c * vec2(1.6, 1.0));
  // soft frame edge: the gate is out of focus
  vec2 e = smoothstep(vec2(0.0), vec2(0.006), f) * smoothstep(vec2(0.0), vec2(0.006), 1.0 - f);
  float inFrame = e.x * e.y;
  // defocus and colour fringing, both growing towards the edges
  float blur = 0.0009 + 0.0016 * r;
  vec2 ca = c * 0.0035;
  vec3 col = vec3(0.0);
  for (int i = 0; i < 6; i++) {
    float a = float(i) * 1.0472;
    vec2 o = vec2(cos(a), sin(a)) * blur;
    col.r += texture2D(uSlide, f + o + ca).r;
    col.g += texture2D(uSlide, f + o).g;
    col.b += texture2D(uSlide, f + o - ca).b;
  }
  col /= 6.0;
  // powering on, the frame is a white line first, the slide only as it opens
  col = mix(vec3(1.0), col, smoothstep(0.02, 0.4, uOpen.y));
  vec2 gap = abs(c) - uOpen * 0.5;
  float opened = (1.0 - smoothstep(-0.004, 0.004, gap.x)) * (1.0 - smoothstep(-0.004, 0.004, gap.y));
  // the lamp: hot in the middle, falling off to the corners, warm
  float hot = 1.0 - 0.45 * smoothstep(0.0, 0.85, r);
  float flicker = 1.0 + 0.012 * sin(uTime * 7.3) * sin(uTime * 2.1);
  vec3 lamp = vec3(1.0, 0.93, 0.8) * 0.75 * hot * flicker;
  vec3 light = lamp * col * inFrame * opened * uBoost;
  // a faint halo of stray light around the frame
  vec2 d = max(abs(c) - 0.5, 0.0);
  vec2 edge = smoothstep(vec2(0.0), vec2(0.12), vUv) * smoothstep(vec2(0.0), vec2(0.12), 1.0 - vUv);
  float halo = exp(-length(d) * 9.0) * (1.0 - inFrame) * 0.07 * edge.x * edge.y * uOpen.y;
  gl_FragColor = vec4((light + vec3(1.0, 0.92, 0.8) * halo) * uOn * uShutter, 1.0);
}`

export const BEAM_VERT = /* glsl */ `varying vec2 vUv; varying vec3 vPos; void main(){ vUv = uv; vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`

export const BEAM = /* glsl */ `
uniform float uOn; uniform float uTime;
varying vec2 vUv; varying vec3 vPos;
float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
void main(){
  // brightest near the lens, with slow drifting haze through it
  float t = vUv.y;
  float haze = 0.6 + 0.4 * noise(vPos.xy * 3.0 + vec2(uTime * 0.05, uTime * 0.03));
  float a = uOn * (0.006 + 0.05 * pow(1.0 - t, 3.0)) * haze;
  gl_FragColor = vec4(vec3(1.0, 0.95, 0.85) * a, 1.0);
}`

export const DUST_VERT = /* glsl */ `
uniform float uTime; attribute float aAlong; attribute float aSeed; varying float vA;
void main(){
  vec3 p = position;
  p += vec3(sin(uTime * 0.11 + aSeed), sin(uTime * 0.07 + aSeed * 1.7) - 0.0, cos(uTime * 0.09 + aSeed * 2.3)) * 0.03 * (0.5 + aAlong);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = min((1.2 + fract(aSeed) * 2.0) * (6.0 / -mv.z), 3.5);
  // motes catch the light, more near the lens and some twinkle as they turn
  vA = (0.25 + 0.75 * (1.0 - aAlong)) * (0.4 + 0.6 * abs(sin(uTime * 0.6 + aSeed)));
}`

export const DUST = /* glsl */ `
uniform float uOn; varying float vA;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d) * vA * uOn * 0.35;
  gl_FragColor = vec4(vec3(1.0, 0.95, 0.85) * a, 1.0);
}`
