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

export const resolutionBindGroupLayout = tgpu.bindGroupLayout({
  resolution: { uniform: d.vec2f },
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
          evt.nativeEvent.pageY / Dimensions.get("window").height;
        console.log(fingerPositionValue);
      },
      onPanResponderRelease: () => {
        console.log("Touch released");
      },
    })
  ).current;
};
