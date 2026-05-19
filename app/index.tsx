import { Link, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { NoteCard } from "../components/NoteCard";
import { initDatabase } from "../services/db/database";
import { createEmptyNote, getAllNotes } from "../services/db/notesRepository";
import type { Note } from "../types/note";

export default function HomeScreen() {
  const router = useRouter();

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadNotes() {
    try {
      setLoading(true);
      await initDatabase();
      const result = await getAllNotes();
      setNotes(result);
    } catch (error) {
      console.error("Failed to load notes:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateNote() {
    try {
      const note = await createEmptyNote();
      router.push(`note/${note.id}`);
    } catch (error) {
      console.error("Failed to create note:", error);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, []),
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Secure Notes</Text>

        <Pressable style={styles.addButton} onPress={handleCreateNote}>
          <Text style={styles.addButtonText}>+ New Note</Text>
        </Pressable>
      </View>

      <View style={styles.nav}>
        <Link href="/benchmark" style={styles.navLink}>
          Benchmark
        </Link>
      </View>

      {loading ? (
        <ActivityIndicator />
      ) : notes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No Notes Yet</Text>
          <Text style={styles.emptyText}>
            Tap + to create your first note.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NoteCard
              note={item}
              onPress={() => router.push(`/note/${item.id}`)}
            />
          )}
        />
      )}
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
  header: {
    marginTop: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    marginBottom: 8,
    color: "#FFFFFF",
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFD60A",
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    fontSize: 24,
    color: "#121212",
  },
  nav: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  navLink: {
    fontSize: 16,
    color: "#FFD60A",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 15,
    color: "#777",
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
