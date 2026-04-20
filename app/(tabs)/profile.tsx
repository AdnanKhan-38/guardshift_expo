import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, ApiClientError } from "@/lib/api";
import { signOut, useSession } from "@/lib/auth-client";

interface MeProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean | null;
  contractedHours: number | null;
}

interface MyLocation {
  id: string;
  name: string;
  color: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { data } = useSession();
  const [me, setMe] = useState<MeProfile | null>(null);
  const [locations, setLocations] = useState<MyLocation[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [profile, locs] = await Promise.all([
        api<MeProfile>("/api/v1/me"),
        api<MyLocation[]>("/api/v1/me/locations"),
      ]);
      setMe(profile);
      setLocations(locs);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSignOut() {
    try {
      await signOut();
      router.replace("/sign-in");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : String(e));
    }
  }

  const displayName = me?.name ?? data?.user.name ?? "—";
  const displayEmail = me?.email ?? data?.user.email ?? "—";
  const displayRole = me?.role ?? (data?.user as { role?: string })?.role ?? "employee";

  return (
    <SafeAreaView style={styles.flex} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>
              {(displayName[0] ?? displayEmail[0] ?? "?").toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{displayEmail}</Text>
          <View style={styles.roleRow}>
            <View style={styles.rolePill}>
              <Text style={styles.rolePillText}>{displayRole}</Text>
            </View>
            {me?.active === false && (
              <View style={[styles.rolePill, styles.inactivePill]}>
                <Text style={styles.inactiveText}>Inactive</Text>
              </View>
            )}
          </View>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Contracted hours</Text>
          {me === null && !error ? (
            <ActivityIndicator size="small" />
          ) : (
            <Text style={styles.sectionValue}>
              {me?.contractedHours != null
                ? `${me.contractedHours} h / week`
                : "Not set"}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            My locations{locations ? ` · ${locations.length}` : ""}
          </Text>
          {locations === null && !error ? (
            <ActivityIndicator size="small" />
          ) : locations && locations.length > 0 ? (
            <View style={styles.pills}>
              {locations.map((l) => (
                <View
                  key={l.id}
                  style={[styles.locPill, { borderColor: l.color }]}>
                  <View
                    style={[styles.locDot, { backgroundColor: l.color }]}
                  />
                  <Text style={styles.locPillText}>{l.name}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.sectionValueMuted}>
              You&apos;re not on any roster yet.
            </Text>
          )}
        </View>

        <Pressable
          onPress={handleSignOut}
          style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fafafa" },
  scroll: { padding: 20, gap: 16, paddingBottom: 40 },
  card: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    gap: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e5e5",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  avatarLetter: { color: "#fff", fontSize: 28, fontWeight: "700" },
  name: { fontSize: 20, fontWeight: "700", color: "#111" },
  email: { fontSize: 13, color: "#555" },
  roleRow: { flexDirection: "row", gap: 6, marginTop: 8 },
  rolePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#111",
  },
  rolePillText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  inactivePill: { backgroundColor: "#b91c1c" },
  inactiveText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  error: {
    color: "#b91c1c",
    backgroundColor: "#fee2e2",
    padding: 12,
    borderRadius: 8,
    fontSize: 13,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e5e5",
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionValue: { fontSize: 15, color: "#111", fontWeight: "600" },
  sectionValueMuted: { fontSize: 13, color: "#999" },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  locPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "#fff",
  },
  locDot: { width: 8, height: 8, borderRadius: 4 },
  locPillText: { fontSize: 12, fontWeight: "500", color: "#111" },
  signOut: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#b91c1c",
    alignItems: "center",
  },
  pressed: { opacity: 0.7 },
  signOutText: { color: "#b91c1c", fontWeight: "600" },
});
