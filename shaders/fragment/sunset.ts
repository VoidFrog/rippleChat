import * as utils from "@/shaders/utils/utils";
import tgpu from "typegpu";
import * as d from "typegpu/data";
import * as std from "typegpu/std";

const fragmentSunset = tgpu["~unstable"].fragmentFn({
  in: { uv: d.vec2f },
  out: d.vec4f,
})((input) => {
  const st: d.v2f = input.uv;
  const time = utils.timePosBindGroupLayout.$.time;
  const fingerPos = utils.timePosBindGroupLayout.$.fingerPosition;

  let color = d.vec3f(0.0);
  const pct = d.vec3f(st.x);

  const center = d.vec2f(0.7, 0.65);
  const radius = d.f32(0.8);
  const feather = d.f32(0.5);
  const dist = std.distance(st, center);

  pct.x =
    utils.smoothstep(0.1, 0.3, st.y) -
    utils.smoothstep(0.1, 2.5, st.y * (1.0 - st.x)) +
    (utils.smoothstep(0.3, 2, st.x) + utils.smoothstep(0.5, 0.8, st.y)) -
    utils.smoothstep(radius, radius - feather, dist) / 1.3;

  pct.x = pct.x * std.abs(std.sin(time / Math.PI));
  pct.y = (1 - st.x) * st.y; //green
  pct.z = std.pow(st.x, 0.2); //blue
  color = std.mix(
    d.vec3f(0.149, 0.141, 0.912),
    d.vec3f(1.0, 0.833, 0.224),
    pct
  );

  // lines below plot the functions to the color channels
  // color = std.mix(color, d.vec3f(1.0, 0.0, 0.0), plot(st, pct.x)) //plotting the red channel
  // color = std.mix(color, d.vec3f(0.0, 1.0, 0.0), plot(st, pct.y)) //plotting the green channel
  // color = std.mix(color, d.vec3f(0.0, 0.0, 1.0), plot(st, pct.z)) //plotting the blue channel
  return d.vec4f(color, 1.0);
});

export default fragmentSunset;
