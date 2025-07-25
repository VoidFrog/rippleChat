import { FullscreenShader } from "@/components/fullscreenShader";
import { SafeAreaView, StyleSheet } from "react-native";

const Doodle = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FullscreenShader />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  whiteText: {
    color: "#ffffff",
  },
});

export default Doodle;
