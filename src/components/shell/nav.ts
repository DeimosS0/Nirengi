// The two faces of the product share one shell; only the destinations change.

export type Mode = 'genc' | 'kurum';

export interface NavItem {
  href: string;
  label: string;
  icon: 'home' | 'route' | 'shield' | 'bubbles' | 'face' | 'building' | 'clipboard' | 'compass' | 'flag' | 'book';
  /** Extra path prefixes that light this item. */
  also?: string[];
}

export const NAV: Record<Mode, NavItem[]> = {
  genc: [
    { href: '/bugun', label: 'Bugün', icon: 'home' },
    { href: '/gorevler', label: 'Görevler', icon: 'route' },
    { href: '/lig', label: 'Lig', icon: 'shield' },
    { href: '/topluluk', label: 'Topluluk', icon: 'bubbles' },
    { href: '/profil', label: 'Profil', icon: 'face', also: ['/kanit-bagla'] },
  ],
  kurum: [
    { href: '/kurum', label: 'Ana sayfa', icon: 'building' },
    { href: '/ihtiyaclar', label: 'İhtiyaçlar', icon: 'clipboard' },
    { href: '/kesfet', label: 'Keşfet', icon: 'compass', also: ['/profil/'] },
    { href: '/pilotlar', label: 'Projeler', icon: 'flag', also: ['/kart'] },
    { href: '/yontem', label: 'Yöntem', icon: 'book' },
  ],
};

export const HOME: Record<Mode, string> = { genc: '/bugun', kurum: '/kurum' };

export const isActive = (item: NavItem, path: string) =>
  path === item.href || path.startsWith(`${item.href}/`) || (item.also ?? []).some((a) => path.startsWith(a));
