import { SafeHtml } from "@angular/platform-browser";
import { Map } from "immutable";
import * as ol from "openlayers";
import { Observable } from "rxjs/Observable";

export const geoJSONOptions = <ol.olx.format.GeoJSONOptions>{
  ignoreExtraDims: true,
  defaultDataProjection: undefined,
  featureProjection: undefined
};

export interface ZoekResultaat {
  partialMatch: boolean;
  index: number;
  omschrijving: string;
  bron: string;
  zoeker: string;
  geometry: any;
  locatie: any;
  icoon: SafeHtml;
  style: ol.style.Style;
}

export class ZoekResultaten {
  constructor(
    public zoeker: string,
    public fouten: string[] = [],
    public resultaten: ZoekResultaat[] = [],
    public legende: Map<string, string> = Map()
  ) {}

  limiteerAantalResultaten(maxAantal: number): ZoekResultaten {
    if (this.resultaten.length >= maxAantal) {
      return new ZoekResultaten(
        this.zoeker,
        this.fouten.concat([`Er werden meer dan ${maxAantal} resultaten gevonden, ` + `de eerste ${maxAantal} worden hier opgelijst`]),
        this.resultaten.slice(0, maxAantal),
        this.legende
      );
    } else {
      return this;
    }
  }
}

export interface AbstractZoeker {
  naam(): string;
  zoek$(zoekterm: string): Observable<ZoekResultaten>;
}

// De resultaten worden getoond volgens een bepaalde hiërarchie
export function compareResultaten(a: ZoekResultaat, b: ZoekResultaat, input: string): number {
  const aMatchesInput = matchesInput(a, input);
  const bMatchesInput = matchesInput(b, input);

  if (aMatchesInput) {
    if (bMatchesInput) {
      // Zowel a als b matchen met de input, doe op volgend niveau.
      return compareOpBronEnInhoud(a, b);
    } else {
      return -1;
    }
  } else if (bMatchesInput) {
    return 1;
  } else {
    return compareOpBronEnInhoud(a, b);
  }
}

//  - Eerst wordt er gekeken naar de resultaten in de tekst (als de 3 tekens matchen met de 3 eerste tekens van het resultaat)
function matchesInput(res: ZoekResultaat, input: string): boolean {
  return res.omschrijving.toLowerCase().startsWith(input.toLowerCase());
}

//  - Vervolgens wordt daarin eerst het resultaat van WDB getoond, daarna CRAB en daar Google Places
function compareOpBronEnInhoud(a: ZoekResultaat, b: ZoekResultaat): number {
  const bronA = bronNaarNummer(a);
  const bronB = bronNaarNummer(b);
  if (bronA === bronB) {
    return a.omschrijving.localeCompare(b.omschrijving);
  } else {
    return bronA - bronB;
  }
}

function bronNaarNummer(res: ZoekResultaat): number {
  if (res.bron.toLowerCase().startsWith("wdb")) {
    return 1;
  } else if (res.bron.toLowerCase().startsWith("crab")) {
    return 2;
  } else {
    return 3;
  }
}