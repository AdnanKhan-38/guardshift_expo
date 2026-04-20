import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { signIn, emailOtp } from "@/lib/auth-client";

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSignIn() {
    if (!email || !password) {
      Alert.alert("Missing details", "Enter your email and password");
      return;
    }
    setBusy(true);
    const res = await signIn.email({ email, password });
    setBusy(false);
    if (res.error) {
      if (/not\s?verified/i.test(res.error.message ?? "")) {
        Alert.alert("Verify email", "Sending a new code…");
        await emailOtp.sendVerificationOtp({ email, type: "email-verification" });
        router.push({ pathname: "/verify-email", params: { email } });
        return;
      }
      Alert.alert("Sign in failed", res.error.message ?? "Try again");
      return;
    }
    router.replace("/(tabs)");
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.brand}>Guardshift</Text>
          <Text style={styles.title}>Sign in</Text>
          <Text style={styles.sub}>Welcome back.</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            style={styles.input}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoComplete="current-password"
            style={styles.input}
          />
        </View>

        <Pressable
          onPress={onSignIn}
          disabled={busy}
          style={({ pressed }) => [
            styles.btn,
            (pressed || busy) && styles.btnPressed,
          ]}>
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Sign in</Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => router.push("/forgot-password")}
          style={styles.linkBtn}>
          <Text style={styles.link}>Forgot password?</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 24, paddingTop: 96, gap: 20 },
  header: { gap: 4, marginBottom: 8 },
  brand: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 1,
    color: "#111",
  },
  title: { fontSize: 28, fontWeight: "700", color: "#111" },
  sub: { fontSize: 14, color: "#666" },
  field: { gap: 6 },
  label: { fontSize: 13, color: "#444", fontWeight: "500" },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#c4c4c4",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  btn: {
    backgroundColor: "#111",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  btnPressed: { opacity: 0.7 },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  linkBtn: { alignItems: "center", paddingVertical: 8 },
  link: { color: "#2563eb", fontSize: 13 },
});
