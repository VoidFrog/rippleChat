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

export const timePosBindGroupLayout = tgpu.bindGroupLayout({
  time: { uniform: d.f32 },
  fingerPosition: { uniform: d.vec2f },
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
