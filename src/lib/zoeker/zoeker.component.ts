import { Component, NgZone, OnDestroy, OnInit } from "@angular/core";
import { FormControl } from "@angular/forms";
import { SafeHtml } from "@angular/platform-browser";
import { none, Option } from "fp-ts/lib/Option";
import { List } from "immutable";
import * as ol from "openlayers";
import { debounce, distinctUntilChanged } from "rxjs/operators";
import { Subscription } from "rxjs/Subscription";

import { SubscriptionResult } from "../kaart";
import { KaartChildComponentBase } from "../kaart/kaart-child-component-base";
import * as ke from "../kaart/kaart-elementen";
import { KaartInternalMsg, kaartLogOnlyWrapper } from "../kaart/kaart-internal-messages";
import * as prt from "../kaart/kaart-protocol";
import { KaartCmdValidation } from "../kaart/kaart-protocol";
import { compareResultaten, ZoekResultaat, ZoekResultaten } from "./abstract-zoeker";

const ZoekerLaagNaam = "Zoeker";

export class Fout {
  constructor(readonly zoeker: string, readonly fout: string) {}
}

@Component({
  selector: "awv-zoeker",
  templateUrl: "./zoeker.component.html",
  styleUrls: ["./zoeker.component.scss"]
})
export class ZoekerComponent extends KaartChildComponentBase implements OnInit, OnDestroy {
  zoekVeld = new FormControl();
  alleZoekResultaten: ZoekResultaat[] = [];
  alleFouten: Fout[] = [];
  legende: Map<string, SafeHtml> = new Map<string, SafeHtml>();
  legendeKeys: string[] = [];
  toonHelp = false;
  toonResultaat = true;

  private subscription: Option<Subscription> = none;
  private byPassDebounce: () => void;
  private extent: ol.Extent = ol.extent.createEmpty();

  private static createLayer(): ke.VectorLaag {
    return {
      type: ke.VectorType,
      titel: ZoekerLaagNaam,
      source: new ol.source.Vector(),
      styleSelector: none,
      selecteerbaar: true,
      minZoom: 2,
      maxZoom: 15
    };
  }

  private static maakNieuwFeature(resultaat: ZoekResultaat): ol.Feature[] {
    const feature = new ol.Feature({ data: resultaat, geometry: resultaat.geometry, name: resultaat.omschrijving });
    feature.setId(resultaat.index);
    feature.setStyle(resultaat.style);

    let middlePoint: ol.geom.Point | undefined = undefined;
    if (resultaat.locatie.type === "MultiLineString") {
      // voeg een puntelement toe ergens op de linestring om een icoon met nummer te tonen
      const lineStrings = resultaat.geometry.getLineStrings();
      const lineString = lineStrings[Math.floor(lineStrings.length / 2)];
      middlePoint = new ol.geom.Point(lineString.getCoordinateAt(0.5));
    } else if (resultaat.locatie.type === "Polygon" || resultaat.locatie.type === "MultiPolygon") {
      // in midden van gemeente polygon
      const extent = resultaat.geometry.getExtent();
      middlePoint = new ol.geom.Point([(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2]);
    }
    if (middlePoint !== undefined) {
      const middelpuntFeature = new ol.Feature({
        data: resultaat,
        geometry: middlePoint,
        name: resultaat.omschrijving
      });
      middelpuntFeature.setStyle(resultaat.style);
      return [feature, middelpuntFeature];
    } else {
      return [feature];
    }
  }

  constructor(zone: NgZone) {
    super(zone);
  }

  protected kaartSubscriptions(): prt.Subscription<KaartInternalMsg>[] {
    return [prt.ZoekerSubscription(r => this.processZoekerAntwoord(r))];
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.bindToLifeCycle(
      this.zoekVeld.valueChanges.pipe(
        debounce((value: string) => {
          // Form changes worden debounced tot deze promise geresolved wordt.
          return new Promise(resolve => {
            // We houden de resolve functie pointer bij om de debounce te kunnen bypassen (bv. bij form submit).
            this.byPassDebounce = resolve;
            if (value.length >= 3 || value.length === 0) {
              // De gebruiker kan locatie voorstellen krijgen door in het zoekveld minstens 3 tekens in te typen.
              // We resolven hoe dan ook na een bepaalde timeout, zodat de zoek uitgevoerd wordt.
              setTimeout(resolve, 800);
            }
          });
        }),
        distinctUntilChanged()
      )
    ).subscribe(value => {
      this.toonResultaat = true;
      this.maakResultaatLeeg();

      if (value.length > 0) {
        this.dispatcher.dispatch({ type: "Zoek", input: value, wrapper: kaartLogOnlyWrapper });
      }
    });
    this.dispatcher.dispatch({
      type: "VoegLaagToe",
      positie: 1,
      laag: ZoekerComponent.createLayer(),
      magGetoondWorden: true,
      laaggroep: "Tools",
      wrapper: kaartLogOnlyWrapper
    });
  }

  ngOnDestroy(): void {
    this.dispatcher.dispatch(prt.VerwijderLaagCmd(ZoekerLaagNaam, kaartLogOnlyWrapper));
    super.ngOnDestroy();
  }

  toggleResultaat() {
    this.toonResultaat = !this.toonResultaat;
    if (this.toonResultaat) {
      this.zoomNaarVolledigeExtent();
    }
  }

  toggleHelp() {
    this.toonHelp = !this.toonHelp;
  }

  zoomNaarResultaat(resultaat: ZoekResultaat) {
    this.toonResultaat = false;
    this.toonHelp = false;
    const extent = resultaat.geometry.getExtent();
    if (!ol.extent.isEmpty(extent)) {
      this.dispatcher.dispatch(prt.VeranderExtentCmd(extent));
    }
  }

  onKey(event: any) {
    // De gebruiker kan locatie voorstellen krijgen door in het zoekveld max. 2 tekens in te typen en op enter te drukken
    if (event.keyCode === 13 && event.srcElement.value.length >= 2 && this.byPassDebounce) {
      this.byPassDebounce();
    }
  }

  private maakResultaatLeeg() {
    this.alleFouten = [];
    this.alleZoekResultaten = [];
    this.extent = ol.extent.createEmpty();
    this.legende.clear();
    this.legendeKeys = [];
    this.dispatcher.dispatch(prt.VervangFeaturesCmd(ZoekerLaagNaam, List(), kaartLogOnlyWrapper));
  }

  private processZoekerAntwoord(nieuweResultaten: ZoekResultaten): KaartInternalMsg {
    this.alleZoekResultaten = this.alleZoekResultaten
      .filter(resultaat => resultaat.zoeker !== nieuweResultaten.zoeker)
      .concat(nieuweResultaten.resultaten);
    this.alleZoekResultaten.sort((a, b) => compareResultaten(a, b, this.zoekVeld.value));
    nieuweResultaten.legende.forEach((safeHtml, name) => this.legende.set(name!, safeHtml!));
    this.legendeKeys = Array.from(this.legende.keys());

    this.alleFouten = this.alleFouten
      .filter(resultaat => resultaat.zoeker !== nieuweResultaten.zoeker)
      .concat(nieuweResultaten.fouten.map(fout => new Fout(nieuweResultaten.zoeker, fout)));

    const features: List<ol.Feature> = this.alleZoekResultaten.reduce(
      (list, resultaat) => list.push(...ZoekerComponent.maakNieuwFeature(resultaat)),
      List<ol.Feature>()
    );
    this.extent = features
      .map(feature => feature!.getGeometry().getExtent())
      .reduce((maxExtent, huidigeExtent) => ol.extent.extend(maxExtent!, huidigeExtent!), ol.extent.createEmpty());

    this.dispatcher.dispatch(prt.VervangFeaturesCmd(ZoekerLaagNaam, features, kaartLogOnlyWrapper));

    this.zoomNaarVolledigeExtent();

    return {
      type: "KaartInternal",
      payload: none
    };
  }

  private zoomNaarVolledigeExtent() {
    if (!ol.extent.isEmpty(this.extent)) {
      this.dispatcher.dispatch(prt.VeranderExtentCmd(this.extent));
    }
  }
}
