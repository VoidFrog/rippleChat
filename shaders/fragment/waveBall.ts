import * as utils from "@/shaders/utils/utils";
import tgpu from "typegpu";
import * as d from "typegpu/data";
import * as std from "typegpu/std";

const waveBall = tgpu["~unstable"].fragmentFn({
  in: { uv: d.vec2f, position: d.builtin.position },
  out: d.vec4f,
})((input) => {
  const uv = std.sub(std.mul(input.uv, 2.0), 1.0); // Remap [0, 1] → [-1, 1]
  const fingerPosition = utils.timePosBindGroupLayout.$.fingerPosition;
  const time = utils.timePosBindGroupLayout.$.time;

  const fgPos = d.vec2f(
    fingerPosition.x * 2.0 - 1.0,
    -(fingerPosition.y * 2.0 - 1.0)
  );
  const pos = input.position.xy;

  const size = 0.4;
  const feather = 0.05;
  const amp = 0.2;
  const freq = 3.0;

  const waveX = uv.x + amp * std.sin(uv.y * 10.0 + time * 4.0);
  const waveY = uv.y + amp * std.sin(uv.x * 10.0 + time * 4.0);

  const dd = std.max(std.abs(waveX), std.abs(waveY)) - size;
  const alpha = 1.0 - utils.smoothstep(0.0, feather, dd);

  const dst = std.distance(fgPos, uv);
  const color = d.vec4f(pos.x, 0.2, std.sin(time * uv.y), alpha);

  // const check = sin(time*freq)*uv.x*uv.y < 0.1 || sin(time*freq)*uv.x*uv.y > 0.3;
  // const check = uv.x*uv.y < 0.2*sin(time);
  // const check =
  // uv.x * uv.x + 4 * uv.y * uv.y < 1.0 + std.sin(30 * time * uv.x * uv.y); // fancy twinkling circle
  // const check = dst+uv.y < 0.1+sin(10*time*uv.x) && uv.y*uv.y+uv.x*uv.x > dst-0.1;
  const check =
    dst + uv.y < 0.1 + std.sin(10 * time * uv.x) &&
    uv.y * uv.y + uv.x * uv.x > dst - 0.1;
  return std.select(d.vec4f(0, 0, 0, 1), color, check);
});

export default waveBall;
