import type { LucideIcon } from "lucide-react-native";
import ArrowLeft from "lucide-react-native/icons/arrow-left";
import ArrowRight from "lucide-react-native/icons/arrow-right";
import Bell from "lucide-react-native/icons/bell";
import CalendarDays from "lucide-react-native/icons/calendar-days";
import Check from "lucide-react-native/icons/check";
import ChevronRight from "lucide-react-native/icons/chevron-right";
import CircleHelp from "lucide-react-native/icons/circle-question-mark";
import Clock3 from "lucide-react-native/icons/clock-3";
import Flag from "lucide-react-native/icons/flag";
import Gamepad2 from "lucide-react-native/icons/gamepad-2";
import LayoutDashboard from "lucide-react-native/icons/layout-dashboard";
import MapPin from "lucide-react-native/icons/map-pin";
import Plus from "lucide-react-native/icons/plus";
import QrCode from "lucide-react-native/icons/qr-code";
import Search from "lucide-react-native/icons/search";
import ShieldCheck from "lucide-react-native/icons/shield-check";
import Swords from "lucide-react-native/icons/swords";
import Trophy from "lucide-react-native/icons/trophy";
import Users from "lucide-react-native/icons/users";
import WifiOff from "lucide-react-native/icons/wifi-off";
import X from "lucide-react-native/icons/x";

const icons = {
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  bell: Bell,
  calendar: CalendarDays,
  check: Check,
  chevron: ChevronRight,
  help: CircleHelp,
  clock: Clock3,
  flag: Flag,
  gamepad: Gamepad2,
  dashboard: LayoutDashboard,
  pin: MapPin,
  plus: Plus,
  qr: QrCode,
  search: Search,
  shield: ShieldCheck,
  swords: Swords,
  trophy: Trophy,
  users: Users,
  offline: WifiOff,
  close: X,
} satisfies Record<string, LucideIcon>;
export type IconName = keyof typeof icons;
export function Icon({
  name,
  size = 20,
  color = "#A6A8B2",
  strokeWidth = 1.7,
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const Component = icons[name];
  return (
    <Component
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
