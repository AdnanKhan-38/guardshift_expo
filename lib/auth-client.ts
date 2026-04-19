import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { Platform } from "react-native";

function resolveBaseURL() {
  const envUrl = process.env.EXPO_PUBLIC_AUTH_URL;
  if (envUrl) return envUrl;

  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants.manifest2 as { extra?: { expoClient?: { hostUri?: string } } })
      ?.extra?.expoClient?.hostUri;
  const host = hostUri?.split(":")[0];

  if (host) return `http://${host}:3000`;
  if (Platform.OS === "android") return "http://10.0.2.2:3000";
  return "http://localhost:3000";
}

export const authClient = createAuthClient({
  baseURL: resolveBaseURL(),
  plugins: [
    expoClient({
      scheme: "guardshiftexpo",
      storagePrefix: "guardshift",
      storage: SecureStore,
    }),
  ],
});

export const { useSession, signIn, signUp, signOut } = authClient;
