import { InjectionToken } from "@angular/core";
import * as ol from "openlayers";

export const KAART_CFG = new InjectionToken<KaartConfig>("kaartcfg");

export interface KaartConfig {
  readonly tilecache: {
    readonly urls: string[];
  };
  readonly geoserver: {
    readonly urls: string[];
  };
  readonly orthofotomozaiek: {
    readonly naam: string;
    readonly urls: string[];
  };
  readonly srs: string;

  readonly defaults: {
    zoom: number;
    middelpunt: ol.Coordinate;
    grootte: [number | undefined, number | undefined];
    resolutions: number[];
    extent: ol.Extent;
    style: ol.style.Style;
  };
}

const stdStijl = new ol.style.Style({
  fill: new ol.style.Fill({
    color: "#5555FF40"
  }),
  stroke: new ol.style.Stroke({
    color: "darkslateblue ",
    width: 4
  }),
  image: new ol.style.Circle({
    fill: new ol.style.Fill({
      color: "maroon"
    }),
    stroke: new ol.style.Stroke({
      color: "gray",
      width: 1.25
    }),
    radius: 5
  })
});
