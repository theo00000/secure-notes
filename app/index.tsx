import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Secure Notes</Text>
      <View style={styles.menu}>
        <Link href="/note/new" style={styles.link}>
          + New Note
        </Link>
        <Link href="/benchmark" style={styles.link}>
          Benchmark
        </Link>
        <Link href="/settings" style={styles.link}>
          Settings
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#121212",
    justifyContent: "center",
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    marginBottom: 8,
    color: "#FFFFFF",
  },
  menu: {
    marginTop: 16,
    gap: 12,
  },
  link: {
    fontSize: 18,
    color: "#007AFF",
  },
});
