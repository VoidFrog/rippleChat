import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface MessageComponentProps {
  message: string;
}

const MessageComponent: React.FC<MessageComponentProps> = ({ message }) => {
  return (
    <View style={styles.messageContainer}>
      <Text style={styles.messageText}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    marginHorizontal: 10,
  },
  messageText: {
    color: "#333",
  },
});

export default MessageComponent;
