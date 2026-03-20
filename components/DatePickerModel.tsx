/**
 * components/DatePickerModal.tsx
 *
 * A fully custom calendar date picker built with pure React Native —
 * NO external packages needed. Works in Expo Go on Android.
 *
 * Shows a modal with a monthly calendar grid. User taps a day to select it.
 * Navigate months with < > arrows. Today is highlighted. Past dates are greyed.
 */
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  FlatList,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import useTheme from "@/hooks/useTheme";

interface DatePickerModalProps {
  value: string; // "YYYY-MM-DD" or ""
  onConfirm: (dateString: string) => void;
  placeholder?: string;
  minimumDate?: Date;
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplay(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/** Build calendar grid for a given month/year */
function buildCalendar(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const DatePickerModal: React.FC<DatePickerModalProps> = ({
  value,
  onConfirm,
  placeholder = "Select deadline date",
  minimumDate,
}) => {
  const { colors } = useTheme();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Which month/year the calendar is showing
  const [viewYear, setViewYear] = useState(() =>
    value ? parseInt(value.split("-")[0]) : today.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(() =>
    value ? parseInt(value.split("-")[1]) - 1 : today.getMonth()
  );

  const [visible, setVisible] = useState(false);

  const cells = useMemo(
    () => buildCalendar(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const minDate = minimumDate ?? today;
  minDate.setHours(0, 0, 0, 0);

  const selectedDay = value
    ? parseInt(value.split("-")[2])
    : null;
  const selectedMonth = value ? parseInt(value.split("-")[1]) - 1 : null;
  const selectedYear = value ? parseInt(value.split("-")[0]) : null;

  const goToPrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const handleDayPress = (day: number) => {
    const picked = new Date(viewYear, viewMonth, day);
    picked.setHours(0, 0, 0, 0);
    if (picked < minDate) return; // disabled
    onConfirm(formatDate(picked));
    setVisible(false);
  };

  const isDisabled = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0, 0, 0, 0);
    return d < minDate;
  };

  const isToday = (day: number) =>
    day === today.getDate() &&
    viewMonth === today.getMonth() &&
    viewYear === today.getFullYear();

  const isSelected = (day: number) =>
    day === selectedDay &&
    viewMonth === selectedMonth &&
    viewYear === selectedYear;

  const openPicker = () => {
    // Reset view to selected date or today when opening
    if (value) {
      setViewYear(parseInt(value.split("-")[0]));
      setViewMonth(parseInt(value.split("-")[1]) - 1);
    } else {
      setViewYear(today.getFullYear());
      setViewMonth(today.getMonth());
    }
    setVisible(true);
  };

  return (
    <>
      {/* Trigger field */}
      <View style={[styles.field, { borderColor: colors.border, backgroundColor: colors.backgrounds.input }]}>
        <TouchableOpacity onPress={openPicker} style={styles.fieldInner} activeOpacity={0.7}>
          <Ionicons
            name="calendar-outline"
            size={18}
            color={value ? colors.primary : colors.textMuted}
          />
          <Text style={[styles.fieldText, { color: value ? colors.text : colors.textMuted }]}>
            {value ? formatDisplay(value) : placeholder}
          </Text>
        </TouchableOpacity>
        {value ? (
          <TouchableOpacity onPress={() => onConfirm("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Calendar Modal */}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
        statusBarTranslucent
      >
        {/* Dimmed backdrop */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        />

        {/* Calendar card */}
        <View style={styles.centeredView}>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>

            {/* Month navigation header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={goToPrevMonth} style={styles.navBtn}>
                <Ionicons name="chevron-back" size={22} color={colors.primary} />
              </TouchableOpacity>
              <Text style={[styles.monthTitle, { color: colors.text }]}>
                {MONTHS[viewMonth]} {viewYear}
              </Text>
              <TouchableOpacity onPress={goToNextMonth} style={styles.navBtn}>
                <Ionicons name="chevron-forward" size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Day-of-week labels */}
            <View style={styles.weekRow}>
              {DAYS.map((d) => (
                <Text key={d} style={[styles.dayLabel, { color: colors.textMuted }]}>{d}</Text>
              ))}
            </View>

            {/* Calendar grid */}
            <View style={styles.grid}>
              {cells.map((day, idx) => {
                if (!day) {
                  return <View key={`empty-${idx}`} style={styles.cell} />;
                }
                const disabled = isDisabled(day);
                const selected = isSelected(day);
                const todayCell = isToday(day);

                return (
                  <TouchableOpacity
                    key={`day-${idx}`}
                    style={styles.cell}
                    onPress={() => handleDayPress(day)}
                    disabled={disabled}
                    activeOpacity={0.7}
                  >
                    {selected ? (
                      <LinearGradient
                        colors={colors.gradients.primary}
                        style={styles.selectedCircle}
                      >
                        <Text style={styles.selectedDayText}>{day}</Text>
                      </LinearGradient>
                    ) : todayCell ? (
                      <View style={[styles.todayCircle, { borderColor: colors.primary }]}>
                        <Text style={[styles.todayDayText, { color: colors.primary }]}>{day}</Text>
                      </View>
                    ) : (
                      <Text style={[
                        styles.dayText,
                        { color: disabled ? colors.border : colors.text },
                      ]}>
                        {day}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Cancel button */}
            <TouchableOpacity
              onPress={() => setVisible(false)}
              style={[styles.cancelBtn, { borderTopColor: colors.border }]}
            >
              <Text style={[styles.cancelText, { color: colors.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const CELL_SIZE = 40;

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    minHeight: 52,
  },
  fieldInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fieldText: {
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingTop: 16,
    paddingBottom: 8,
  },
  navBtn: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  weekRow: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  dayLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  cell: {
    width: `${100 / 7}%`,
    height: CELL_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  dayText: {
    fontSize: 14,
    fontWeight: "400",
  },
  selectedCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedDayText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  todayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  todayDayText: {
    fontSize: 14,
    fontWeight: "700",
  },
  cancelBtn: {
    borderTopWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "500",
  },
});

export default DatePickerModal;