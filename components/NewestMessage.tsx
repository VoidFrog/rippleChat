import React, { useRef } from "react";
import { Dimensions, StyleSheet, Text } from "react-native";
import Animated, {
  ReduceMotion,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import Avatar from "./Avatar";

interface NewestMessageComponentProps {
  message: SharedValue<string>;
  scrollY: SharedValue<number>;
  contentHeight: SharedValue<number>;
  scrollViewHeight: SharedValue<number>;
  isOwn: SharedValue<boolean>;
  avatarUri: SharedValue<string>;
  rippleCoordsShared: SharedValue<{ x: number; y: number }>;
}

const MAX_BUBBLE_WIDTH = Dimensions.get("window").width * 0.75;

const NewestMessageComponent: React.FC<NewestMessageComponentProps> = ({
  message,
  scrollY,
  contentHeight,
  scrollViewHeight,
  isOwn,
  avatarUri,
  rippleCoordsShared,
}) => {
  const bubbleHeight = useSharedValue(0);
  const bubbleWidth = useSharedValue(0);
  const hasMeasured = useRef(false);
  const finalMeasuredWidth = useSharedValue(0);

  const animatedWrapperStyle = useAnimatedStyle(() => {
    "worklet";

    // console.log(bubbleHeight.value);

    const translateY =
      contentHeight.value -
      scrollViewHeight.value -
      scrollY.value -
      bubbleHeight.value -
      56;
    //-56 accounts for the current margin between the elements
    //tracking accumulative margin seems too hard for this demo

    return {
      position: "relative",
      bottom: -translateY,
      alignSelf: isOwn.value ? "flex-end" : "flex-start",
      marginRight: isOwn.value ? 10 : undefined,
      marginLeft: isOwn.value ? undefined : 10,
      marginBottom: 6,
      zIndex: 2,
      flexDirection: "row",
      alignItems: "flex-end",
    };
  });

  const animatedBubbleWidthStyle = useAnimatedStyle(() => {
    return {
      width: bubbleWidth.value,
      maxWidth: MAX_BUBBLE_WIDTH,
    };
  });

  const animatedTextWrapperStyle = useAnimatedStyle(() => {
    return {
      width: MAX_BUBBLE_WIDTH - 24,
    };
  });

  return (
    <Animated.View
      style={[animatedWrapperStyle]}
      onLayout={(e) => {
        const layout = e.nativeEvent.layout;
        rippleCoordsShared.value = {
          x: layout.x + layout.width / 2,
          y: layout.y + layout.height,
        };

        bubbleHeight.value = layout.height;
      }}
    >
      {!isOwn.value && avatarUri.value && <Avatar uri={avatarUri.value} />}
      <Animated.View
        style={[
          { overflow: "hidden", width: 0 },
          styles.bubble,
          animatedBubbleWidthStyle,
          isOwn.value ? styles.ownBubble : styles.otherBubble,
        ]}
      >
        <Animated.View style={animatedTextWrapperStyle}>
          <Text
            style={[
              styles.messageText,
              isOwn.value ? styles.ownText : styles.otherText,
            ]}
          >
            {message.value}
          </Text>
        </Animated.View>
      </Animated.View>
      <Animated.View
        style={[
          styles.bubble,
          { position: "absolute", opacity: 0, zIndex: -1 },
          isOwn.value ? styles.ownBubble : styles.otherBubble,
        ]}
        onLayout={(e) => {
          if (!hasMeasured.current) {
            const layout = e.nativeEvent.layout;
            hasMeasured.current = true;
            finalMeasuredWidth.value = layout.width;

            bubbleWidth.value = withSpring(layout.width, {
              damping: 60,
              stiffness: 900,
              overshootClamping: false,
              energyThreshold: 1e-5,
              reduceMotion: ReduceMotion.System,
            });
          }
        }}
      >
        <Text
          style={[
            styles.messageText,
            isOwn.value ? styles.ownText : styles.otherText,
          ]}
        >
          {message.value}
        </Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 6,
  },
  bubble: {
    maxWidth: MAX_BUBBLE_WIDTH,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  ownBubble: {
    backgroundColor: "#0084ff",
    // backgroundColor: "#442854ff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: "#e4e6eb",
    // backgroundColor: "#581f5dff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    position: "relative",
  },
  ownText: {
    color: "#ffffff",
  },
  otherText: {
    color: "#050505",
  },
});

export default React.memo(NewestMessageComponent);
