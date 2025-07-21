import tgpu from "typegpu";
import * as d from "typegpu/data";
import * as std from "typegpu/std";
import * as utils from "../utils/utils";

export const rectangleFragment = tgpu["~unstable"].fragmentFn({
  in: { uv: d.vec2f, position: d.builtin.position },
  out: d.vec4f,
})((input) => {
  const resolution = utils.resolutionBindGroupLayout.$.resolution;
  const h2wRatio = resolution.y / resolution.x;
  // let st = std.div(input.position.xy, resolution);
  // st = d.vec2f(st.x, 1 - st.y);
  const st = input.uv;
  // const st = d.vec2f(input.uv.x, input.uv.y * h2wRatio);
  const time = utils.timePosBindGroupLayout.$.time;
  const fingerPos = utils.timePosBindGroupLayout.$.fingerPosition;
  let color = d.vec3f(1.0);

  const bl = d.vec2f();
  bl.x = utils.step(0.1, st.x);
  bl.y = utils.step(0.1, st.y);
  let pct = bl.x * bl.y;

  const tr = d.vec2f();
  tr.x = utils.step(0.1, 1 - st.x);
  tr.y = utils.step(0.1, 1 - st.y);
  pct *= tr.x * tr.y;

  color = d.vec3f(pct);
  const wh = d.vec2f(0.3);
  const posXY = d.vec2f(0.35);

  const rect = utils.rect(st, wh, posXY, d.vec3f(0.6, 0.3, 0.3));
  color = utils.plotShape(color, rect);

  return d.vec4f(color, 1.0);
});

export const pietMondrianFragment = tgpu["~unstable"].fragmentFn({
  in: { uv: d.vec2f, position: d.builtin.position },
  out: d.vec4f,
})((input) => {
  const rgbMax = d.f32(255.0);
  const cream = std.div(d.vec3f(241.0, 235.0, 219.0), rgbMax);
  const gold = std.div(d.vec3f(245.0, 202.0, 87.0), rgbMax);
  const crimson = std.div(d.vec3f(153.0, 46.0, 43.0), rgbMax);
  const indigoBlue = std.div(d.vec3f(38.0, 92.0, 150.0), rgbMax);
  const black = d.vec3f(0.0, 0.0, 0.0);

  let color = cream;
  const crimsonRect = utils.rect(
    input.uv,
    d.vec2f(0.3),
    d.vec2f(0.0, 0.7),
    crimson
  );

  const goldenRect = utils.rect(
    input.uv,
    d.vec2f(0.3),
    d.vec2f(0.8, 0.7),
    gold
  );

  const indigoBlueRect = utils.rect(
    input.uv,
    d.vec2f(0.4, 0.1),
    d.vec2f(0.6, 0.0),
    indigoBlue
  );

  const blackLines = [
    utils.rect(input.uv, d.vec2f(1.0, 0.02), d.vec2f(0.0, 0.7), black),
    utils.rect(input.uv, d.vec2f(1.0, 0.02), d.vec2f(0.0, 0.85), black),
    utils.rect(input.uv, d.vec2f(0.04, 1.0), d.vec2f(0.3, 0.0), black),
    utils.rect(input.uv, d.vec2f(0.7, 0.02), d.vec2f(0.3, 0.1), black),
    utils.rect(input.uv, d.vec2f(0.04, 1.0), d.vec2f(0.8, 0.0), black),
    utils.rect(input.uv, d.vec2f(0.04, 0.1), d.vec2f(0.6, 0.0), black),
    utils.rect(input.uv, d.vec2f(0.02, 0.3), d.vec2f(0.1, 0.7), black),
  ];

  color = utils.plotShape(color, crimsonRect);
  color = utils.plotShape(color, goldenRect);
  color = utils.plotShape(color, indigoBlueRect);
  for (let i = 0; i < blackLines.length; i++) {
    color = utils.plotShape(color, blackLines[i]);
  }

  return d.vec4f(color, 1.0);
});

export const circleFragment = tgpu["~unstable"].fragmentFn({
  in: { uv: d.vec2f, position: d.builtin.position },
  out: d.vec4f,
})((input) => {
  const resolution = utils.resolutionBindGroupLayout.$.resolution;
  const w2h = resolution.y / resolution.x;
  const uv = d.vec2f(input.uv.x, input.uv.y * w2h);

  const crimson = std.div(d.vec3f(153.0, 46.0, 43.0), 255.0);
  let color = d.vec3f(1.0);

  const center = d.vec2f(0.5, 0.5 * w2h);
  const pct = std.distance(uv, center);
  color = std.mix(color, d.vec3f(0.86, 0.22, 0.41), pct * 1.3);

  const circle = utils.circle(uv, center, 0.1, crimson);
  color = utils.plotShape(color, circle);

  return d.vec4f(color, 1.0);
});

export const distanceFieldsFragment = tgpu["~unstable"].fragmentFn({
  in: { uv: d.vec2f, position: d.builtin.position },
  out: d.vec4f,
})((input) => {
  const resolution = utils.resolutionBindGroupLayout.$.resolution;
  const w2h = resolution.y / resolution.x;
  let uv = d.vec2f(input.uv.x, input.uv.y * w2h);
  // uv = std.mul(uv, 2.0);
  // uv = d.vec2f(uv.x - 1, uv.y - w2h);

  const time = utils.timePosBindGroupLayout.$.time;

  let dist = std.length(
    std.sub(std.sub(std.abs(uv), d.vec2f(0.5, 0.5 * w2h)), 0.0)
  );

  return d.vec4f(d.vec3f(std.sin(std.fract(dist * 8.0) * time * 3)), 1.0);
});
