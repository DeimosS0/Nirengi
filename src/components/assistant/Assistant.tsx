// Niri as the guide of both faces. Mounted once by the layout. It owns three
// things: the welcome flow (first visit per face), the spotlight tours (once per
// page) and the help button. The face follows the tab's persona: kurum or genç.
//
// Other code can drive it with
//   window.dispatchEvent(new CustomEvent('nirengi:asistan', { detail: 'welcome' | 'tour' | 'help' }))

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useView } from '../../lib/store.ts';
import { feedback } from '../ui/kit';
import Coach from './Coach';
import Help from './Help';
import Welcome from './Welcome';
import { routeKey, toursFor, type CoachStep } from './tours';
import { blocked, findTarget, read, tourKey, welcomeKey, write, type Face, type WelcomeChoice } from './util';

type Command = 'welcome' | 'tour' | 'help';

/** Runs once the screen is quiet: no sheet, celebration or seal moment on top, and `ready` holds. */
function whenClear(run: () => void, ready: () => boolean = () => true) {
  let tries = 0;
  const t = window.setInterval(() => {
    if (++tries > 60) return window.clearInterval(t);
    if (blocked() || !ready()) return;
    window.clearInterval(t);
    run();
  }, 600);
  return () => window.clearInterval(t);
}

const hasTargets = (steps?: CoachStep[]) => Boolean(steps?.some((s) => findTarget(s.target)));
const home = (face: Face) => (face === 'genc' ? '/bugun' : '/kurum');

export default function Assistant() {
  const face: Face = useView().persona === 'org' ? 'kurum' : 'genc';
  const route = useMemo(() => routeKey(location.pathname), []);
  const steps = toursFor(face)[route];
  const [welcome, setWelcome] = useState(false);
  const [tour, setTour] = useState<CoachStep[] | null>(null);
  const [help, setHelp] = useState(false);

  const startTour = useCallback(() => {
    if (!steps || !hasTargets(steps)) return false;
    write(tourKey(route), '1');
    setTour(steps);
    return true;
  }, [route, steps]);

  const showTour = useCallback(() => {
    if (startTour()) return;
    feedback({ tone: 'info', title: 'Burada gösterecek bir şey bulamadım', text: 'Sayfa yüklendikten sonra tekrar dene.' });
  }, [startTour]);

  // First visit: welcome. Later pages: their tour, once, unless the visitor chose to look around alone.
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    if (q.get('tur') === '1') {
      history.replaceState(null, '', location.pathname + location.hash);
      return whenClear(() => void startTour(), () => hasTargets(steps));
    }
    const seen = read(welcomeKey(face));
    if (!seen) return whenClear(() => setWelcome(true));
    if (seen !== 'self' && steps && !read(tourKey(route))) return whenClear(() => void startTour(), () => hasTargets(steps));
  }, [face, route, steps, startTour]);

  // Switching faces in place (the mode switch): whatever was open belongs to the other face.
  useEffect(() => {
    setWelcome(false);
    setTour(null);
    setHelp(false);
  }, [face]);

  useEffect(() => {
    const on = (e: Event) => {
      const c = (e as CustomEvent<Command>).detail;
      if (c === 'welcome') setWelcome(true);
      else if (c === 'help') setHelp(true);
      else if (c === 'tour') showTour();
    };
    window.addEventListener('nirengi:asistan', on);
    return () => window.removeEventListener('nirengi:asistan', on);
  }, [showTour]);

  const closeWelcome = (choice: WelcomeChoice) => {
    write(welcomeKey(face), choice);
    setWelcome(false);
    if (choice !== 'tour') return;
    // Let the panel leave first; a page with no tour of its own hands over to the home tour.
    window.setTimeout(() => {
      if (!startTour()) location.assign(`${home(face)}?tur=1`);
    }, 260);
  };

  const closeTour = (finished: boolean) => {
    setTour(null);
    if (finished) feedback({ tone: 'good', title: 'Tur bitti', text: 'Takılırsan “Niri’ye sor” düğmesi hep yanında.' });
  };

  return (
    <>
      <AnimatePresence>{welcome && <Welcome key={`welcome-${face}`} face={face} onClose={closeWelcome} />}</AnimatePresence>
      {tour && <Coach steps={tour} onClose={closeTour} />}
      {!welcome && !tour && (
        <Help
          face={face}
          route={route}
          open={help}
          onOpen={() => setHelp(true)}
          onClose={() => setHelp(false)}
          hasTour={Boolean(steps)}
          home={home(face)}
          onTour={() => {
            setHelp(false);
            window.setTimeout(showTour, 280);
          }}
          onWelcome={() => {
            setHelp(false);
            window.setTimeout(() => setWelcome(true), 280);
          }}
        />
      )}
    </>
  );
}
