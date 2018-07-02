import { Component } from "@angular/core";

import { StreetViewUiSelector } from "../../kaart/open-street-view/kaart-open-street-view.component";
import { ClassicUIElementSelectorComponentBase } from "../common/classic-ui-element-selector-component-base";
import { KaartClassicComponent } from "../kaart-classic.component";

@Component({
  selector: "awv-kaart-streetview",
  template: ""
})
export class ClassicStreetViewComponent extends ClassicUIElementSelectorComponentBase {
  constructor(readonly kaart: KaartClassicComponent) {
    super(StreetViewUiSelector, kaart);
  }
}
