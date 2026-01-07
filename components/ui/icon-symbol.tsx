// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type MaterialIconName = ComponentProps<typeof MaterialIcons>["name"];
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  // Navigation
  "house.fill": "home",
  "figure.walk": "directions-walk",
  "bolt.fill": "flash-on",
  "person.3.fill": "groups",
  "person.fill": "person",
  // General
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "xmark": "close",
  "checkmark": "check",
  "plus": "add",
  "minus": "remove",
  "gear": "settings",
  "bell.fill": "notifications",
  // Pet care
  "heart.fill": "favorite",
  "fork.knife": "restaurant",
  "drop.fill": "water-drop",
  "gamecontroller.fill": "sports-esports",
  "sparkles": "auto-awesome",
  // Battle
  "shield.fill": "shield",
  "flame.fill": "local-fire-department",
  "bolt.heart.fill": "health-and-safety",
  "trophy.fill": "emoji-events",
  "swords": "sports-mma",
  // Elements
  "flame": "whatshot",
  "water.waves": "waves",
  "leaf.fill": "eco",
  "wind": "air",
  // Breeding/Lineage
  "egg.fill": "egg",
  "figure.2.arms.open": "family-restroom",
  "tree": "account-tree",
  // Guild
  "crown.fill": "workspace-premium",
  "star.fill": "star",
  // Subscription
  "creditcard.fill": "credit-card",
  "lock.fill": "lock",
  "lock.open.fill": "lock-open",
  // Media
  "photo.fill": "photo",
  "camera.fill": "camera-alt",
  "arrow.clockwise": "refresh",
  "play.fill": "play-arrow",
  "video.fill": "videocam",
  "cube.fill": "view-in-ar",
  // Safety
  "exclamationmark.triangle": "warning",
  "exclamationmark.triangle.fill": "warning",
  "eye": "visibility",
  "headphones": "headphones",
  "moon.stars": "nightlight",
  // Energy/Rewards
  "battery.100": "battery-full",
  "battery.25": "battery-2-bar",
  "gift.fill": "card-giftcard",
  "clock.fill": "schedule",
  // Notifications
  "bell.slash.fill": "notifications-off",
  "info.circle.fill": "info",
  "checkmark.circle.fill": "check-circle",
  "flag.fill": "flag",
  "chart.bar.fill": "bar-chart",
} satisfies Record<string, MaterialIconName>;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
