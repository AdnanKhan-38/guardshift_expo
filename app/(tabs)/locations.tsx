import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, ApiClientError } from "@/lib/api";

interface MyLocation {
  id: string;
  name: string;
  color: string;
}

export default function LocationsScreen() {
  const [data, setData] = useState<MyLocation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const rows = await api<MyLocation[]>("/api/v1/me/locations");
      setData(rows);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Failed to load");
      setData([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <SafeAreaView style={styles.flex} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>My locations</Text>
        <Text style={styles.subtitle}>
          Sites you&apos;re rostered on. Managers schedule you here.
        </Text>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
      {data === null && !error && (
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      )}

      <FlatList
        data={data ?? []}
        keyExtractor={(l) => l.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          data && data.length === 0 && !error ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                You&apos;re not on any location&apos;s roster yet. A manager has to
                add you before you can be scheduled.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => <LocationRow location={item} />}
      />
    </SafeAreaView>
  );
}

function LocationRow({ location }: { location: MyLocation }) {
  return (
    <View style={styles.row}>
      <View
        style={[styles.swatch, { backgroundColor: location.color }]}
      />
      <View style={styles.rowText}>
        <Text style={styles.name}>{location.name}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fafafa" },
  header: {
    padding: 16,
    gap: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e5e5",
    backgroundColor: "#fff",
  },
  title: { fontSize: 22, fontWeight: "700", color: "#111" },
  subtitle: { fontSize: 13, color: "#666" },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  error: {
    color: "#b91c1c",
    backgroundColor: "#fee2e2",
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    fontSize: 13,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e5e5",
    backgroundColor: "#fff",
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  rowText: { flex: 1 },
  name: { fontSize: 15, fontWeight: "600", color: "#111" },
  empty: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderStyle: "dashed",
  },
  emptyText: { fontSize: 13, color: "#666", textAlign: "center", lineHeight: 18 },
});
