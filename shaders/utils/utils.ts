import { useRef } from "react";
import { Dimensions, PanResponder } from "react-native";
import tgpu from "typegpu";
import * as d from "typegpu/data";
import * as std from "typegpu/std";

export const smoothstep = tgpu.fn(
  [d.f32, d.f32, d.f32],
  d.f32
)((edge0, edge1, x) => {
  const t = std.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3.0 - 2.0 * t);
});

export const step = tgpu.fn(
  [d.f32, d.f32],
  d.f32
)((threshold, num) => {
  const check = threshold <= num;
  return std.select(d.f32(0.0), 1.0, check);
});

export const plotLine = tgpu.fn(
  [d.vec2f],
  d.f32
)((inVec) => {
  return smoothstep(0.02, 0.0, std.abs(inVec.y - inVec.x));
});

export const plot = tgpu.fn(
  [d.vec2f, d.f32],
  d.f32
)((st, pct) => {
  return smoothstep(pct - 0.01, pct, st.y) - smoothstep(pct, pct + 0.01, st.y);
});

export const v3mod = tgpu.fn(
  [d.vec3f, d.f32],
  d.vec3f
)((color, md) => {
  const dv = std.div(color, md);
  const val = std.mul(md, std.floor(dv));
  const c = std.sub(color, val);

  return c;
});

export const circularEaseOut = tgpu.fn(
  [d.f32],
  d.f32
)((h) => {
  return std.sqrt(1 - std.pow(1 - h, 2.0));
});

export const hsb2rgb = tgpu.fn(
  [d.vec3f],
  d.vec3f
)((color) => {
  //mod(c.x*6.0+vec3(0.0,4.0,2.0),6.000)
  let val = std.add(color.x * 6.0, d.vec3f(0.0, 4.0, 2.0));
  val = std.sub(v3mod(val, 6.0), 3.0);

  let rgb = std.clamp(std.sub(std.abs(val), 1.0), d.vec3f(0.0), d.vec3f(1.0));
  rgb = std.mul(std.mul(rgb, rgb), std.sub(d.vec3f(3.0), std.mul(2.0, rgb)));

  return std.mul(d.vec3f(color.z), std.mix(d.vec3f(1.0), rgb, color.y));
});

export const hsb2ryb = tgpu.fn(
  [d.vec3f],
  d.vec3f
)((color) => {
  const c = d.vec3f(std.pow(color.x, 1.5), color.yz);
  return hsb2rgb(c);
});

export const rect = tgpu.fn(
  [d.vec2f, d.vec2f, d.vec2f, d.vec3f],
  d.vec4f
)((uv, wh, posXY, color) => {
  const x = uv.x - posXY.x;
  const y = uv.y - posXY.y;
  const width = wh.x;
  const height = wh.y;

  const inX = step(0.0, x) * step(x, width);
  const inY = step(0.0, y) * step(y, height);
  const inRect = inX * inY;

  return std.select(d.vec4f(color, 0.0), d.vec4f(color, 1.0), inRect < 1);
});

export const circle = tgpu.fn(
  [d.vec2f, d.vec2f, d.f32, d.vec3f],
  d.vec4f
)((posXY, center, radius, color) => {
  const dist = std.distance(center, d.vec2f(posXY.x, posXY.y));
  const inCircle = radius < dist;

  return std.select(d.vec4f(color, 0.0), d.vec4f(color, 1.0), inCircle);
});

export const random = tgpu.fn(
  [d.vec2f],
  d.f32
)((st) => {
  return std.fract(
    std.sin(std.dot(st, d.vec2f(12.9898, 78.233))) * 437358.845701
  );
});

export const random2 = tgpu.fn(
  [d.vec2f],
  d.vec2f
)((st) => {
  const vec = d.vec2f(
    std.dot(st, d.vec2f(127.1, 311.7)),
    std.dot(st, d.vec2f(269.5, 183.3))
  );

  return std.add(
    -1.0,
    std.mul(2.0, std.fract(std.mul(std.sin(vec), 43758.5453123)))
  );
});

export const noise1d = tgpu.fn(
  [d.f32],
  d.f32
)((x) => {
  const i = std.floor(x);
  const f = std.fract(x);

  return std.mix(random(d.vec2f(i)), random(d.vec2f(i + 1.0)), f);
});

export const noise2d = tgpu.fn(
  [d.vec2f],
  d.f32
)((st) => {
  const i = std.floor(st);
  const f = std.fract(st);

  const a = random(i);
  const b = random(std.add(i, d.vec2f(1.0, 0.0)));
  const c = random(std.add(i, d.vec2f(0.0, 1.0)));
  const _d = random(std.add(i, d.vec2f(1.0, 1.0)));

  const u = d.vec2f(smoothstep(0.0, 1.0, f.x), smoothstep(0.0, 1.0, f.y));
  return (
    std.mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (_d - b) * u.x * u.y
  );
});

export const perlinNoise = tgpu.fn(
  [d.vec2f],
  d.f32
)((st) => {
  const i = std.floor(st);
  const f = std.fract(st);
  const u = std.mul(std.mul(f, f), std.sub(3.0, std.mul(d.vec2f(2.0), f)));

  return std.mix(
    std.mix(
      std.dot(
        random2(std.add(i, d.vec2f(0.0, 0.0))),
        std.sub(f, d.vec2f(0.0, 0.0))
      ),
      std.dot(
        random2(std.add(i, d.vec2f(1.0, 0.0))),
        std.sub(f, d.vec2f(1.0, 0.0))
      ),
      u.x
    ),
    std.mix(
      std.dot(
        random2(std.add(i, d.vec2f(0.0, 1.0))),
        std.sub(f, d.vec2f(0.0, 1.0))
      ),
      std.dot(
        random2(std.add(i, d.vec2f(1.0, 1.0))),
        std.sub(f, d.vec2f(1.0, 1.0))
      ),
      u.x
    ),
    u.y
  );
});

export const v2mod289 = tgpu.fn(
  [d.vec2f],
  d.vec2f
)((v2) => {
  return std.sub(v2, std.mul(std.floor(std.mul(v2, 1.0 / 289.0)), 289.0));
});

export const v3mod289 = tgpu.fn(
  [d.vec3f],
  d.vec3f
)((v3) => {
  return std.sub(v3, std.mul(std.floor(std.mul(v3, 1.0 / 289.0)), 289.0));
});

export const permute = tgpu.fn(
  [d.vec3f],
  d.vec3f
)((v3) => {
  return v3mod289(std.mul(std.add(std.mul(v3, 34.0), 1.0), v3));
});

export const snoise = tgpu.fn(
  [d.vec2f],
  d.f32
)((v) => {
  const c = d.vec4f(
    0.211324865405187,
    // (3.0-sqrt(3.0))/6.0
    0.366025403784439,
    // 0.5*(sqrt(3.0)-1.0)
    -0.577350269189626,
    // -1.0 + 2.0 * C.x
    0.024390243902439
    // 1.0 / 41.0
  );

  let i = std.floor(std.add(v, std.dot(v, c.yy)));
  const x0 = std.add(std.sub(v, i), std.dot(i, c.xx));

  let i1 = d.vec2f(0.0);
  i1 = std.select(d.vec2f(0.0, 1.0), d.vec2f(1.0, 0.0), x0.x > x0.y);
  let x1 = std.sub(std.add(x0.xy, c.xx), i1);
  let x2 = std.add(x0.xy, c.zz);

  // Do some permutations to avoid
  // truncation effects in permutation
  i = v2mod289(i);
  const p = permute(
    std.add(
      std.add(permute(std.add(i.y, d.vec3f(0.0, i1.y, 1.0))), i.x),
      d.vec3f(0.0, i1.x, 1.0)
    )
  );

  let m = std.max(
    std.sub(0.5, d.vec3f(std.dot(x0, x0), std.dot(x1, x1), std.dot(x2, x2))),
    d.vec3f(0.0)
  );

  m = std.mul(m, m);
  m = std.mul(m, m);

  let x = std.sub(std.mul(2.0, std.fract(std.mul(p, c.www))), 1.0);
  let h = std.sub(std.abs(x), 0.5);
  let ox = std.floor(std.add(x, 0.5));
  let a0 = std.sub(x, ox);

  // Normalise gradients implicitly by scaling m
  // Approximation of: m *= inversesqrt(a0*a0 + h*h);
  const a0_h_2 = std.add(std.mul(a0, a0), std.mul(h, h));
  m = std.mul(m, std.sub(1.79284291400159, std.mul(0.85373472095314, a0_h_2)));

  // Compute final noise value at P
  let g = d.vec3f(0.0);
  g.x = a0.x * x0.x + h.x * x0.y;
  const g_yz = std.add(
    std.mul(a0.yz, d.vec2f(x1.x, x2.x)),
    std.mul(h.yz, d.vec2f(x1.y, x2.y))
  );
  return 130.0 * std.dot(m, d.vec3f(g.x, g_yz));
});

export const plotShape = tgpu.fn(
  [d.vec3f, d.vec4f],
  d.vec3f
)((color, rColor) => {
  return std.mix(rColor.xyz, color, d.vec3f(rColor.w));
});

export const timePosBindGroupLayout = tgpu.bindGroupLayout({
  time: { uniform: d.f32 },
  fingerPosition: { uniform: d.vec2f },
});

export const rippleSchema = d.struct({
  timeStart: d.f32,
  ttl: d.f32,
  r: d.f32,
  center: d.vec2f,
});

export const rippleBindGroupLayout = tgpu.bindGroupLayout({
  ripple: { uniform: rippleSchema },
});

export const resolutionBindGroupLayout = tgpu.bindGroupLayout({
  resolution: { uniform: d.vec2f },
});

export const textureBindGroupLayout = tgpu.bindGroupLayout({
  texture: { texture: "float", dimension: "2d", sampleType: "float" },
  sampler: { sampler: "filtering" },
});

export const useTouchAndDragPanResponder = (fingerPositionValue: number[]) => {
  return useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => {
        console.log("clicked");
        return false;
      },
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        fingerPositionValue[0] =
          evt.nativeEvent.pageX / Dimensions.get("window").width;
        fingerPositionValue[1] =
          evt.nativeEvent.pageY / (Dimensions.get("window").height - 80);
        //this -80 comes from the tab bar, change to getting the measurements of that component (maybe?) instead in the future
        console.log(fingerPositionValue);
      },
      onPanResponderRelease: () => {
        console.log("Touch released");
      },
    })
  ).current;
};
