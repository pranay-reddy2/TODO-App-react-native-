/**
 * components/CategoryPicker.tsx
 *
 * A reusable category picker component that shows preset categories
 * and allows users to type a custom one.
 * Supports both input mode and chip selection mode.
 */
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import useTheme from "@/hooks/useTheme";

// Preset categories with icons
export const PRESET_CATEGORIES: { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { label: "General", icon: "apps-outline", color: "#6366f1" },
  { label: "Work", icon: "briefcase-outline", color: "#0ea5e9" },
  { label: "Personal", icon: "person-outline", color: "#10b981" },
  { label: "Shopping", icon: "cart-outline", color: "#f59e0b" },
  { label: "Health", icon: "fitness-outline", color: "#ef4444" },
  { label: "Study", icon: "book-outline", color: "#8b5cf6" },
  { label: "Finance", icon: "wallet-outline", color: "#06b6d4" },
  { label: "Travel", icon: "airplane-outline", color: "#f97316" },
];

export function getCategoryColor(category: string): string {
  const found = PRESET_CATEGORIES.find((c) => c.label === category);
  return found?.color ?? "#9ca3af";
}

export function getCategoryIcon(category: string): keyof typeof Ionicons.glyphMap {
  const found = PRESET_CATEGORIES.find((c) => c.label === category);
  return found?.icon ?? "pricetag-outline";
}

interface CategoryPickerProps {
  value: string;
  onSelect: (category: string) => void;
  extraCategories?: string[]; // user-created custom categories
}

const CategoryPicker: React.FC<CategoryPickerProps> = ({
  value,
  onSelect,
  extraCategories = [],
}) => {
  const { colors } = useTheme();
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customText, setCustomText] = useState("");

  // Build full category list: presets + any extra user ones not already in presets
  const presetLabels = PRESET_CATEGORIES.map((c) => c.label);
  const customOnes = extraCategories.filter((c) => !presetLabels.includes(c));
  const allCategories = [
    ...PRESET_CATEGORIES,
    ...customOnes.map((c) => ({
      label: c,
      icon: "pricetag-outline" as keyof typeof Ionicons.glyphMap,
      color: "#9ca3af",
    })),
  ];

  const handleConfirmCustom = () => {
    const trimmed = customText.trim();
    if (trimmed) {
      onSelect(trimmed);
      setShowCustomInput(false);
      setCustomText("");
    }
  };

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {allCategories.map((cat) => {
          const isSelected = value === cat.label;
          return (
            <TouchableOpacity
              key={cat.label}
              onPress={() => onSelect(cat.label)}
              activeOpacity={0.7}
              style={styles.chipWrapper}
            >
              <View
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected
                      ? cat.color + "22"
                      : colors.border + "44",
                    borderColor: isSelected ? cat.color : colors.border,
                    borderWidth: isSelected ? 1.5 : 1,
                  },
                ]}
              >
                <Ionicons
                  name={cat.icon}
                  size={13}
                  color={isSelected ? cat.color : colors.textMuted}
                />
                <Text
                  style={[
                    styles.chipText,
                    { color: isSelected ? cat.color : colors.textMuted },
                  ]}
                >
                  {cat.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Add custom category button */}
        <TouchableOpacity
          onPress={() => setShowCustomInput((v) => !v)}
          activeOpacity={0.7}
          style={styles.chipWrapper}
        >
          <View
            style={[
              styles.chip,
              {
                backgroundColor: colors.border + "44",
                borderColor: colors.border,
                borderWidth: 1,
                borderStyle: "dashed",
              },
            ]}
          >
            <Ionicons name="add" size={13} color={colors.textMuted} />
            <Text style={[styles.chipText, { color: colors.textMuted }]}>
              Custom
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {showCustomInput && (
        <View style={styles.customInputRow}>
          <TextInput
            value={customText}
            onChangeText={setCustomText}
            placeholder="Enter category name..."
            placeholderTextColor={colors.textMuted}
            style={[
              styles.customInput,
              {
                borderColor: colors.primary,
                color: colors.text,
                backgroundColor: colors.backgrounds.input,
              },
            ]}
            autoFocus
            onSubmitEditing={handleConfirmCustom}
            returnKeyType="done"
          />
          <TouchableOpacity onPress={handleConfirmCustom} activeOpacity={0.7}>
            <LinearGradient
              colors={colors.gradients.primary}
              style={styles.confirmBtn}
            >
              <Ionicons name="checkmark" size={16} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setShowCustomInput(false);
              setCustomText("");
            }}
            activeOpacity={0.7}
          >
            <View
              style={[styles.confirmBtn, { backgroundColor: colors.border }]}
            >
              <Ionicons name="close" size={16} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: "row",
    paddingVertical: 4,
    gap: 8,
    paddingHorizontal: 2,
  },
  chipWrapper: {
    flexShrink: 0,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  customInputRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    alignItems: "center",
  },
  customInput: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  confirmBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default CategoryPicker;