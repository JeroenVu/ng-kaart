import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import * as ol from "openlayers";

@Component({
  selector: "awv-pat-kaart",
  templateUrl: "./pat-kaart.component.html",
  styleUrls: ["./pat-kaart.component.scss"],
  encapsulation: ViewEncapsulation.None
})
export class PatKaartComponent implements OnInit {
  ngOnInit(): void {}

  patrimoniumHoverStyle(): ol.style.Style {
    const fill = new ol.style.Fill({
      color: "rgb(255,0,0)"
    });
    return new ol.style.Style({
      fill: fill,
      stroke: null
    });
  }

  patrimoniumSelectStyle(): ol.style.Style {
    const fill = new ol.style.Fill({
      color: "rgb(0,255,0)"
    });
    return new ol.style.Style({
      fill: fill,
      stroke: null
    });
  }
}
