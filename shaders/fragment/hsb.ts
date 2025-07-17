import tgpu from "typegpu";
import * as d from "typegpu/data";
import * as std from "typegpu/std";
import * as utils from "../utils/utils";

const hsbSomething = tgpu["~unstable"].fragmentFn({
  in: { uv: d.vec2f, position: d.builtin.position },
  out: d.vec4f,
})((input) => {
  const st = input.uv;
  const time = utils.timePosBindGroupLayout.$.time;
  const fingerPos = utils.timePosBindGroupLayout.$.fingerPosition;
  let color = d.vec3f(1.0);

  const center = d.vec2f(0.5);
  const toCenter = std.sub(center, st);
  const baseAngle = std.atan2(toCenter.y, toCenter.x);
  const radius = std.length(toCenter) * 2.0;
  const angle = utils.smoothstep(-Math.PI, Math.PI, baseAngle) * radius; //std.tanh(0.5 * baseAngle) * Math.PI * 1.1;

  //map value from atan (-PI, PI) to (0, 1)
  const colorValueMapped = d.vec3f(angle / (Math.PI * 2.0) + 0.5, radius, 1.0);
  color = utils.hsb2rgb(colorValueMapped);
  // color = utils.v3mod(color, 6.0);
  // color.x = std.abs(std.sin(time));

  return d.vec4f(color, 1.0);
});

export default hsbSomething;
