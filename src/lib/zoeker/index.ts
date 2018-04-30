import { CommonModule } from "@angular/common";
import { ModuleWithProviders, NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { HttpModule } from "@angular/http";
import {
  MatFormFieldModule,
  MatIconModule,
  MatInputModule,
  MatMenuModule,
  MatAutocompleteModule,
  MatButtonModule
} from "@angular/material";

import { GoogleLocatieZoekerComponent } from "./google-locatie-zoeker.component";
import { GoogleLocatieZoekerService } from "./google-locatie-zoeker.service";
import { ZoekerHighlightPipe } from "./zoeker-highlight.pipe";
import { ZoekerComponent } from "./zoeker.component";
import { ZOEKER_CFG, ZoekerConfigData } from "./zoeker.config";
import { CrabZoekerComponent } from "./crab-zoeker.component";
import { ZoekerInjectorComponent } from "./zoeker-injector.component";
import { CrabZoekerService } from "./crab-zoeker.service";
import { PerceelService } from "./perceel.service";
import { HttpClientModule } from "@angular/common/http";

const components: any[] = [
  GoogleLocatieZoekerComponent,
  CrabZoekerComponent,
  ZoekerComponent,
  ZoekerHighlightPipe,
  ZoekerInjectorComponent
];

@NgModule({
  imports: [
    CommonModule,
    HttpModule,
    HttpClientModule,
    ReactiveFormsModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatMenuModule,
    MatAutocompleteModule,
    MatButtonModule
  ],
  declarations: [components],
  entryComponents: [ZoekerInjectorComponent],
  exports: [components],
  providers: [GoogleLocatieZoekerService, CrabZoekerService, PerceelService]
})
export class ZoekerModule {
  static forRoot(config: ZoekerConfigData): ModuleWithProviders {
    return {
      ngModule: ZoekerModule,
      providers: [{ provide: ZOEKER_CFG, useValue: config }]
    };
  }
}

export * from "./google-locatie-zoeker.service";
export * from "./google-locatie-zoeker.component";
export * from "./google-locatie-zoeker.config";

export * from "./crab-zoeker.service";
export * from "./crab-zoeker.component";
export * from "./crab-zoeker.config";
export * from "./perceel.service";

export * from "./zoeker-highlight.pipe";
export * from "./zoeker.component";
export * from "./abstract-zoeker";
