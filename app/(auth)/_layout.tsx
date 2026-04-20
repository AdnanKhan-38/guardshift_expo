import { Redirect, Stack } from "expo-router";
import { useSession } from "@/lib/auth-client";

export default function AuthLayout() {
  const { data, isPending } = useSession();
  if (!isPending && data) return <Redirect href="/(tabs)" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
