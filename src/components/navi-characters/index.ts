import React from 'react';

export interface NaviProps {
  size?: number;
  animated?: boolean;
}

// Lazy-load all Navi character components
const VoidwalkerNavi = React.lazy(() => import('./VoidwalkerNavi'));
const SorcererNavi = React.lazy(() => import('./SorcererNavi'));
const ScholarNavi = React.lazy(() => import('./ScholarNavi'));
const GuardianNavi = React.lazy(() => import('./GuardianNavi'));
const StormdrakeNavi = React.lazy(() => import('./StormdrakeNavi'));
const ShadowbunnyNavi = React.lazy(() => import('./ShadowbunnyNavi'));
const FlamebirdNavi = React.lazy(() => import('./FlamebirdNavi'));
const DeerlingNavi = React.lazy(() => import('./DeerlingNavi'));
const OcelotNavi = React.lazy(() => import('./OcelotNavi'));
const FrostfoxNavi = React.lazy(() => import('./FrostfoxNavi'));
const RavenNavi = React.lazy(() => import('./RavenNavi'));
const WolfNavi = React.lazy(() => import('./WolfNavi'));

export const NAVI_CHARACTER_REGISTRY: Record<string, React.LazyExoticComponent<React.FC<NaviProps>>> = {
  VOIDWALKER: VoidwalkerNavi,
  SORCERER: SorcererNavi,
  SCHOLAR: ScholarNavi,
  GUARDIAN: GuardianNavi,
  STORMDRAKE: StormdrakeNavi,
  SHADOWBUNNY: ShadowbunnyNavi,
  FLAMEBIRD: FlamebirdNavi,
  DEERLING: DeerlingNavi,
  OCELOT: OcelotNavi,
  FROSTFOX: FrostfoxNavi,
  RAVEN: RavenNavi,
  WOLF: WolfNavi,
};

export const NAVI_CHARACTER_NAMES = Object.keys(NAVI_CHARACTER_REGISTRY) as string[];

export function getNaviCharacter(name: string): React.LazyExoticComponent<React.FC<NaviProps>> | null {
  return NAVI_CHARACTER_REGISTRY[name.toUpperCase()] || null;
}
