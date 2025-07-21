import tgpu from "typegpu";
import * as d from "typegpu/data";
import * as std from "typegpu/std";
import * as utils from "../utils/utils";

export const hsbEx1 = tgpu["~unstable"].fragmentFn({
  in: { uv: d.vec2f, position: d.builtin.position },
  out: d.vec4f,
})((input) => {
  const st = input.uv;
  const time = utils.timePosBindGroupLayout.$.time;
  const fingerPos = utils.timePosBindGroupLayout.$.fingerPosition;
  let color = d.vec3f(1.0);
  color.x = std.pow(std.sin(st.y * st.x), -1) + (time % (2 * Math.PI));
  color = utils.hsb2rgb(color);
  // color = utils.hsb2rgb(d.vec3f(utils.circularEaseOut(st.x), 1.0, 1.0));
  return d.vec4f(color, 1.0);
});

export const hsbEx2 = tgpu["~unstable"].fragmentFn({
  in: { uv: d.vec2f, position: d.builtin.position },
  out: d.vec4f,
})((input) => {
  const st = input.uv;
  const time = utils.timePosBindGroupLayout.$.time;
  const fingerPos = utils.timePosBindGroupLayout.$.fingerPosition;

  let color = d.vec3f(0.0);
  const center = d.vec2f(0.5);
  const toCenter = std.sub(center, st);

  const angle = std.atan2(toCenter.y, toCenter.x);
  const radius = std.length(toCenter) * 2.0;

  color = utils.hsb2rgb(d.vec3f(angle / (Math.PI * 2) + 0.5, radius, 1.0));

  return d.vec4f(color, 1.0);
});
