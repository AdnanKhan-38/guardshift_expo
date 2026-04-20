import Constants from "expo-constants";
import { Platform } from "react-native";
import { authClient } from "./auth-client";

interface ApiSuccess<T> {
  data: T;
}

interface ApiError {
  error: { code: string; message: string; details?: unknown };
}

export class ApiClientError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

function baseURL(): string {
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

export async function api<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = `${baseURL().replace(/\/$/, "")}${path}`;
  // On native, Better Auth stores the session cookie in SecureStore via the
  // expo plugin — surface it manually because React Native fetch doesn't
  // do cookie handling automatically.
  const cookie =
    typeof (authClient as unknown as { getCookie?: () => string }).getCookie ===
    "function"
      ? (authClient as unknown as { getCookie: () => string }).getCookie()
      : "";
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
      ...(init.headers ?? {}),
    },
    credentials: "omit",
  });
  if (!res.ok) {
    let body: ApiError | undefined;
    try {
      body = (await res.json()) as ApiError;
    } catch {
      // ignore
    }
    throw new ApiClientError(
      res.status,
      body?.error?.code ?? "INTERNAL",
      body?.error?.message ?? res.statusText,
    );
  }
  const json = (await res.json()) as ApiSuccess<T>;
  return json.data;
}
