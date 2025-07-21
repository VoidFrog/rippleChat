import tgpu from "typegpu";
import * as d from "typegpu/data";
import * as std from "typegpu/std";
import * as utils from "../utils/utils";

export const noiseFragment = tgpu["~unstable"].fragmentFn({
  in: { uv: d.vec2f, position: d.builtin.position },
  out: d.vec4f,
})((input) => {
  const resolution = utils.resolutionBindGroupLayout.$.resolution;
  const h2wRatio = resolution.y / resolution.x;
  let st = d.vec2f(input.uv.x, 1.0 - input.uv.y);
  const time = utils.timePosBindGroupLayout.$.time;
  const ripple = utils.rippleBindGroupLayout.$.ripple;

  const scale = d.f32(5.0);
  // st = std.mul(st, d.vec2f(scale, std.floor(scale * h2wRatio)));
  st = std.mul(st, scale);
  // const currentCell = std.floor(st); //this line makes the pixels visible and not blurry
  // let scaledCell = d.vec2f(st.x, st.y * h2wRatio);
  // scaledCell = std.mul(scaledCell, 0.5);

  const offset =
    std.sin(st.x + time) +
    0.7 * std.sin(st.x * 2.3 + time / 2.0) +
    0.3 * std.sin(st.x * 4.1 + time / 3.0) +
    0.1 * std.sin(st.x * 9.8 + time * 2) +
    std.sin(st.y + time) +
    0.6 * std.sin(st.y * 2.9 + time / 1.7) +
    0.05 * std.sin(st.y * 7.1 + time);

  //ripple------------
  const elapsedTime = time - ripple.timeStart;

  const center = std.sub(std.mul(ripple.center, scale), 0.5 * scale);
  const toCenter = std.distance(center, std.sub(st, std.mul(0.5, scale)));
  let rippleEffect = d.f32(std.sin(std.mul(toCenter - elapsedTime, 10.0)));

  const fadeFactor = std.clamp(1.0 - elapsedTime / ripple.ttl / 10, 0.0, 1.0);
  rippleEffect = std.mul(rippleEffect, std.exp(-0.3 * toCenter));
  rippleEffect = std.mul(rippleEffect, fadeFactor);

  //this makes the ripples around the shader
  if (fadeFactor > 0.999999) {
    const rippleCutout = utils.smoothstep(0.0, 1.0, rippleEffect * 2.0);
    rippleEffect = std.mul(rippleEffect, rippleCutout);
  }

  const ripplePower = std.mul(d.vec2f(rippleEffect, rippleEffect), 0.15);
  st = std.add(st, ripplePower);

  // let color = d.vec3f(utils.perlinNoise(std.add(st, time / 10)) + offset);
  let color = d.vec3f(utils.perlinNoise(std.add(st, offset)));
  // let color = d.vec3f(utils.snoise(std.add(st, offset)));
  color = std.add(color, 0.1);

  color = std.mix(
    d.vec3f(1.0, 0.0, 0.0),
    color,
    std.abs(std.sin(color.x * color.y)) + 0.4
  );

  color = std.mix(
    color,
    d.vec3f(0.2, std.abs(utils.perlinNoise(utils.random2(st))), 0.5),
    0.4
  );

  let color2 = d.vec3f(utils.perlinNoise(utils.random2(color.xy)));
  color = std.mix(color, color2, 0.1);

  // let rippleColor = d.vec3f(std.sin(1 - toCenter));
  // const pct =
  //   utils.smoothstep(0.0, ripple.r, toCenter) -
  //   utils.smoothstep(ripple.r, 1.0, toCenter);

  // color = std.mix(color, rippleColor, pct);

  return d.vec4f(color, 1.0);
});
