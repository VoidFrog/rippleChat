import React from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import Avatar from "./Avatar";

interface MessageComponentProps {
  message: string;
  isOwn: boolean;
  avatarUri?: string;
}

const MAX_BUBBLE_WIDTH = Dimensions.get("window").width * 0.75;

const MessageComponent: React.FC<MessageComponentProps> = ({
  message,
  isOwn,
  avatarUri,
}) => {
  return (
    <View
      style={[
        styles.messageWrapper,
        isOwn ? styles.ownWrapper : styles.otherWrapper,
      ]}
    >
      {/* Show avatar only for others */}
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
    </View>
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
