import React from 'react';

export interface NaviProps {
  size?: number;
  animated?: boolean;
}

// Lazy-load all Navi character components

// ── ELEMENTAL ──────────────────────────────────────────────────────────────
const FlamebirdNavi   = React.lazy(() => import('./FlamebirdNavi'));
const AquacatNavi     = React.lazy(() => import('./AquacatNavi'));
const ThunderdogNavi  = React.lazy(() => import('./ThunderdogNavi'));
const CrystalfishNavi = React.lazy(() => import('./CrystalfishNavi'));
const ShadowbunnyNavi = React.lazy(() => import('./ShadowbunnyNavi'));
const IronbearNavi    = React.lazy(() => import('./IronbearNavi'));
const StormdrakeNavi  = React.lazy(() => import('./StormdrakeNavi'));
const VenombugNavi    = React.lazy(() => import('./VenombugNavi'));
const FrostfoxNavi    = React.lazy(() => import('./FrostfoxNavi'));
const EmbercoreNavi   = React.lazy(() => import('./EmbercoreNavi'));
const TidecallerNavi  = React.lazy(() => import('./TidecallerNavi'));

// ── CLASS ──────────────────────────────────────────────────────────────────
const NetopNavi      = React.lazy(() => import('./NetopNavi'));
const WarriorNavi    = React.lazy(() => import('./WarriorNavi'));
const GuardianNavi   = React.lazy(() => import('./GuardianNavi'));
const PaladinNavi    = React.lazy(() => import('./PaladinNavi'));
const BerserkerNavi  = React.lazy(() => import('./BerserkerNavi'));
const SorcererNavi   = React.lazy(() => import('./SorcererNavi'));
const RangerNavi     = React.lazy(() => import('./RangerNavi'));
const NavigatorNavi  = React.lazy(() => import('./NavigatorNavi'));
const RocketeerNavi  = React.lazy(() => import('./RocketeerNavi'));
const AlchemistNavi  = React.lazy(() => import('./AlchemistNavi'));
const ScholarNavi    = React.lazy(() => import('./ScholarNavi'));

// ── MYTHIC ─────────────────────────────────────────────────────────────────
const PhoenixNavi    = React.lazy(() => import('./PhoenixNavi'));
const LeviathanNavi  = React.lazy(() => import('./LeviathanNavi'));
const ThundergodNavi = React.lazy(() => import('./ThundergodNavi'));
const BansheeNavi    = React.lazy(() => import('./BansheeNavi'));
const GolemNavi      = React.lazy(() => import('./GolemNavi'));
const FrostgiantNavi = React.lazy(() => import('./FrostgiantNavi'));
const SunwyrmNavi    = React.lazy(() => import('./SunwyrmNavi'));
const MoonwitchNavi  = React.lazy(() => import('./MoonwitchNavi'));
const TreantNavi     = React.lazy(() => import('./TreantNavi'));
const RagnarokNavi   = React.lazy(() => import('./RagnarokNavi'));

// ── COSMIC ─────────────────────────────────────────────────────────────────
const StardustNavi   = React.lazy(() => import('./StardustNavi'));
const NebulaNavi     = React.lazy(() => import('./NebulaNavi'));
const XenomorphNavi  = React.lazy(() => import('./XenomorphNavi'));
const GalacticNavi   = React.lazy(() => import('./GalacticNavi'));
const CosmicNavi     = React.lazy(() => import('./CosmicNavi'));
const VoidwalkerNavi = React.lazy(() => import('./VoidwalkerNavi'));
const UfosignalNavi  = React.lazy(() => import('./UfosignalNavi'));
const SolarisNavi    = React.lazy(() => import('./SolarisNavi'));
const CelestialNavi  = React.lazy(() => import('./CelestialNavi'));
const GenesisNavi    = React.lazy(() => import('./GenesisNavi'));

// ── NATURE ─────────────────────────────────────────────────────────────────
const LeafspiritNavi  = React.lazy(() => import('./LeafspiritNavi'));
const GaleforceNavi   = React.lazy(() => import('./GaleforceNavi'));
const BloomfaeNavi    = React.lazy(() => import('./BloomfaeNavi'));
const PalmshamanNavi  = React.lazy(() => import('./PalmshamanNavi'));
const TempestNavi     = React.lazy(() => import('./TempestNavi'));
const MistcloudNavi   = React.lazy(() => import('./MistcloudNavi'));
const SunshardNavi    = React.lazy(() => import('./SunshardNavi'));
const DeerlingNavi    = React.lazy(() => import('./DeerlingNavi'));
const OcelotNavi      = React.lazy(() => import('./OcelotNavi'));
const RavenNavi       = React.lazy(() => import('./RavenNavi'));
const WolfNavi        = React.lazy(() => import('./WolfNavi'));

// ── TECH ───────────────────────────────────────────────────────────────────
const CybercoreNavi   = React.lazy(() => import('./CybercoreNavi'));
const NetbotNavi      = React.lazy(() => import('./NetbotNavi'));
const DatastreamNavi  = React.lazy(() => import('./DatastreamNavi'));
const BroadcastNavi   = React.lazy(() => import('./BroadcastNavi'));
const DnaweaverNavi   = React.lazy(() => import('./DnaweaverNavi'));
const MagnetarNavi    = React.lazy(() => import('./MagnetarNavi'));
const NeuromindNavi   = React.lazy(() => import('./NeuromindNavi'));
const AtomsparkNavi   = React.lazy(() => import('./AtomsparkNavi'));

// ── SPECIAL ────────────────────────────────────────────────────────────────
const SoulbladeNavi   = React.lazy(() => import('./SoulbladeNavi'));
const HeartbondNavi   = React.lazy(() => import('./HeartbondNavi'));
const HexcoreNavi     = React.lazy(() => import('./HexcoreNavi'));
const GemstoneNavi    = React.lazy(() => import('./GemstoneNavi'));
const StarmarkNavi    = React.lazy(() => import('./StarmarkNavi'));
const EyeoftruthNavi  = React.lazy(() => import('./EyeoftruthNavi'));
const OracleNavi      = React.lazy(() => import('./OracleNavi'));
const AnchorNavi      = React.lazy(() => import('./AnchorNavi'));

export const NAVI_CHARACTER_REGISTRY: Record<string, React.LazyExoticComponent<React.FC<NaviProps>>> = {
  // ELEMENTAL
  FLAMEBIRD:   FlamebirdNavi,
  AQUACAT:     AquacatNavi,
  THUNDERDOG:  ThunderdogNavi,
  CRYSTALFISH: CrystalfishNavi,
  SHADOWBUNNY: ShadowbunnyNavi,
  IRONBEAR:    IronbearNavi,
  STORMDRAKE:  StormdrakeNavi,
  VENOMBUG:    VenombugNavi,
  FROSTFOX:    FrostfoxNavi,
  EMBERCORE:   EmbercoreNavi,
  TIDECALLER:  TidecallerNavi,

  // CLASS
  NETOP:      NetopNavi,
  WARRIOR:    WarriorNavi,
  GUARDIAN:   GuardianNavi,
  PALADIN:    PaladinNavi,
  BERSERKER:  BerserkerNavi,
  SORCERER:   SorcererNavi,
  RANGER:     RangerNavi,
  NAVIGATOR:  NavigatorNavi,
  ROCKETEER:  RocketeerNavi,
  ALCHEMIST:  AlchemistNavi,
  SCHOLAR:    ScholarNavi,

  // MYTHIC
  PHOENIX:    PhoenixNavi,
  LEVIATHAN:  LeviathanNavi,
  THUNDERGOD: ThundergodNavi,
  BANSHEE:    BansheeNavi,
  GOLEM:      GolemNavi,
  FROSTGIANT: FrostgiantNavi,
  SUNWYRM:    SunwyrmNavi,
  MOONWITCH:  MoonwitchNavi,
  TREANT:     TreantNavi,
  RAGNAROK:   RagnarokNavi,

  // COSMIC
  STARDUST:   StardustNavi,
  NEBULA:     NebulaNavi,
  XENOMORPH:  XenomorphNavi,
  GALACTIC:   GalacticNavi,
  COSMIC:     CosmicNavi,
  VOIDWALKER: VoidwalkerNavi,
  UFOSIGNAL:  UfosignalNavi,
  SOLARIS:    SolarisNavi,
  CELESTIAL:  CelestialNavi,
  GENESIS:    GenesisNavi,

  // NATURE
  LEAFSPIRIT: LeafspiritNavi,
  GALEFORCE:  GaleforceNavi,
  BLOOMFAE:   BloomfaeNavi,
  PALMSHAMAN: PalmshamanNavi,
  TEMPEST:    TempestNavi,
  MISTCLOUD:  MistcloudNavi,
  SUNSHARD:   SunshardNavi,
  DEERLING:   DeerlingNavi,
  OCELOT:     OcelotNavi,
  RAVEN:      RavenNavi,
  WOLF:       WolfNavi,

  // TECH
  CYBERCORE:  CybercoreNavi,
  NETBOT:     NetbotNavi,
  DATASTREAM: DatastreamNavi,
  BROADCAST:  BroadcastNavi,
  DNAWEAVER:  DnaweaverNavi,
  MAGNETAR:   MagnetarNavi,
  NEUROMIND:  NeuromindNavi,
  ATOMSPARK:  AtomsparkNavi,

  // SPECIAL
  SOULBLADE:  SoulbladeNavi,
  HEARTBOND:  HeartbondNavi,
  HEXCORE:    HexcoreNavi,
  GEMSTONE:   GemstoneNavi,
  STARMARK:   StarmarkNavi,
  EYEOFTRUTH: EyeoftruthNavi,
  ORACLE:     OracleNavi,
  ANCHOR:     AnchorNavi,
};

export const NAVI_CHARACTER_NAMES = Object.keys(NAVI_CHARACTER_REGISTRY) as string[];

export function getNaviCharacter(name: string): React.LazyExoticComponent<React.FC<NaviProps>> | null {
  return NAVI_CHARACTER_REGISTRY[name.toUpperCase()] || null;
}
