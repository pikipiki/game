import { startTransition, useEffect, useRef, useState } from 'react';
import { friendlyTown, income } from '@/game/engine';
import { homeCastleSite, isHomeCastle } from '@/app/lib/town-site';
import { builtBuildings } from '@/game/buildings';
import { TownView } from '@/app/components/town/TownView';
import { useTranslation } from '@/app/hooks/useTranslation';
import {
  headerShellLabels,
  townScreenLabels,
  webglErrorCopy,
} from '@/app/lib/game-copy';
import { creatureStatLabels } from '@/app/lib/creature-stat-labels';
import { buildTownArmyUnitLabels } from '@/app/lib/town-army-labels';
import { localizedSite } from '@/i18n/localize';
import { useGame, useGameRuntime } from '@/app/providers/GameContext';
import { buildTownDetailModel } from '@/app/view-models/town-detail';
import { TownScene, type BuildingId } from '@/render/town';

export function TownContainer() {
  const snap = useGame();
  const { t } = useTranslation();
  const { townRef, store } = useGameRuntime();
  const sceneHostRef = useRef<HTMLDivElement>(null);
  const sceneCreatedRef = useRef(false);
  const [townWebglError, setTownWebglError] = useState(false);

  useEffect(() => {
    if (!snap.townOpen) {
      townRef.current?.dispose();
      townRef.current = null;
      sceneCreatedRef.current = false;
      return;
    }
    const host = sceneHostRef.current;
    if (!host || sceneCreatedRef.current) return;
    let cancelled = false;
    const mountScene = () => {
      if (cancelled || sceneCreatedRef.current) return;
      if (!host.clientWidth || !host.clientHeight) {
        requestAnimationFrame(mountScene);
        return;
      }
      sceneCreatedRef.current = true;
      try {
        townRef.current = new TownScene(host, (id) => {
          store.patch({ townBuilding: id, townPanel: true });
        });
      } catch {
        startTransition(() => {
          setTownWebglError(true);
        });
      }
    };
    mountScene();
    return () => {
      cancelled = true;
    };
  }, [snap.townOpen, townRef, store]);

  useEffect(() => {
    if (!snap.townOpen || !townRef.current) return;
    const state = snap.game;
    townRef.current.update(state.castle, builtBuildings(state));
    townRef.current.select(snap.townBuilding);
  }, [snap, townRef]);

  if (!snap.townOpen) {
    return <div id="town-root" />;
  }

  const state = snap.game;
  const atTown = friendlyTown(state) && !state.battle;
  const home = isHomeCastle(state);
  const place = homeCastleSite(state);
  let townName = t('content.sites.home.name');
  if (place) townName = localizedSite(place, t).name;
  const daily = income(state);
  const buildingId = snap.townBuilding as BuildingId;
  const header = headerShellLabels(t, snap.locale);
  const detail = buildTownDetailModel(
    state,
    buildingId,
    atTown,
    home,
    t,
  );

  return (
    <div id="town-root">
      <TownView
        armyUnitLabels={buildTownArmyUnitLabels(state, t)}
        dailyIncome={daily}
        detail={detail}
        endDayDisabled={state.won}
        labels={townScreenLabels(t, state.day, daily)}
        locale={snap.locale}
        localeToggleAria={header.localeToggleAria}
        sceneHostRef={sceneHostRef}
        statLabels={creatureStatLabels(t)}
        state={state}
        townBuilding={snap.townBuilding}
        townName={townName}
        townPanel={snap.townPanel}
        townWebglError={townWebglError}
        webglError={webglErrorCopy(t)}
      />
    </div>
  );
}
