import { getOrInitRoot } from "@/scripts/roots";
import hsbSomething from "@/shaders/fragment/hsb";
import basicVertex from "@/shaders/vertex/basicVertex";
import { useEffect, useRef } from "react";
import { Dimensions, SafeAreaView, View } from "react-native";
import { Canvas, useDevice, useGPUContext } from "react-native-wgpu";
import { TgpuRoot } from "typegpu";
import * as d from "typegpu/data";
import * as utils from "../shaders/utils/utils";

const fingerPositionValue = [0, 0];

export function Triangle() {
  const frameRef = useRef<number | null>(null);
  const panResponder = utils.useTouchAndDragPanResponder(fingerPositionValue);

  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  const { device = null } = useDevice();
  const root = device ? getOrInitRoot(device) : null;
  const { ref, context } = useGPUContext();

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
    const { time, fingerPosition } = createBuffers(root, timeStart);
    const timePosBindGroup = root.createBindGroup(
      utils.timePosBindGroupLayout,
      {
        time: time,
        fingerPosition: fingerPosition,
      }
    );

    const pipeline = root["~unstable"]
      .withVertex(basicVertex, {})
      .withFragment(hsbSomething, {
        format: presentationFormat,
      })
      .createPipeline()
      .with(utils.timePosBindGroupLayout, timePosBindGroup);

    const render = () => {
      time.write(d.f32((performance.now() - timeStart) * 0.001));
      fingerPosition.write(
        d.vec2f(fingerPositionValue[0], fingerPositionValue[1])
      );

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
    <SafeAreaView style={{ width: "100%", height: "100%", flex: 1 }}>
      <View
        onTouchStart={(ev) => {
          fingerPositionValue[0] =
            ev.nativeEvent.pageX / Dimensions.get("window").width;
          fingerPositionValue[1] =
            ev.nativeEvent.pageY / Dimensions.get("window").height;
        }}
        {...panResponder.panHandlers}
      >
        <Canvas
          ref={ref}
          style={{ width: "100%", height: "100%" }}
          transparent
        />
      </View>
    </SafeAreaView>
  );
}

const createBuffers = (root: TgpuRoot, timeStart: number) => {
  const time = root
    .createBuffer(d.f32, d.f32(timeStart - performance.now()))
    .$usage("uniform");
  const fingerPosition = root
    .createBuffer(
      d.vec2f,
      d.vec2f(
        Dimensions.get("window").width / 2,
        Dimensions.get("window").height
      )
    )
    .$usage("uniform");

  return { time, fingerPosition };
};
