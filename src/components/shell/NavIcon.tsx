import type { NavItem } from './nav';
import { Book, Bubbles, Building, Clipboard, Compass, Face, Flag, Home, Route, Shield } from '../ui/icons';

const MAP = { home: Home, route: Route, shield: Shield, bubbles: Bubbles, face: Face, building: Building, clipboard: Clipboard, compass: Compass, flag: Flag, book: Book };

export default function NavIcon({ icon, size = 30 }: { icon: NavItem['icon']; size?: number }) {
  const I = MAP[icon];
  return <I size={size} />;
}
