import Avatar from "@/components/Avatar";
import MessageComponent from "@/components/MessageComponent";
import NewestMessage from "@/components/NewestMessage";
import { getOrInitRoot } from "@/scripts/roots";
import { textureExampleFragment } from "@/shaders/fragment/textureExample";
import * as utils from "@/shaders/utils/utils";
import textureVertex from "@/shaders/vertex/textureVertex";
import { Feather } from "@expo/vector-icons";
import { Asset } from "expo-asset";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  findNodeHandle,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  const scrollViewRef = useRef<Animated.ScrollView | null>(null);
  const timeStart = performance.now();
  const [showInteractableUI, setShowInteractableUI] = useState<boolean>(true);
  const [showInteractableScrollView, setShowInteractableScrollView] =
    useState<boolean>(true);
  const [isSnapshotBeingTaken, setIsSnapshotBeingTaken] =
    useState<boolean>(false);
  const resetInteractibilityRef = useRef<number>(null);
  const insets = useSafeAreaInsets();

  const addMessage = useCallback((newMessage: string) => {
    setMessageHistory((prev) => [...prev, newMessage]);
  }, []);

  //shader setup
  const frameRef = useRef<number | null>(null);

  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  const { device = null } = useDevice();
  const root = device ? getOrInitRoot(device) : null;
  const { ref, context } = useGPUContext();

  const [texture, setTexture] = useState<TgpuTexture | null>(null);

  const [imageURI, setImageURI] = useState<string | null>(null);
  const viewRef = useRef<View | null>(null);

  const wHeight = Dimensions.get("window").height - 80;
  const wWidth = Dimensions.get("window").width;

  const contentHeight = useSharedValue(0);
  const scrollViewHeight = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const newestMessageValue = useSharedValue("");
  const isOwn = useSharedValue(false);
  const avatarUriShared = useSharedValue("");
  const rippleCoordsShared = useSharedValue({ x: 0, y: 0 });

  //change it so it fetches the resource earlier
  const [avatarURI, setAvatarURI] = useState<string | null>(); // placeholder

  const onContentSizeChange = useCallback((width: number, height: number) => {
    contentHeight.value = height;
    scrollViewRef.current?.scrollToEnd({ animated: false });
  }, []);

  const onLayout = useCallback(
    (event: { nativeEvent: { layout: { height: number } } }) => {
      scrollViewHeight.value = event.nativeEvent.layout.height;
    },
    []
  );

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const handleSendMessage = useCallback(() => {
    console.log(inputValue, "inputValue");
    const input = inputValue.trim();
    if (input === "") {
      setIsSnapshotBeingTaken(false);
      return;
    }

    setInputValue("");
    newestMessageValue.value = input;
    isOwn.value = !isOwn.value;
    setTimeout(() => {
      addMessage(input);
    }, 10);
  }, [inputValue, addMessage]);

  const takeSnapshot = useCallback(async () => {
    if (!viewRef.current || !root) return;

    try {
      const uri = await captureRef(viewRef, {
        format: "png",
        // quality: 0.5,
      });
      setImageURI(uri);
    } catch (error) {
      console.error("snapshot: FAILED\n", error);
    }
  }, [root]);

  const loadImageAsTexture = useCallback(
    async (imageURI: string) => {
      if (!root) return;

      const ast = Asset.fromURI(imageURI);
      await ast.downloadAsync();
      const brokenFileUri = ast.localUri || ast.uri;

      const response = await fetch(brokenFileUri);
      const blob = await response.blob();
      const imageBitmap = await createImageBitmap(blob);

      const [imgWidth, imgHeight] = [imageBitmap.width, imageBitmap.height];

      const texture = root["~unstable"]
        .createTexture({
          size: [imgWidth, imgHeight],
          format: "rgba8unorm",
        })
        .$usage("sampled", "render");

      setTexture(texture);
      root.device.queue.copyExternalImageToTexture(
        { source: imageBitmap },
        { texture: root.unwrap(texture) },
        [imgWidth, imgHeight]
      );
    },
    [root]
  );

  const updateTexture = useCallback(
    async (imageURI: string) => {
      if (!root || !texture) return;

      const ast = Asset.fromURI(imageURI);
      await ast.downloadAsync();
      const brokenFileUri = ast.localUri || ast.uri;

      const response = await fetch(brokenFileUri);
      const blob = await response.blob();
      const imageBitmap = await createImageBitmap(blob);

      root.device.queue.copyExternalImageToTexture(
        { source: imageBitmap },
        { texture: root.unwrap(texture) },
        [imageBitmap.width, imageBitmap.height]
      );

      setIsSnapshotBeingTaken(false);
    },
    [root, texture]
  );

  // useAnimatedReaction(
  //   () => rippleCoordsShared.value,
  //   (currentValue, previousValue) => {
  //     fingerPositionValue[0] = currentValue.x;
  //     fingerPositionValue[1] = currentValue.y;
  //   }
  // );

  useEffect(() => {
    const loadAvatar = async () => {
      try {
        const avatarUrl = "https://avatar.iran.liara.run/public";
        const asset = Asset.fromURI(avatarUrl);
        await asset.downloadAsync();

        setAvatarURI(asset.localUri || asset.uri);
        avatarUriShared.value = asset.localUri || asset.uri;
      } catch (error) {
        console.warn("failed to load avatar image", error);
        setAvatarURI(null);
      }
    };
    loadAvatar();
  }, []);

  useEffect(() => {
    takeSnapshot();
  }, [root, device, context, messageHistory, takeSnapshot, avatarURI]);

  useEffect(() => {
    if (!root || !device || !imageURI) return;

    if (!texture) loadImageAsTexture(imageURI);
    else updateTexture(imageURI);
  }, [root, device, imageURI, texture]);

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
    };

    frameRef.current = requestAnimationFrame(render);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [root, device, context, presentationFormat, texture, wWidth, wHeight]);

  return (
    <View
      style={{ flex: 1, paddingTop: insets.top }}
      onTouchStart={(ev) => {
        setShowInteractableUI(false);
      }}
      onTouchEnd={(ev) => {
        // takeSnapshot();
        if (resetInteractibilityRef.current)
          clearTimeout(resetInteractibilityRef.current);

        setShowInteractableScrollView(false);

        if (
          (ev.nativeEvent.target as unknown as number) !==
          findNodeHandle(sendButtonRef.current)
        ) {
          fingerPositionValue[0] = ev.nativeEvent.pageX / wWidth;
          fingerPositionValue[1] = ev.nativeEvent.pageY / wHeight;
        }

        resetInteractibilityRef.current = setTimeout(() => {
          setShowInteractableUI(true);
          setShowInteractableScrollView(true);
        }, 1000);
      }}
      ref={viewRef}
    >
      <View style={styles.mainContainer}>
        <View style={styles.header}>
          {avatarURI && <Avatar uri={avatarURI} />}
          <View style={styles.userInfo}>
            <Text style={styles.userName}>John Doe</Text>
            <Text style={styles.userStatus}>Active now</Text>
          </View>
          <View style={styles.headerIcons}>
            <Feather
              name="phone"
              size={20}
              color="#1c1e21"
              style={styles.iconButton}
            />
            <Feather
              name="video"
              size={20}
              color="#1c1e21"
              style={styles.iconButton}
            />
            <Feather
              name="info"
              size={20}
              color="#1c1e21"
              style={styles.iconButton}
            />
          </View>
        </View>

        <Animated.ScrollView
          style={[
            styles.messageHistoryContainer,
            {
              zIndex:
                isSnapshotBeingTaken ||
                showInteractableUI ||
                showInteractableScrollView
                  ? 1
                  : 0,
            },
          ]}
          ref={scrollViewRef}
          onContentSizeChange={onContentSizeChange}
          onScroll={onScroll}
          onLayout={onLayout}
          scrollEventThrottle={16}
        >
          {messageHistory.map((message, i) => {
            return (
              <MessageComponent
                message={message}
                key={i}
                isOwn={i % 2 === 0}
                avatarUri={avatarURI ? avatarURI : undefined}
              />
            );
          })}
        </Animated.ScrollView>
        {messageHistory.length > 0 && !isSnapshotBeingTaken && (
          <NewestMessage
            message={newestMessageValue}
            scrollViewHeight={scrollViewHeight}
            scrollY={scrollY}
            contentHeight={contentHeight}
            isOwn={isOwn}
            avatarUri={avatarUriShared}
            rippleCoordsShared={rippleCoordsShared}
          />
        )}

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
              onPressIn={(e) => {
                setIsSnapshotBeingTaken(true);
                handleSendMessage();

                // setTimeout(() => {
                //   if (
                //     rippleCoordsShared.value.x !== 0 &&
                //     rippleCoordsShared.value.y !== 0
                //   ) {
                //     fingerPositionValue[0] =
                //       rippleCoordsShared.value.x / wWidth;
                //     fingerPositionValue[1] =
                //       rippleCoordsShared.value.y / wHeight;
                //   }
                //   console.log(rippleCoordsShared.value);
                // }, 10);
              }}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
      <Canvas
        ref={ref}
        style={[
          {
            aspectRatio: wWidth / wHeight,
            opacity: isSnapshotBeingTaken ? 0 : 1,
          },
          styles.absolute,
        ]}
        transparent
      />
    </View>
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

const styles = StyleSheet.create({
  absolute: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    width: "100%",
    isolation: "isolate",
  },
  mainContainer: {
    flex: 1,
    flexDirection: "column",
    width: "100%",
    backgroundColor: "#ffffff",
  },
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f7f7f7",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
    justifyContent: "center",
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1c1e21",
  },
  userStatus: {
    fontSize: 12,
    color: "#65676b",
  },
  messageHistoryContainer: {
    flex: 1,
    width: "100%",
    backgroundColor: "#ffffff",
    paddingTop: 10,
    marginBottom: 60,
  },
  sendMessageBar: {
    width: "100%",
    backgroundColor: "#f0f0f0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
  },
  inputField: {
    zIndex: 2,
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
    color: "#000",
    fontSize: 16,
  },
  sendButton: {
    zIndex: 2,
    marginLeft: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#0084ff",
    borderRadius: 20,
  },
  sendButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
    pointerEvents: "none",
  },
  headerIcons: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  iconButton: {
    paddingHorizontal: 8,
  },
});
