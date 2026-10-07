import type { NavItem } from './nav';
import { Book, Bubbles, Building, Chest, Clipboard, Compass, Face, Flag, Home, Shield } from '../ui/icons';

const MAP = { home: Home, chest: Chest, shield: Shield, bubbles: Bubbles, face: Face, building: Building, clipboard: Clipboard, compass: Compass, flag: Flag, book: Book };

export default function NavIcon({ icon, size = 30 }: { icon: NavItem['icon']; size?: number }) {
  const I = MAP[icon];
  return <I size={size} />;
}
