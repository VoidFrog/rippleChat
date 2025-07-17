import { Triangle } from "@/components/Triangle";
import { SafeAreaView, StyleSheet } from "react-native";

const Doodle = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Triangle />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  whiteText: {
    color: "#ffffff",
  },
});

export default Doodle;
