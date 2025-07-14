import { useEffect, useRef } from 'react';
import { Dimensions, PanResponder, SafeAreaView, View } from 'react-native';
import { Canvas, useDevice, useGPUContext } from 'react-native-wgpu';
import tgpu from 'typegpu';
import * as d from 'typegpu/data';
import * as std from 'typegpu/std';

// const basicVertexOut = {
//   position: d.builtin.position,
//   uv: d.vec2f,
//   color: d.vec4f 
// }
const basicVertexOut = {
  position: d.builtin.position,
  uv: d.vec2f,
}

const Uniforms = d.struct({
  color: d.vec4f,
  scale: d.vec2f,
  offset: d.vec2f,
  resolution: d.vec2f
})

const uniforms = Uniforms({
  color: d.vec4f(0.2, 0.4, 0.6, 1),
  scale: d.vec2f(1, 1),
  offset: d.vec2f(0.2, 0.2),
  resolution: d.vec2f(Dimensions.get('window').width, Dimensions.get('window').height)
})

const fingerPositionValue = [0, 0]


export function Triangle() {
  const frameRef = useRef<number | null>(null)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => {console.log('clicked') ; return false},
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        fingerPositionValue[0] = evt.nativeEvent.pageX/Dimensions.get('window').width
        fingerPositionValue[1] = evt.nativeEvent.pageY/Dimensions.get('window').height
        console.log(fingerPositionValue)
      },
      onPanResponderRelease: () => {
        console.log('Touch released');
      },
    })
  ).current;


  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  const { device = null } = useDevice();
  const root = device ? tgpu.initFromDevice({ device }) : null;
  const { ref, context } = useGPUContext();

  useEffect(() => {
    if (!root || !device || !context) {
      return;
    }
    context.configure({
      device: device,
      format: presentationFormat,
      alphaMode: 'premultiplied',
    });
    
    const uniformsBuffer = root['~unstable'].createUniform(Uniforms, uniforms)
    const bgColor = root['~unstable'].createUniform(d.vec4f, d.vec4f(0.114, 0.447, 0.941, 1))
    const time = root['~unstable'].createUniform(d.f32)
    const fingerPosition = root['~unstable'].createUniform(d.vec2f)
    // const uniformBuffer = root.createBuffer(Uniforms, uniforms).$usage('uniform')
    

    const pipeline = root['~unstable']
      .withVertex(mainVertex.$uses({time}), {})
      .withFragment(fragment1, {format: presentationFormat})
      // .withFragment(mainFragment.$uses({bgColor, time, uniformsBuffer, fingerPosition}), {format: presentationFormat})
      .createPipeline()

    const timeStart = performance.now()
    const render = () => { 
      // uniformsBuffer.write()
      time.write(d.f32((performance.now()-timeStart)*0.001))
      fingerPosition.write(d.vec2f(fingerPositionValue[0], fingerPositionValue[1]))
      
      pipeline.withColorAttachment({
          view: context.getCurrentTexture().createView(),
          clearValue: [0, 0, 0, 0],
          loadOp: 'clear',
          storeOp: 'store',
        })
        .draw(6);
      
      context.present()
      frameRef.current = requestAnimationFrame(render)
    }

    frameRef.current = requestAnimationFrame(render)
    return () => { 
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
      // console.log('cancelled')
    }
  }, [root, device, context, presentationFormat]);

  
  return (
    <SafeAreaView
    style={{width: '100%', height:'100%', flex:1}}
    >
      <View 
      onTouchStart={(ev) => {  
        fingerPositionValue[0] = ev.nativeEvent.pageX/Dimensions.get('window').width
        fingerPositionValue[1] = ev.nativeEvent.pageY/Dimensions.get('window').height
      }}
      {...panResponder.panHandlers}
      >
        <Canvas ref={ref} style={{ width: "100%", height: "100%"}} transparent />
      </View>
    </SafeAreaView>
  );
}



const mainVertex = tgpu['~unstable'].vertexFn({
  in: { vertexIndex: d.builtin.vertexIndex },
  out: basicVertexOut,
})/* wgsl */ `{
    var position = array<vec2f, 6>(
    vec2f(-1.0, -1.0), // bottom left
    vec2f(1.0, 1.0),   // top right
    vec2f(1.0, -1.0),  // bottom right
    vec2f(-1.0, -1.0), // bottom left
    vec2f(-1.0, 1.0),  // top left
    vec2f(1.0, 1.0)    // top right
  );

  var uv = array<vec2f, 6>(
    vec2f(0.0, 0.0),
    vec2f(1.0, 1.0),
    vec2f(1.0, 0.0),
    vec2f(0.0, 0.0),
    vec2f(0.0, 1.0),
    vec2f(1.0, 1.0)
  );

  let index = in.vertexIndex;
  let pos = position[index];

  return Out(vec4f(pos.xy, 0.0, 1.0), uv[index]);
}`;

const mainFragment = tgpu['~unstable'].fragmentFn({
  in: basicVertexOut,
  out: d.vec4f,
})
`{
  let uv = in.uv * 2.0 - 1.0; // Remap [0, 1] → [-1, 1]
  let fgPos = vec2(fingerPosition.x*2.0 - 1.0, -(fingerPosition.y*2.0-1.0));
  let pos = in.position.xy;

  let size = 0.4;
  let feather = 0.05;
  let amp = 0.2;
  let freq = 3.0;

  let waveX = uv.x + amp * sin(uv.y * 10.0 + time * 4.0);
  let waveY = uv.y + amp * sin(uv.x * 10.0 + time * 4.0);

  let d = max(abs(waveX), abs(waveY)) - size;
  let alpha = 1.0 - smoothstep(0.0, feather, d);

  let dst = distance(fgPos, uv);
  let color = vec4f(pos.x, 0.2, sin(time*uv.y), alpha);

  // let check = sin(time*freq)*uv.x*uv.y < 0.1 || sin(time*freq)*uv.x*uv.y > 0.3;
  // let check = uv.x*uv.y < 0.2*sin(time);
  // let check = uv.x*uv.x + 4*uv.y*uv.y < 1.0 + sin(30*time*uv.x*uv.y); // fancy twinkling circle
  // let check = dst+uv.y < 0.1+sin(10*time*uv.x) && uv.y*uv.y+uv.x*uv.x > dst-0.1;
  let check = dst+uv.y < 0.1+sin(10*time*uv.x) && uv.y*uv.y+uv.x*uv.x > dst-0.1;

  return select(vec4f(0,0,0,1), color, check); 
}`

const smoothstep = tgpu['~unstable'].fn([d.f32, d.f32, d.f32], d.f32)((edge0, edge1, x) => {
  const t = std.clamp((x-edge0)/(edge1-edge0), 0, 1);
  return t*t*(3.0 - 2.0 * t);
})

const plotLine = tgpu['~unstable'].fn([d.vec2f], d.f32)((inVec) => {
  return smoothstep(0.02, 0.0, std.abs(inVec.y - inVec.x));
})

const plotPoly2 = tgpu['~unstable'].fn([d.vec2f, d.f32], d.f32)((st, pct) => {
  return smoothstep(pct-0.02, pct, st.y) -
         smoothstep(pct, pct+0.02, st.y)
})

const fragment1 = tgpu['~unstable'].fragmentFn({
  in: basicVertexOut, 
  out: d.vec4f,
})((input) => {
  const st: d.v2f = input.uv;

  let y = st.x;
  let color = d.vec3f(y);
  let pct = plotLine(st);
  color = std.mix(color, d.vec3f(0.855, 1.0, 0.342), d.vec3f(pct)) //e1 * (1-e3) + e2*e3
  // color = color*(1.0-pct)+pct*d.vec3f(0.0,1.0,0.0);

  y = std.pow(st.x, 0.5)
  pct = plotPoly2(st, y);
  color = std.mix(color, d.vec3f(0.0, 1.0, 1), d.vec3f(pct))

  return d.vec4f(color, 1.0)
})
// ((input) => {
//   const red  = d.vec4f(1, 0, 0, 1)
//   const cyan = d.vec4f(0, 1, 1, 1)
  
//   const grid = d.vec2u(input.position.x/16, input.position.y/16)
//   const checker = (grid.x + grid.y) % 2 === 1

//   if (checker) return cyan
//   return red
// })