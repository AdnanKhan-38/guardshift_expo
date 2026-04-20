import { useLocalSearchParams, useRouter } from "expo-router";
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
import { emailOtp } from "@/lib/auth-client";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(emailParam ?? "");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);

  async function onVerify() {
    if (!email || otp.length !== 6) {
      Alert.alert("Missing", "Enter your email and the 6-digit code");
      return;
    }
    setBusy(true);
    const res = await emailOtp.verifyEmail({ email, otp });
    setBusy(false);
    if (res.error) {
      Alert.alert("Verify failed", res.error.message ?? "Invalid code");
      return;
    }
    Alert.alert("Verified", "Please sign in with your password.");
    router.replace("/sign-in");
  }

  async function onResend() {
    if (!email) return;
    await emailOtp.sendVerificationOtp({ email, type: "email-verification" });
    Alert.alert("Sent", "New code sent to your email");
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Verify email</Text>
          <Text style={styles.sub}>
            We sent a 6-digit code. It expires in 5 minutes.
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Code</Text>
          <TextInput
            value={otp}
            onChangeText={setOtp}
            placeholder="000000"
            keyboardType="number-pad"
            maxLength={6}
            style={[styles.input, styles.otpInput]}
          />
        </View>

        <Pressable
          onPress={onVerify}
          disabled={busy}
          style={({ pressed }) => [
            styles.btn,
            (pressed || busy) && styles.btnPressed,
          ]}>
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Verify</Text>
          )}
        </Pressable>

        <Pressable onPress={onResend} style={styles.linkBtn}>
          <Text style={styles.link}>Resend code</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 24, paddingTop: 96, gap: 20 },
  header: { gap: 6, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: "700", color: "#111" },
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
  otpInput: {
    fontSize: 22,
    letterSpacing: 8,
    textAlign: "center",
    fontWeight: "600",
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
