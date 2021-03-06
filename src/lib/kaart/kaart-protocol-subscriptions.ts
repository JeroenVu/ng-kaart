import { Option } from "fp-ts/lib/Option";
import { List, Map, Set } from "immutable";
import * as ol from "openlayers";

import { ZoekResultaat, ZoekResultaten } from "../zoeker/zoeker-base";

import * as ke from "./kaart-elementen";
import { TekenResultaat } from "./kaart-elementen";
import { InfoBoodschap } from "./kaart-with-info-model";

/////////
// Types
//

export type Subscription<Msg> =
  | AchtergrondTitelSubscription<Msg>
  | ActieveModusSubscription<Msg>
  | ComponentFoutSubscription<Msg>
  | ExtentSubscription<Msg>
  | GeometryChangedSubscription<Msg>
  | GeselecteerdeFeaturesSubscription<Msg>
  | HoverFeaturesSubscription<Msg>
  | InfoBoodschappenSubscription<Msg>
  | KaartClickSubscription<Msg>
  | LaagVerwijderdSubscription<Msg>
  | LagenInGroepSubscription<Msg>
  | MiddelpuntSubscription<Msg>
  | TekenenSubscription<Msg>
  | ViewinstellingenSubscription<Msg>
  | ZichtbareFeaturesSubscription<Msg>
  | ZoekResultaatSelectieSubscription<Msg>
  | ZoekResultatenSubscription<Msg>
  | ZoomSubscription<Msg>;

export interface Viewinstellingen {
  zoom: number;
  minZoom: number;
  maxZoom: number;
  resolution: number;
  extent: ol.Extent;
  center: ol.Coordinate;
}

export interface GeselecteerdeFeatures {
  geselecteerd: List<ol.Feature>;
  toegevoegd: Option<ol.Feature>;
  verwijderd: Option<ol.Feature>;
}

export interface HoverFeature {
  geselecteerd: Option<ol.Feature>;
}

export interface ViewinstellingenSubscription<Msg> {
  readonly type: "Viewinstellingen";
  readonly wrapper: (instellingen: Viewinstellingen) => Msg;
}

export interface ZoomSubscription<Msg> {
  readonly type: "Zoom";
  readonly wrapper: (zoom: number) => Msg;
}

export interface MiddelpuntSubscription<Msg> {
  readonly type: "Middelpunt";
  readonly wrapper: (center: ol.Coordinate) => Msg;
}

export interface ExtentSubscription<Msg> {
  readonly type: "Extent";
  readonly wrapper: (extent: ol.Extent) => Msg;
}

export interface GeselecteerdeFeaturesSubscription<Msg> {
  readonly type: "GeselecteerdeFeatures";
  readonly wrapper: (geselecteerdeFeatures: GeselecteerdeFeatures) => Msg;
}

export interface HoverFeaturesSubscription<Msg> {
  readonly type: "HoverFeatures";
  readonly wrapper: (hoverFeature: HoverFeature) => Msg;
}

export interface ZichtbareFeaturesSubscription<Msg> {
  readonly type: "ZichtbareFeatures";
  readonly wrapper: (zicthbareFeatures: List<ol.Feature>) => Msg;
}

export interface AchtergrondTitelSubscription<Msg> {
  readonly type: "Achtergrond";
  readonly wrapper: (titel: string) => Msg;
}

export interface LagenInGroepSubscription<Msg> {
  readonly type: "LagenInGroep";
  readonly groep: ke.Laaggroep;
  readonly wrapper: (lagen: List<ke.ToegevoegdeLaag>) => Msg;
}

export interface LaagVerwijderdSubscription<Msg> {
  readonly type: "LaagVerwijderd";
  readonly wrapper: (laag: ke.ToegevoegdeLaag) => Msg;
}

export interface KaartClickSubscription<Msg> {
  readonly type: "KaartClick";
  readonly wrapper: (coordinaat: ol.Coordinate) => Msg;
}

export interface ZoekResultatenSubscription<Msg> {
  readonly type: "ZoekResultaten";
  readonly wrapper: (resultaten: ZoekResultaten) => Msg;
}

export interface ZoekResultaatSelectieSubscription<Msg> {
  readonly type: "ZoekResultaatSelectie";
  readonly wrapper: (resultaat: ZoekResultaat) => Msg;
}

export interface ActieveModusSubscription<Msg> {
  readonly type: "ActieveModus";
  readonly wrapper: (modus: Option<string>) => Msg;
}

export interface GeometryChangedSubscription<Msg> {
  readonly type: "GeometryChanged";
  readonly tekenSettings: ke.TekenSettings;
  readonly wrapper: (resultaat: TekenResultaat) => Msg;
}

export interface TekenenSubscription<Msg> {
  readonly type: "Tekenen";
  readonly wrapper: (settings: Option<ke.TekenSettings>) => Msg;
}

export interface InfoBoodschappenSubscription<Msg> {
  readonly type: "InfoBoodschap";
  readonly wrapper: (infoBoodschappen: Map<string, InfoBoodschap>) => Msg;
}

export interface ComponentFoutSubscription<Msg> {
  readonly type: "ComponentFout";
  readonly wrapper: (fouten: List<string>) => Msg;
}

///////////////
// Constructors
//

export function ViewinstellingenSubscription<Msg>(wrapper: (settings: Viewinstellingen) => Msg): ViewinstellingenSubscription<Msg> {
  return { type: "Viewinstellingen", wrapper: wrapper };
}

export function GeselecteerdeFeaturesSubscription<Msg>(
  wrapper: (geselecteerdeFeatures: GeselecteerdeFeatures) => Msg
): GeselecteerdeFeaturesSubscription<Msg> {
  return { type: "GeselecteerdeFeatures", wrapper: wrapper };
}

export function HoverFeaturesSubscription<Msg>(wrapper: (hoverFeatures: HoverFeature) => Msg): HoverFeaturesSubscription<Msg> {
  return { type: "HoverFeatures", wrapper: wrapper };
}

export function ZichtbareFeaturesSubscription<Msg>(
  msgGen: (zichtbareFeatures: List<ol.Feature>) => Msg
): ZichtbareFeaturesSubscription<Msg> {
  return { type: "ZichtbareFeatures", wrapper: msgGen };
}

export function ZoomSubscription<Msg>(wrapper: (zoom: number) => Msg): ZoomSubscription<Msg> {
  return { type: "Zoom", wrapper: wrapper };
}

export function MiddelpuntSubscription<Msg>(wrapper: (center: ol.Coordinate) => Msg): MiddelpuntSubscription<Msg> {
  return { type: "Middelpunt", wrapper: wrapper };
}

export function ExtentSubscription<Msg>(wrapper: (extent: ol.Extent) => Msg): ExtentSubscription<Msg> {
  return { type: "Extent", wrapper: wrapper };
}

export function AchtergrondTitelSubscription<Msg>(wrapper: (titel: string) => Msg): AchtergrondTitelSubscription<Msg> {
  return { type: "Achtergrond", wrapper: wrapper };
}

export function LagenInGroepSubscription<Msg>(
  groep: ke.Laaggroep,
  msgGen: (lagen: List<ke.ToegevoegdeLaag>) => Msg
): LagenInGroepSubscription<Msg> {
  return { type: "LagenInGroep", groep: groep, wrapper: msgGen };
}

export function LaagVerwijderdSubscription<Msg>(msgGen: (laag: ke.ToegevoegdeLaag) => Msg): LaagVerwijderdSubscription<Msg> {
  return { type: "LaagVerwijderd", wrapper: msgGen };
}

export function ZoekResultatenSubscription<Msg>(wrapper: (resultaten: ZoekResultaten) => Msg): ZoekResultatenSubscription<Msg> {
  return { type: "ZoekResultaten", wrapper: wrapper };
}

export function ZoekResultaatSelectieSubscription<Msg>(wrapper: (resultaat: ZoekResultaat) => Msg): ZoekResultaatSelectieSubscription<Msg> {
  return { type: "ZoekResultaatSelectie", wrapper: wrapper };
}

export function KaartClickSubscription<Msg>(wrapper: (coordinaat: ol.Coordinate) => Msg): Subscription<Msg> {
  return { type: "KaartClick", wrapper: wrapper };
}

export function InfoBoodschappenSubscription<Msg>(wrapper: (boodschappen: Map<string, InfoBoodschap>) => Msg): Subscription<Msg> {
  return { type: "InfoBoodschap", wrapper: wrapper };
}

export function GeometryChangedSubscription<Msg>(
  tekenSettings: ke.TekenSettings,
  wrapper: (resultaat: TekenResultaat) => Msg
): GeometryChangedSubscription<Msg> {
  return { type: "GeometryChanged", tekenSettings: tekenSettings, wrapper: wrapper };
}

export function TekenenSubscription<Msg>(wrapper: (settings: Option<ke.TekenSettings>) => Msg): TekenenSubscription<Msg> {
  return { type: "Tekenen", wrapper: wrapper };
}

export function ActieveModusSubscription<Msg>(wrapper: (modus: Option<string>) => Msg): ActieveModusSubscription<Msg> {
  return { type: "ActieveModus", wrapper: wrapper };
}

export function ComponentFoutSubscription<Msg>(wrapper: (fouten: List<string>) => Msg): ComponentFoutSubscription<Msg> {
  return {
    type: "ComponentFout",
    wrapper: wrapper
  };
}
