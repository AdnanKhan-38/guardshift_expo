import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { signIn, signOut, signUp, useSession } from "@/lib/auth-client";

export default function AuthScreen() {
  const { data, isPending } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSignUp() {
    setBusy(true);
    const res = await signUp.email({ email, password, name });
    setBusy(false);
    if (res.error) Alert.alert("Sign up failed", String(res.error.message ?? ""));
    else Alert.alert("Signed up", `Welcome ${res.data?.user?.name ?? ""}`);
  }

  async function handleSignIn() {
    setBusy(true);
    const res = await signIn.email({ email, password });
    setBusy(false);
    if (res.error) Alert.alert("Sign in failed", String(res.error.message ?? ""));
    else Alert.alert("Signed in", `Hello ${res.data?.user?.name ?? ""}`);
  }

  async function handleSignOut() {
    setBusy(true);
    await signOut();
    setBusy(false);
  }

  if (isPending) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Better Auth Demo</Text>

      {data ? (
        <View style={styles.card}>
          <Text style={styles.label}>Signed in as</Text>
          <Text style={styles.value}>{data.user.name}</Text>
          <Text style={styles.value}>{data.user.email}</Text>
          <Pressable
            style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
            onPress={handleSignOut}
            disabled={busy}>
            <Text style={styles.btnText}>Sign out</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.card}>
          <TextInput
            placeholder="Name (sign up only)"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            style={styles.input}
          />
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />
          <View style={styles.row}>
            <Pressable
              style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
              onPress={handleSignUp}
              disabled={busy}>
              <Text style={styles.btnText}>Sign up</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.btn, styles.btnAlt, pressed && styles.btnPressed]}
              onPress={handleSignIn}
              disabled={busy}>
              <Text style={styles.btnText}>Sign in</Text>
            </Pressable>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 16, paddingTop: 60 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "600" },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
    backgroundColor: "#fff",
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  row: { flexDirection: "row", gap: 10, marginTop: 4 },
  label: { fontSize: 12, opacity: 0.6 },
  value: { fontSize: 16 },
  btn: {
    flex: 1,
    backgroundColor: "#111",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  btnAlt: { backgroundColor: "#2563eb" },
  btnPressed: { opacity: 0.7 },
  btnText: { color: "#fff", fontWeight: "600" },
});
