import tgpu from "typegpu";
import * as d from "typegpu/data";
import * as std from "typegpu/std";
import * as utils from "../utils/utils";

export const noiseWithRippleFragment = tgpu["~unstable"].fragmentFn({
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
  let rippleEffect = d.f32(
    std.sin(std.mul(std.pow(toCenter, 1.4) - elapsedTime, 10.0))
  );

  const fadeFactor = d.f32(
    std.clamp(1.0 - std.pow(elapsedTime + 1.0, 4) / ripple.ttl, 0.0, 1.0)
  );

  rippleEffect = std.mul(rippleEffect, std.exp(-0.3 * toCenter));
  rippleEffect = std.mul(rippleEffect, fadeFactor);

  //this makes the ripples around the shader
  const rippleCutout =
    utils.smoothstep(0.0, 1.0, rippleEffect * fadeFactor) * (1 - toCenter);
  rippleEffect = std.mul(rippleEffect, rippleCutout);

  const ripplePower = std.mul(
    d.vec2f(rippleEffect, rippleEffect),
    fadeFactor * (1.0 - std.pow(toCenter + 0.01, -1))
  );
  st = std.add(st, std.mul(ripplePower, fadeFactor));

  // let color = d.vec3f(utils.perlinNoise(std.add(st, time / 10)) + offset);
  let color = d.vec3f(utils.perlinNoise(std.add(st, offset)));
  // let color = d.vec3f(utils.snoise(std.add(st, offset)));
  // color = std.add(color, 0.1);

  color = std.mix(
    d.vec3f(1.0, 0.0, 0.0),
    color,
    std.abs(std.sin(color.x * color.y)) + 0.4
  );

  //wacky color stuff---------------
  const redOffset = 0.02 * offset * utils.perlinNoise(st);
  const greenOffset = 0.04;
  const blueOfffset = -redOffset;

  color.x = std.add(color.x, std.mul(toCenter, d.vec2f(redOffset))).x;
  color.y = std.add(color.y, std.mul(toCenter, d.vec2f(greenOffset))).y;
  color.z = std.length(
    std.add(color.z, std.mul(toCenter, d.vec2f(blueOfffset))).xy
  );

  color = std.mix(
    color,
    d.vec3f(0.2, std.abs(utils.perlinNoise(utils.random2(st))), 0.5),
    0.4
  );

  let color2 = d.vec3f(utils.perlinNoise(utils.random2(color.xy)));
  color = std.mix(color, color2, 0.1);
  return d.vec4f(color, 1.0);
});
