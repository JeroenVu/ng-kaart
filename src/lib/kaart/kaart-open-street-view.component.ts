import { Component, NgZone, OnInit } from "@angular/core";
import { observeOnAngular } from "../util/observe-on-angular";
import { KaartChildComponentBase } from "./kaart-child-component-base";
import { KaartClickMsg, kaartClickWrapper, KaartInternalMsg } from "./kaart-internal-messages";
import * as ol from "openlayers";
import * as rx from "rxjs";
import { ofType } from "../util/operators";
import * as prt from "./kaart-protocol";
import { Observable } from "rxjs/Observable";

@Component({
  selector: "awv-kaart-open-street-view",
  templateUrl: "./kaart-open-street-view.component.html",
  styleUrls: ["./kaart-open-street-view.component.scss"]
})
export class KaartOpenStreetViewComponent extends KaartChildComponentBase implements OnInit {
  readonly clickedPositionIconStyle = new ol.style.Style({
    image: new ol.style.Icon({
      anchor: [0.5, 0.5],
      anchorXUnits: "fraction",
      anchorYUnits: "fraction",
      scale: 0.5,
      color: "#00a2c5",
      src: "./material-design-icons/maps/2x_web/ic_my_location_white_18dp.png"
    })
  });

  private clickSubscription: rx.Subscription = new rx.Subscription();

  actief = false;

  constructor(zone: NgZone) {
    super(zone);
  }

  protected kaartSubscriptions(): prt.Subscription<KaartInternalMsg>[] {
    return [prt.KaartClickSubscription(kaartClickWrapper)];
  }
  ngOnInit(): void {
    super.ngOnInit();
  }

  startLuisterenOpClickEvents(): void {
    this.actief = true;
    document.body.style.cursor = "crosshair";

    this.clickSubscription.unsubscribe();
    this.clickSubscription = this.internalMessage$
      .pipe(
        ofType<KaartClickMsg>("KaartClick"), //
        observeOnAngular(this.zone)
      )
      .skipUntil(Observable.timer(0)) // enkel geinteresseerd in messages nadat subscribe() wordt opgeroepen
      .take(1) // 1 click message is genoeg
      .subscribe(msg => {
        this.openGoogleStreetView(msg.clickCoordinaat);
      });
  }

  stopLuisterenOpClickEvents(): void {
    this.actief = false;
    document.body.style.cursor = "default";

    this.clickSubscription.unsubscribe();
  }

  openGoogleStreetView(coordinaat: ol.Coordinate): void {
    const wsg84xy = ol.proj.transform(coordinaat, ol.proj.get("EPSG:31370"), ol.proj.get("EPSG:4326"));
    const strtv_url = `http://maps.google.com/?cbll= ${wsg84xy[1]},${wsg84xy[0]} &cbp=12,0,0,0,0&layer=c&source=embed&z=14&output=svembed`;

    window.open(strtv_url);

    this.stopLuisterenOpClickEvents();
  }
}
