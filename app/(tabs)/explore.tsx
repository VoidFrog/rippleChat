import { FullscreenShader } from "@/components/fullscreenShader";
import MessageComponent from "@/components/MessageComponent";
import React, { useRef, useState } from "react";
import {
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

export default function TabTwoScreen() {
  const [messageHistory, setMessageHistory] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [rippleDeployCoords, setRippleDeployCoords] = useState<number[]>([]);
  const inputRef = useRef<TextInput | null>(null);
  const sendButtonRef = useRef<View | null>(null);

  const addMessage = (newMessage: string) => {
    setMessageHistory((prev) => [...prev, newMessage]);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.mainContainer}>
        <View style={styles.padTop}></View>
        <View style={styles.rowContainer}>
          <View style={styles.circle}></View>
          <Text style={styles.textWhite}>mreow</Text>
        </View>

        <ScrollView style={styles.messageHistoryContainer}>
          {/* Place your message components here */}
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
              style={styles.inputField}
              showSoftInputOnFocus={true}
              onFocus={() => inputRef.current?.focus()}
            />
            <TouchableOpacity
              ref={sendButtonRef}
              style={styles.sendButton}
              onPress={() => {
                handleSendMessage(inputValue, setInputValue, addMessage);
                if (!sendButtonRef.current) return;
                sendButtonRef.current.measure(
                  (x, y, width, height, pageX, pageY) => {
                    setRippleDeployCoords([
                      pageX + width / 2,
                      pageY + height / 2,
                    ]);
                    console.log("measure", x, y, width, height, pageX, pageY);
                  }
                );
                setIsSending(true);

                //should be changed to passing the setter function
                //in the final component
                //now it doesn't make much sense as it's a dummy
                setTimeout(() => {
                  setIsSending(false);
                }, 50);
                console.log(rippleDeployCoords, isSending);
              }}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
      <View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          opacity: 0.2,
          backfaceVisibility: "hidden",
        }}
      >
        <FullscreenShader
          forceRipple={isSending}
          posX={
            rippleDeployCoords.length > 1 ? rippleDeployCoords[0] : undefined
          }
          posY={
            rippleDeployCoords.length > 1 ? rippleDeployCoords[1] : undefined
          }
        />
      </View>
    </SafeAreaView>
  );
}

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
