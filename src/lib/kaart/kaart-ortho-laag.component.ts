import { Component, ViewEncapsulation, Inject } from "@angular/core";
import { List } from "immutable";

import { KaartClassicComponent } from "./kaart-classic.component";
import { KaartConfig, KAART_CFG } from "./kaart.config";
import { KaartWmsLaagComponent } from "./kaart-wms-laag.component";
import { WmsLaag, WmsType } from "./kaart-elementen";

@Component({
  selector: "awv-kaart-ortho-laag",
  template: "<ng-content></ng-content>",
  encapsulation: ViewEncapsulation.None
})
export class KaartOrthoLaagComponent extends KaartWmsLaagComponent {
  constructor(kaart: KaartClassicComponent, @Inject(KAART_CFG) private readonly config: KaartConfig) {
    super(kaart);
  }

  createLayer(): WmsLaag {
    return {
      type: WmsType,
      titel: this.titel,
      dekkend: true,
      naam: this.config.orthofotomozaiek.naam,
      extent: this.extent,
      urls: List(this.config.orthofotomozaiek.urls),
      versie: this.versie
    };
  }
}
