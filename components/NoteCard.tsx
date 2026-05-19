import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Note } from "../types/note";
import { formatNoteDate } from "../utils/date";

type NoteCardProps = {
  note: Note;
  onPress: () => void;
};

export function NoteCard({ note, onPress }: NoteCardProps) {
  const title = note.title.trim() || "Untitled Note";
  const preview = note.body.trim() || "No additional text";

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {note.pinned ? "📌 " : ""}
          {title}
        </Text>
      </View>

      <Text style={styles.preview} numberOfLines={2}>
        {preview}
      </Text>

      <Text style={styles.date}>{formatNoteDate(note.updatedAt)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
  },
  header: {
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
  },
  preview: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  date: {
    marginTop: 6,
    fontSize: 12,
    color: "#999",
  },
});
