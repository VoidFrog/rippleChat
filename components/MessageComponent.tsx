import React, { useEffect } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import Avatar from "./Avatar";

interface MessageComponentProps {
  message: string;
  isOwn: boolean;
  avatarUri?: string;
  isLast?: boolean;
}

const MAX_BUBBLE_WIDTH = Dimensions.get("window").width * 0.75;

const MessageComponent: React.FC<MessageComponentProps> = ({
  message,
  isOwn,
  avatarUri,
  isLast,
}) => {
  const isLastShared = useSharedValue(isLast || false);

  const isLastAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: isLastShared.value ? 0 : 1,
    };
  });

  useEffect(() => {
    setTimeout(() => {
      isLastShared.value = false;
    }, 1500);
  }, []);

  return (
    <Animated.View
      style={[
        // isLast ? { opacity: 0 } : { opacity: 1 },
        isLastAnimatedStyle,
        styles.messageWrapper,
        isOwn ? styles.ownWrapper : styles.otherWrapper,
      ]}
    >
      {!isOwn && avatarUri && <Avatar uri={avatarUri} />}
      <View
        style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}
      >
        <Text
          style={[
            styles.messageText,
            isOwn ? styles.ownText : styles.otherText,
          ]}
        >
          {message}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  messageWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginVertical: 6,
    paddingHorizontal: 10,
  },
  ownWrapper: {
    justifyContent: "flex-end",
    alignSelf: "flex-end",
  },
  otherWrapper: {
    justifyContent: "flex-start",
    alignSelf: "flex-start",
  },
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
export default React.memo(MessageComponent);
