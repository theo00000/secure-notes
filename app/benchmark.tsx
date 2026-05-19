import { StyleSheet, Text, View } from "react-native";

export default function BenchmarkScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Benchmark</Text>

      <Text style={styles.subtitle}>
        Nanti halaman ini akan menguji AES + ECC dan AES + RSA.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
});
