import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, ApiClientError } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import {
  addDays,
  diffMinutes,
  formatHM,
  formatHoursMinutes,
  formatWeekdayDate,
  weekStartUtc,
} from "@/lib/time";

interface ApiShift {
  id: string;
  locationId: string;
  location: { id: string; name: string; color: string };
  assigneeId: string | null;
  startsAt: string;
  endsAt: string;
  status: "DRAFT" | "PUBLISHED";
  notes: string | null;
  publishedAt?: string | null;
  publishedAssigneeId?: string | null;
  publishedLocationId?: string | null;
  publishedStartsAt?: string | null;
  publishedEndsAt?: string | null;
}

interface DayBlock {
  key: string;
  label: string;
  isToday: boolean;
  totalMinutes: number;
  shifts: ApiShift[];
}

function sameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function MyScheduleScreen() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const today = useMemo(() => new Date(), []);
  const [weekStart, setWeekStart] = useState<Date>(() => weekStartUtc(new Date()));
  const [refreshing, setRefreshing] = useState(false);
  const [shifts, setShifts] = useState<ApiShift[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadShifts = useCallback(async () => {
    if (!userId) return;
    setError(null);
    try {
      const url = `/api/v1/shifts?weekStart=${encodeURIComponent(weekStart.toISOString())}&assigneeId=${userId}`;
      const data = await api<ApiShift[]>(url);
      // Mobile only shows shifts the employee has been notified of — drafts
      // haven't been published yet and may still change.
      setShifts(
        data
          .filter((s) => s.status === "PUBLISHED")
          .sort(
            (a, b) =>
              new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
          ),
      );
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Failed to load");
      setShifts([]);
    }
  }, [userId, weekStart]);

  useEffect(() => {
    void loadShifts();
  }, [loadShifts]);

  const days = useMemo<DayBlock[]>(() => {
    const base: DayBlock[] = Array.from({ length: 7 }, (_, i) => {
      const d = addDays(weekStart, i);
      return {
        key: d.toISOString(),
        label: formatWeekdayDate(d),
        isToday: sameLocalDay(d, today),
        totalMinutes: 0,
        shifts: [],
      };
    });
    if (shifts) {
      const anchor = new Date(
        weekStart.getFullYear(),
        weekStart.getMonth(),
        weekStart.getDate(),
      );
      for (const s of shifts) {
        const start = new Date(s.startsAt);
        const startDay = new Date(
          start.getFullYear(),
          start.getMonth(),
          start.getDate(),
        );
        const dayIdx = Math.floor(
          (startDay.getTime() - anchor.getTime()) / (24 * 60 * 60 * 1000),
        );
        if (dayIdx >= 0 && dayIdx < 7) {
          base[dayIdx].shifts.push(s);
          base[dayIdx].totalMinutes += diffMinutes(start, new Date(s.endsAt));
        }
      }
    }
    return base;
  }, [shifts, weekStart, today]);

  async function onRefresh() {
    setRefreshing(true);
    await loadShifts();
    setRefreshing(false);
  }

  const totalMinutes = days.reduce((a, b) => a + b.totalMinutes, 0);
  const shiftCount = days.reduce((a, b) => a + b.shifts.length, 0);
  const onThisWeek = sameLocalDay(weekStart, weekStartUtc(today));

  return (
    <SafeAreaView style={styles.flex} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.nav}>
          <Pressable
            onPress={() => setWeekStart((w) => addDays(w, -7))}
            style={styles.navBtn}>
            <Text style={styles.navBtnText}>←</Text>
          </Pressable>
          <Text style={styles.rangeLabel}>
            {formatWeekdayDate(weekStart)} — {formatWeekdayDate(addDays(weekStart, 6))}
          </Text>
          <Pressable
            onPress={() => setWeekStart((w) => addDays(w, 7))}
            style={styles.navBtn}>
            <Text style={styles.navBtnText}>→</Text>
          </Pressable>
        </View>
        <View style={styles.subHeader}>
          <Text style={styles.totalLabel}>
            {shiftCount === 0
              ? "No shifts this week"
              : `${shiftCount} shift${shiftCount === 1 ? "" : "s"} · ${formatHoursMinutes(totalMinutes)}`}
          </Text>
          {!onThisWeek && (
            <Pressable
              onPress={() => setWeekStart(weekStartUtc(today))}
              style={({ pressed }) => [
                styles.todayBtn,
                pressed && styles.pressed,
              ]}>
              <Text style={styles.todayBtnText}>This week</Text>
            </Pressable>
          )}
        </View>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
      {shifts === null && !error && (
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      )}

      <FlatList
        data={days}
        keyExtractor={(d) => d.key}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => <DayRow block={item} />}
        ListEmptyComponent={null}
      />
    </SafeAreaView>
  );
}

function DayRow({ block }: { block: DayBlock }) {
  return (
    <View style={[styles.dayRow, block.isToday && styles.dayRowToday]}>
      <View style={styles.dayHeader}>
        <View style={styles.dayLabelWrap}>
          <Text style={[styles.dayLabel, block.isToday && styles.dayLabelToday]}>
            {block.label}
          </Text>
          {block.isToday && (
            <View style={styles.todayPill}>
              <Text style={styles.todayPillText}>Today</Text>
            </View>
          )}
        </View>
        {block.totalMinutes > 0 && (
          <Text style={styles.dayTotal}>
            {formatHoursMinutes(block.totalMinutes)}
          </Text>
        )}
      </View>
      {block.shifts.length === 0 ? (
        <Text style={styles.dayEmpty}>—</Text>
      ) : (
        block.shifts.map((s) => <ShiftCard key={s.id} shift={s} />)
      )}
    </View>
  );
}

function ShiftCard({ shift }: { shift: ApiShift }) {
  const duration = diffMinutes(new Date(shift.startsAt), new Date(shift.endsAt));
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: hexWithAlpha(shift.location.color, 0.1),
          borderColor: shift.location.color,
        },
      ]}>
      <View style={styles.cardRow}>
        <Text style={styles.cardTime}>
          {formatHM(new Date(shift.startsAt))} – {formatHM(new Date(shift.endsAt))}
        </Text>
        <Text style={styles.cardDuration}>
          {formatHoursMinutes(duration)}
        </Text>
      </View>
      <View style={styles.cardLocationRow}>
        <View
          style={[
            styles.locationDot,
            { backgroundColor: shift.location.color },
          ]}
        />
        <Text style={styles.cardLocation}>{shift.location.name}</Text>
      </View>
      {shift.notes && (
        <View style={styles.noteWrap}>
          <Text style={styles.noteLabel}>Note</Text>
          <Text style={styles.noteText}>{shift.notes}</Text>
        </View>
      )}
    </View>
  );
}

function hexWithAlpha(hex: string, alpha: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fafafa" },
  header: {
    padding: 16,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e5e5",
    backgroundColor: "#fff",
  },
  nav: { flexDirection: "row", alignItems: "center", gap: 12 },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f4f4f5",
    alignItems: "center",
    justifyContent: "center",
  },
  navBtnText: { fontSize: 18, fontWeight: "600", color: "#111" },
  rangeLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  totalLabel: { fontSize: 12, color: "#666" },
  todayBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#111",
  },
  todayBtnText: { fontSize: 11, fontWeight: "600", color: "#fff" },
  pressed: { opacity: 0.7 },
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
  dayRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e5e5",
    gap: 6,
  },
  dayRowToday: {
    backgroundColor: "#f0f9ff",
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dayLabelWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dayLabel: { fontSize: 13, fontWeight: "600", color: "#111" },
  dayLabelToday: { color: "#0369a1" },
  todayPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "#0369a1",
  },
  todayPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },
  dayTotal: { fontSize: 11, color: "#666" },
  dayEmpty: { fontSize: 13, color: "#999", paddingVertical: 4 },
  card: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 6,
    gap: 6,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  cardTime: { fontSize: 15, fontWeight: "700", color: "#111" },
  cardDuration: { fontSize: 11, color: "#666", fontWeight: "600" },
  cardLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationDot: { width: 8, height: 8, borderRadius: 4 },
  cardLocation: { fontSize: 13, color: "#555" },
  noteWrap: {
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.08)",
    gap: 2,
  },
  noteLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  noteText: { fontSize: 13, color: "#333", lineHeight: 18 },
});
