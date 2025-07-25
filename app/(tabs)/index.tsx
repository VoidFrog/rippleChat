import { reactLogoImage, screenImage } from "@/assets/imgExports";
import MessageComponent from "@/components/MessageComponent";
import { getOrInitRoot } from "@/scripts/roots";
import { textureExampleFragment } from "@/shaders/fragment/textureExample";
import * as utils from "@/shaders/utils/utils";
import textureVertex from "@/shaders/vertex/textureVertex";
import { Asset } from "expo-asset";
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { captureRef } from "react-native-view-shot";
import { Canvas, useDevice, useGPUContext } from "react-native-wgpu";
import { TgpuRoot, TgpuTexture } from "typegpu";
import * as d from "typegpu/data";

const fingerPositionValue = [0, 0];
const rippleValues = {
  timeStart: performance.now() / 1000,
  ttl: 1000,
  r: 0.4,
  center: [0, 0],
};

export default function HomeScreen() {
  const [messageHistory, setMessageHistory] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const inputRef = useRef<TextInput | null>(null);
  const sendButtonRef = useRef<View | null>(null);
  const timeStart = performance.now();
  const [showInteractableUI, setShowInteractableUI] = useState<boolean>(true);
  const resetInteractibilityRef = useRef<number>(null);

  const addMessage = (newMessage: string) => {
    setMessageHistory((prev) => [...prev, newMessage]);
  };

  //shader setup
  const frameRef = useRef<number | null>(null);
  const panResponder = utils.useTouchAndDragPanResponder(fingerPositionValue);

  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  const { device = null } = useDevice();
  const root = device ? getOrInitRoot(device) : null;
  const { ref, context } = useGPUContext();

  const [texture, setTexture] = useState<TgpuTexture | null>(null);

  const [imageURI, setImageURI] = useState<string | null>(null);
  const viewRef = useRef<View | null>(null);

  const wHeight = Dimensions.get("window").height - 80;
  const wWidth = Dimensions.get("window").width;

  const takeSnapshot = async () => {
    if (!viewRef.current || !root) return;

    try {
      const uri = await captureRef(viewRef, {
        format: "png",
        quality: 0.5,
      });
      console.log("snapshot: SUCCESS");
      setImageURI(uri);
    } catch (error) {
      console.error("snapshot: FAILED\n", error);
    }
  };

  const loadImageAsTexture = async (imageURI: string) => {
    if (!root) return;

    const asset = Asset.fromModule(screenImage);
    await asset.downloadAsync();
    const fileUri = asset.localUri || asset.uri;

    console.log("uri", fileUri, imageURI);
    console.log("screenImage: ", screenImage);

    const ast = Asset.fromURI(imageURI);
    await asset.downloadAsync();
    const brokenFileUri = ast.localUri || asset.uri;

    console.log("broken asset URI: ", brokenFileUri);

    const response = await fetch(fileUri);
    const brokenResponse = await fetch(brokenFileUri);

    const blob = await response.blob();
    const brokenBlob = await brokenResponse.blob();

    console.log(blob.type, brokenBlob.type);

    // const imageBitmap = await createImageBitmap(blob);
    const brokenImageBitmap = await createImageBitmap(brokenBlob);

    console.log("bitmap machen");

    const [imgWidth, imgHeight] = [imageBitmap.width, imageBitmap.height];

    const texture = root["~unstable"]
      .createTexture({
        size: [imgWidth, imgHeight],
        format: "rgba8unorm",
      })
      .$usage("sampled", "render");

    console.log("before loading texture");
    // console.log(texture, root.unwrap(texture));

    setTexture(texture);
    root.device.queue.copyExternalImageToTexture(
      { source: imageBitmap },
      { texture: root.unwrap(texture) },
      [imgWidth, imgHeight]
    );

    console.log("rawr");
  };

  useEffect(() => {
    takeSnapshot();
  }, [root, device, context]);

  useEffect(() => {
    if (!root || !device || !imageURI) return;
    console.log(imageURI);
    loadImageAsTexture(imageURI);
  }, [root, device, imageURI]);

  useEffect(() => {
    if (!root || !device || !context || !texture) {
      return;
    }

    context.configure({
      device: device,
      format: presentationFormat,
      alphaMode: "premultiplied",
    });

    const imageSampler = device.createSampler({
      magFilter: "linear",
      minFilter: "linear",
    });

    //image data setup
    const textureBindGroup = root.createBindGroup(
      utils.textureBindGroupLayout,
      {
        texture: root.unwrap(texture).createView(),
        sampler: imageSampler,
      }
    );

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
      .withVertex(textureVertex, {})
      .withFragment(textureExampleFragment, {
        format: presentationFormat,
      })
      .createPipeline()
      .with(utils.timePosBindGroupLayout, timePosBindGroup)
      .with(utils.resolutionBindGroupLayout, resolutionBindGroup)
      .with(utils.rippleBindGroupLayout, rippleBindGroup)
      .with(utils.textureBindGroupLayout, textureBindGroup);

    const render = () => {
      time.write(d.f32(performance.now() / 1000.0));
      fingerPosition.write(
        d.vec2f(fingerPositionValue[0], fingerPositionValue[1])
      );
      if (
        rippleValues.center[0] !== fingerPositionValue[0] &&
        rippleValues.center[1] !== fingerPositionValue[1]
      ) {
        rippleValues.center[0] = fingerPositionValue[0];
        rippleValues.center[1] = fingerPositionValue[1];

        rippleValues.timeStart = performance.now() / 1000.0;
        rippleBuffer.write({
          timeStart: d.f32(rippleValues.timeStart),
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
      // takeSnapshot();
      // if (imageURI) loadImageAsTexture(root, setTexture, imageURI);
    };

    frameRef.current = requestAnimationFrame(render);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [root, device, context, presentationFormat, texture, wWidth, wHeight]);

  return (
    <SafeAreaView
      style={{ flex: 1 }}
      onTouchStart={(ev) => {
        fingerPositionValue[0] = ev.nativeEvent.pageX / wWidth;
        fingerPositionValue[1] = ev.nativeEvent.pageY / wHeight;
        console.log(rippleValues.center, "rippleValues");
        setShowInteractableUI(false);

        if (resetInteractibilityRef.current)
          clearTimeout(resetInteractibilityRef.current);
        resetInteractibilityRef.current = setTimeout(
          () => setShowInteractableUI(true),
          1500
        );
      }}
      {...panResponder.panHandlers}
    >
      <View ref={viewRef} style={styles.mainContainer}>
        <View style={styles.padTop}></View>
        <View style={styles.rowContainer}>
          <View style={styles.circle}></View>
          <Text style={styles.textWhite}>mreow</Text>
        </View>

        <Image
          source={reactLogoImage}
          style={{ width: 200, height: 200 }}
          resizeMode="cover"
        />

        <ScrollView style={styles.messageHistoryContainer}>
          {messageHistory.map((message, i) => {
            return <MessageComponent key={i} message={message} />;
          })}
        </ScrollView>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ width: "100%", position: "absolute", bottom: 0 }}
        >
          <View style={styles.sendMessageBar}>
            <TextInput
              ref={inputRef}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder="Type a message..."
              placeholderTextColor="#D8D8D8"
              style={[
                styles.inputField,
                showInteractableUI ? { zIndex: 1 } : { zIndex: 0 },
              ]}
              showSoftInputOnFocus={true}
              onFocus={() => inputRef.current?.focus()}
            />
            <TouchableOpacity
              ref={sendButtonRef}
              style={[
                styles.sendButton,
                showInteractableUI ? { zIndex: 1 } : { zIndex: 0 },
              ]}
              onPress={() => {
                handleSendMessage(inputValue, setInputValue, addMessage);
              }}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
      <Canvas
        ref={ref}
        style={{
          aspectRatio: wWidth / wHeight,
          ...styles.absolute,
        }}
        transparent
      />
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

const handleSendMessage = (
  inputValue: string,
  setInputValue: Function,
  addMessage: Function
) => {
  if (inputValue.trim() === "") return;
  addMessage(inputValue.trim());
  setInputValue("");
};

const styles = StyleSheet.create({
  absolute: {
    position: "absolute",
    left: 0,
    top: 0,
    width: "100%",
    opacity: 0.7,
  },
  mainContainer: {
    flex: 1,
    flexDirection: "column",
    width: "100%",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
  },
  padTop: {
    paddingTop: "10%",
    minWidth: "100%",
    backgroundColor: "#292A3A",
  },
  rowContainer: {
    minWidth: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    alignItems: "center",
    backgroundColor: "#564F7A",
  },
  textWhite: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 18,
  },
  circle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#706F8A",
    borderWidth: 2,
    borderColor: "#564F7A",
  },
  messageHistoryContainer: {
    flex: 1,
    width: "100%",
    backgroundColor: "#2F2A47",
    marginBottom: 60,
  },
  sendMessageBar: {
    width: "100%",
    backgroundColor: "#4E4A67",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
  },
  inputField: {
    zIndex: 1,
    flex: 1,
    height: 40,
    borderColor: "#564F7A",
    borderWidth: 1,
    marginLeft: 10,
    paddingLeft: 10,
    borderRadius: 20,
    backgroundColor: "#3C3C5E",
    color: "#EFEFEF",
    fontSize: 16,
  },
  sendButton: {
    zIndex: 1,
    marginRight: 10,
    padding: 10,
    backgroundColor: "#565E75",
    borderRadius: 20,
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
});
