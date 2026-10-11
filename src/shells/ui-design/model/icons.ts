/* The icon set available to `icon` nodes. A curated registry (not all of
   lucide) keeps the shell chunk small; the canvas exporter rasterises the
   same components (rendered off-screen with the client renderer), so export matches screen. */
import {
  ArrowLeft, Bell, Bookmark, ChevronRight, Clock, Compass, Heart, House, MapPin, Mountain, Navigation, Search, Share,
  SlidersHorizontal, Star, User, Activity, Wifi, BatteryFull, SignalHigh, Plus, Check, Footprints, Sun, Play, Settings,
  type LucideIcon,
} from 'lucide-react'

export const ICONS: Record<string, LucideIcon> = {
  ArrowLeft, Bell, Bookmark, ChevronRight, Clock, Compass, Heart, House, MapPin, Mountain, Navigation, Search, Share,
  SlidersHorizontal, Star, User, Activity, Wifi, BatteryFull, SignalHigh, Plus, Check, Footprints, Sun, Play, Settings,
}
