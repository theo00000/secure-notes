import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, TextInput, View } from "react-native";

export default function NoteEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Note ID: {id}</Text>

      <TextInput placeholder="Title" style={styles.titleInput} />

      <TextInput
        placeholder="Write something..."
        style={styles.bodyInput}
        multiline
        textAlignVertical="top"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  label: {
    fontSize: 12,
    color: "#999",
    marginBottom: 12,
  },
  titleInput: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 16,
  },
  bodyInput: {
    flex: 1,
    fontSize: 17,
    lineHeight: 24,
  },
});
