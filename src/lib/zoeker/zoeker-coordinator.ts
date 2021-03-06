import { List, Map, Set } from "immutable";
import { Subject } from "rxjs";
import { Subscription } from "rxjs/Subscription";

import { ZoekerBase, ZoekInput, ZoekResultaat, ZoekResultaten } from "./zoeker-base";

export class ZoekerCoordinator {
  private zoekers: Array<ZoekerBase> = Array();
  private zoekerSubscriptions: Map<string, Subscription> = Map();

  constructor(private zoekerSubject: Subject<ZoekResultaten>, private zoekerResultaatKlikSubj: Subject<ZoekResultaat>) {}

  isZoekerGeregistreerd(naam: string): boolean {
    return this.zoekers.some(zoeker => zoeker.naam() === naam);
  }

  isMinstens1ZoekerGeregistreerd(): boolean {
    return this.zoekers.length > 0;
  }

  verwijderZoeker(naam: string) {
    this.zoekerSubscriptions
      .filter((subscription, zoekerNaam) => zoekerNaam === naam)
      .forEach(subscription => this.unsubscribeZoeker(subscription!));

    this.zoekerSubscriptions = this.zoekerSubscriptions.delete(naam);
    this.zoekers = this.zoekers.filter(zoeker => zoeker.naam() !== naam);
  }

  unsubscribeZoeker(subscription: Subscription) {
    subscription.unsubscribe();
  }

  voegZoekerToe(zoeker: ZoekerBase) {
    this.zoekers = this.zoekers.concat(zoeker);
  }

  zoekResultaatGeklikt(resultaat: ZoekResultaat) {
    this.zoekerResultaatKlikSubj.next(resultaat);
  }

  zoek(input: ZoekInput, zoekers: Set<string>) {
    // Annuleer bestaande zoekOpdrachten.
    this.zoekerSubscriptions.forEach(subscription => this.unsubscribeZoeker(subscription!));
    // Stuur zoek comando naar alle geregistreerde zoekers of enkel naar de gespecifieerde.
    const gekozenZoekers = zoekers.isEmpty() ? this.zoekers : this.zoekers.filter(zoeker => zoekers.contains(zoeker.naam()));
    this.zoekerSubscriptions = gekozenZoekers.reduce(
      (subscriptions, zoeker) =>
        subscriptions.set(
          zoeker.naam(),
          zoeker.zoek$(input).subscribe(zoekResultaat => {
            this.zoekerSubject.next(zoekResultaat); // TODO verwijder dit anti-pattern
          })
        ),
      Map<string, Subscription>()
    );
  }

  zoekerNamen(): Set<string> {
    return Set(this.zoekers.map(z => z.naam()));
  }

  zoekerServices(): List<ZoekerBase> {
    return List(this.zoekers);
  }
}
