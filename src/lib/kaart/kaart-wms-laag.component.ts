import { Component, Input, ViewEncapsulation } from "@angular/core";
import { List } from "immutable";

import * as ol from "openlayers";

import { KaartLaagComponent } from "./kaart-laag.component";
import { KaartClassicComponent } from "./kaart-classic.component";
import { WmsLaag, WmsType } from "./kaart-elementen";

@Component({
  selector: "awv-kaart-wms-laag",
  template: "<ng-content></ng-content>",
  encapsulation: ViewEncapsulation.None
})
export class KaartWmsLaagComponent extends KaartLaagComponent {
  @Input() laagNaam: string;
  @Input() urls: string[];
  @Input() tiled = true;
  @Input() type: string;
  @Input() versie?: string;
  @Input() extent?: ol.Extent = [18000.0, 152999.75, 280144.0, 415143.75];
  @Input() dekkend = true;

  constructor(kaart: KaartClassicComponent) {
    super(kaart);
  }

  createLayer(): WmsLaag {
    return {
      type: WmsType,
      titel: this.titel,
      dekkend: this.dekkend,
      naam: this.laagNaam,
      extent: this.extent,
      urls: List(this.urls),
      versie: this.versie
    };
  }
}
