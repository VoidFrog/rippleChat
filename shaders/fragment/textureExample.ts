import tgpu from "typegpu";
import * as d from "typegpu/data";
import * as std from "typegpu/std";
import * as utils from "../utils/utils";

export const textureExampleFragment = tgpu["~unstable"].fragmentFn({
  in: { uv: d.vec2f, position: d.builtin.position, texcoord: d.vec2f },
  out: d.vec4f,
})((input) => {
  const resolution = utils.resolutionBindGroupLayout.$.resolution;
  const h2wRatio = resolution.y / resolution.x;
  let st = d.vec2f(input.uv.x, 1.0 - input.uv.y);
  const texcoord = d.vec2f(input.texcoord.x, 1.0 - input.texcoord.y);

  const time = utils.timePosBindGroupLayout.$.time;
  const ripple = utils.rippleBindGroupLayout.$.ripple;

  const elapsedTime = time - ripple.timeStart;
  const speed = d.f32(1.8);
  const waveWidth = 0.3;
  const currentRadius = speed * elapsedTime;
  const fadeFactor = d.f32(
    std.clamp(1.0 - std.pow(elapsedTime + 1.0, 4) / ripple.ttl, 0.0, 1.0)
  );

  const distFromCenter = std.distance(st, ripple.center);

  const wave =
    utils.smoothstep(currentRadius, currentRadius + waveWidth, distFromCenter) -
    utils.smoothstep(
      currentRadius + waveWidth,
      currentRadius + 2.0 * waveWidth,
      distFromCenter
    );

  const distortion = wave * 0.05 * fadeFactor;
  const distortedUV = std.add(
    st,
    std.mul(std.normalize(std.sub(st, ripple.center)), distortion)
  );

  const redUV = std.add(distortedUV, d.vec2f(0.02, 0.0));
  const greenUV = distortedUV;
  const blueUV = std.sub(distortedUV, d.vec2f(0.01, 0.0));

  const red = std.textureSample(
    utils.textureBindGroupLayout.$.texture,
    utils.textureBindGroupLayout.$.sampler,
    redUV
  ).x;
  const green = std.textureSample(
    utils.textureBindGroupLayout.$.texture,
    utils.textureBindGroupLayout.$.sampler,
    greenUV
  ).y;
  const blue = std.textureSample(
    utils.textureBindGroupLayout.$.texture,
    utils.textureBindGroupLayout.$.sampler,
    blueUV
  ).z;

  const defaultValue = std.textureSample(
    utils.textureBindGroupLayout.$.texture,
    utils.textureBindGroupLayout.$.sampler,
    texcoord
  );
  return std.select(d.vec4f(red, green, blue, 1.0), defaultValue, wave <= 0.0);
});
