import { Component, Input, NgZone, ViewEncapsulation } from "@angular/core";
import { option } from "fp-ts";
import { fromNullable } from "fp-ts/lib/Option";
import { OrderedMap } from "immutable";

import * as ke from "../../kaart/kaart-elementen";
import * as ss from "../../kaart/stijl-selector";
import { NosqlFsSource } from "../../source/nosql-fs-source";
import { KaartClassicComponent } from "../kaart-classic.component";

import { ClassicVectorLaagLikeComponent } from "./classic-vector-laag-like.component";

@Component({
  selector: "awv-kaart-nosqlfs-laag",
  template: "<ng-content></ng-content>",
  encapsulation: ViewEncapsulation.None
})
export class ClassicNosqlfsLaagComponent extends ClassicVectorLaagLikeComponent {
  @Input() url = "/geolatte-nosqlfs";
  @Input() database: string;
  @Input() view = "default";
  @Input() collection: string;
  @Input() filter: string;

  constructor(kaart: KaartClassicComponent, zone: NgZone) {
    super(kaart, zone);
  }

  createLayer(): ke.VectorLaag {
    return {
      type: ke.VectorType,
      titel: this.titel,
      source: new NosqlFsSource(
        this.database,
        this.collection,
        this.url,
        option.fromNullable(this.view),
        option.fromNullable(this.filter),
        this.titel
      ),
      styleSelector: this.getMaybeStyleSelector(),
      selectieStyleSelector: fromNullable(this.selectieStyle).chain(ss.asStyleSelector),
      hoverStyleSelector: fromNullable(this.hoverStyle).chain(ss.asStyleSelector),
      selecteerbaar: this.selecteerbaar,
      hover: this.hover,
      minZoom: this.minZoom,
      maxZoom: this.maxZoom,
      offsetveld: fromNullable(this.offsetveld),
      velden: OrderedMap<string, ke.VeldInfo>()
    };
  }
}
