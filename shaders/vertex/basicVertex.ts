import * as utils_imp from "@/shaders/utils/utils";
import tgpu from "typegpu";
import * as d_imp from "typegpu/data";
import * as std_imp from "typegpu/std";

const d = { ...d_imp };
const std = { ...std_imp };
const utils = { ...utils_imp };

const basicVertexOut = {
  position: d.builtin.position,
  uv: d.vec2f,
};

const basicVertex = tgpu["~unstable"].vertexFn({
  in: { vertexIndex: d.builtin.vertexIndex },
  out: basicVertexOut,
})((input) => {
  const position: d_imp.v2f[] = [
    d.vec2f(-1.0, -1.0), // bottom left
    d.vec2f(1.0, 1.0), // top right
    d.vec2f(1.0, -1.0), // bottom right
    d.vec2f(-1.0, -1.0), // bottom left
    d.vec2f(-1.0, 1.0), // top left
    d.vec2f(1.0, 1.0), // top right
  ];

  const uv: d_imp.v2f[] = [
    d.vec2f(0.0, 0.0),
    d.vec2f(1.0, 1.0),
    d.vec2f(1.0, 0.0),
    d.vec2f(0.0, 0.0),
    d.vec2f(0.0, 1.0),
    d.vec2f(1.0, 1.0),
  ];

  let index = input.vertexIndex;
  let pos = position[index];

  return {
    position: d.vec4f(pos.xy, 0.0, 1.0),
    uv: uv[index],
  };
});

export default basicVertex;

//TODO: untangle the code above, figure out how to make array<v2f, 6> using typeGPU
