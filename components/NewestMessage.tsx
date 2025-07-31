import React from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
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

  const animatedStyle = useAnimatedStyle(() => {
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

  return (
    <Animated.View
      style={[animatedStyle]}
      onLayout={(e) => {
        const layout = e.nativeEvent.layout;
        rippleCoordsShared.value = {
          x: layout.x + layout.width,
          y: layout.y + layout.height,
        };
        bubbleHeight.value = e.nativeEvent.layout.height;
      }}
    >
      {!isOwn.value && avatarUri.value && <Avatar uri={avatarUri.value} />}
      <View
        style={[
          styles.bubble,
          isOwn.value ? styles.ownBubble : styles.otherBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            isOwn.value ? styles.ownText : styles.otherText,
          ]}
        >
          {message.value}
        </Text>
      </View>
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
    // backgroundColor: "#0084ff",
    backgroundColor: "#6f3a7bff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: "#e4e6eb",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownText: {
    color: "#ffffff",
  },
  otherText: {
    color: "#050505",
  },
});

export default React.memo(NewestMessageComponent);
