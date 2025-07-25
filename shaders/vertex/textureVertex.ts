import tgpu from "typegpu";
import * as d from "typegpu/data";

const basicVertexOut = {
  position: d.builtin.position,
  uv: d.vec2f,
  texcoord: d.vec2f,
};

const textureVertex = tgpu["~unstable"].vertexFn({
  in: { vertexIndex: d.builtin.vertexIndex },
  out: basicVertexOut,
})((input) => {
  const position: d.v2f[] = [
    d.vec2f(-1.0, -1.0), // bottom left
    d.vec2f(1.0, 1.0), // top right
    d.vec2f(1.0, -1.0), // bottom right
    d.vec2f(-1.0, -1.0), // bottom left
    d.vec2f(-1.0, 1.0), // top left
    d.vec2f(1.0, 1.0), // top right
  ];

  const uv: d.v2f[] = [
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
    texcoord: uv[index],
  };
});

export default textureVertex;

//TODO: untangle the code above, figure out how to make array<v2f, 6> using typeGPU
