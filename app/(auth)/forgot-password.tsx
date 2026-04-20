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
import { emailOtp } from "@/lib/auth-client";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [stage, setStage] = useState<"request" | "reset">("request");
  const [busy, setBusy] = useState(false);

  async function onRequest() {
    if (!email) return;
    setBusy(true);
    const res = await emailOtp.requestPasswordReset({ email });
    setBusy(false);
    if (res.error) {
      Alert.alert("Could not send", res.error.message ?? "Try again");
      return;
    }
    setStage("reset");
  }

  async function onReset() {
    if (otp.length !== 6 || !password) return;
    setBusy(true);
    const res = await emailOtp.resetPassword({ email, otp, password });
    setBusy(false);
    if (res.error) {
      Alert.alert("Reset failed", res.error.message ?? "Invalid code");
      return;
    }
    Alert.alert("Password updated", "Sign in with your new password.");
    router.replace("/sign-in");
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>
            {stage === "request" ? "Forgot password" : "Reset password"}
          </Text>
          <Text style={styles.sub}>
            {stage === "request"
              ? "Enter your email and we'll send a 6-digit code."
              : "Enter the code and a new password."}
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={stage === "request"}
            style={styles.input}
          />
        </View>

        {stage === "reset" && (
          <>
            <View style={styles.field}>
              <Text style={styles.label}>Code</Text>
              <TextInput
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                style={[styles.input, styles.otpInput]}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>New password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.input}
              />
            </View>
          </>
        )}

        <Pressable
          onPress={stage === "request" ? onRequest : onReset}
          disabled={busy}
          style={({ pressed }) => [
            styles.btn,
            (pressed || busy) && styles.btnPressed,
          ]}>
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>
              {stage === "request" ? "Send code" : "Reset password"}
            </Text>
          )}
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
});
