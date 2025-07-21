import { getOrInitRoot } from "@/scripts/roots";
import { noiseFragment } from "@/shaders/fragment/chaotic";
import basicVertex from "@/shaders/vertex/basicVertex";
import { useEffect, useLayoutEffect, useRef } from "react";
import { Dimensions, SafeAreaView, View } from "react-native";
import { Canvas, useDevice, useGPUContext } from "react-native-wgpu";
import { TgpuRoot } from "typegpu";
import * as d from "typegpu/data";
import * as utils from "../shaders/utils/utils";

const fingerPositionValue = [0, 0];
const rippleValues = {
  timeStart: performance.now() / 1000,
  ttl: 1000,
  r: 0.4,
  center: [0, 0],
};

export function Triangle() {
  const frameRef = useRef<number | null>(null);
  const panResponder = utils.useTouchAndDragPanResponder(fingerPositionValue);

  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  const { device = null } = useDevice();
  const root = device ? getOrInitRoot(device) : null;
  const { ref, context } = useGPUContext();

  const wHeight = Dimensions.get("window").height - 80;
  const wWidth = Dimensions.get("window").width;

  useLayoutEffect(() => {});

  useEffect(() => {
    if (!root || !device || !context) {
      return;
    }
    context.configure({
      device: device,
      format: presentationFormat,
      alphaMode: "premultiplied",
    });

    const timeStart = performance.now();
    const { time, fingerPosition, rippleBuffer } = createBuffers(
      root,
      timeStart,
      wWidth,
      wHeight
    );
    const resolutionBuffer = root
      .createBuffer(d.vec2f, d.vec2f(wWidth, wHeight))
      .$usage("uniform");

    const timePosBindGroup = root.createBindGroup(
      utils.timePosBindGroupLayout,
      {
        time: time,
        fingerPosition: fingerPosition,
      }
    );
    const resolutionBindGroup = root.createBindGroup(
      utils.resolutionBindGroupLayout,
      {
        resolution: resolutionBuffer,
      }
    );
    const rippleBindGroup = root.createBindGroup(utils.rippleBindGroupLayout, {
      ripple: rippleBuffer,
    });

    const pipeline = root["~unstable"]
      .withVertex(basicVertex, {})
      .withFragment(noiseFragment, {
        format: presentationFormat,
      })
      .createPipeline()
      .with(utils.timePosBindGroupLayout, timePosBindGroup)
      .with(utils.resolutionBindGroupLayout, resolutionBindGroup)
      .with(utils.rippleBindGroupLayout, rippleBindGroup);

    const render = () => {
      console.log(
        (performance.now() - timeStart) / 1000.0,
        rippleValues.timeStart,
        performance.now()
      );

      time.write(d.f32((performance.now() - timeStart) / 1000.0));
      fingerPosition.write(
        d.vec2f(fingerPositionValue[0], fingerPositionValue[1])
      );
      if (
        rippleValues.center[0] !== fingerPositionValue[0] &&
        rippleValues.center[1] !== fingerPositionValue[1]
      ) {
        rippleValues.center[0] = fingerPositionValue[0];
        rippleValues.center[1] = fingerPositionValue[1];

        rippleBuffer.write({
          timeStart: d.f32(performance.now() - timeStart),
          ttl: rippleValues.ttl,
          r: rippleValues.r,
          center: d.vec2f(rippleValues.center[0], rippleValues.center[1]),
        });
      }

      pipeline
        .withColorAttachment({
          view: context.getCurrentTexture().createView(),
          clearValue: [0, 0, 0, 0],
          loadOp: "clear",
          storeOp: "store",
        })
        .draw(6);

      context.present();
      frameRef.current = requestAnimationFrame(render);
    };

    frameRef.current = requestAnimationFrame(render);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [root, device, context, presentationFormat]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View
        onTouchStart={(ev) => {
          fingerPositionValue[0] = ev.nativeEvent.pageX / wWidth;
          fingerPositionValue[1] = ev.nativeEvent.pageY / wHeight;
          rippleValues.timeStart = performance.now() / 1000;
          console.log(rippleValues.center, "rippleValues");
        }}
        {...panResponder.panHandlers}
      >
        <Canvas
          ref={ref}
          style={{
            aspectRatio: wWidth / wHeight,
          }}
          transparent
        />
      </View>
    </SafeAreaView>
  );
}

const createBuffers = (
  root: TgpuRoot,
  timeStart: number,
  wWidth: number,
  wHeight: number
) => {
  const time = root
    .createBuffer(d.f32, d.f32(timeStart - performance.now()))
    .$usage("uniform");
  const fingerPosition = root
    .createBuffer(d.vec2f, d.vec2f(wWidth / 2, wHeight / 2))
    .$usage("uniform");

  const rippleBuffer = root
    .createBuffer(utils.rippleSchema, {
      timeStart: d.f32(rippleValues.timeStart),
      ttl: d.f32(rippleValues.ttl),
      r: d.f32(rippleValues.r),
      center: d.vec2f(rippleValues.center[0], rippleValues.center[1]),
    })
    .$usage("uniform");

  return { time, fingerPosition, rippleBuffer };
};
