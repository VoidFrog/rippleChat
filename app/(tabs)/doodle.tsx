import { Triangle } from "@/components/Triangle"
import { SafeAreaView, StyleSheet, Text } from "react-native"

const Doodle = () => {
  return (
    <SafeAreaView style={{flex: 1}}>
      <Text style={styles.whiteText}>mreow</Text>
      <Triangle />
    </SafeAreaView>
  )
}


const styles = StyleSheet.create({
  whiteText: {
    color: "#ffffff"
  }
})


export default Doodle