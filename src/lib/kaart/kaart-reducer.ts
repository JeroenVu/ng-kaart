import { List, Iterable } from "immutable";

import * as ol from "openlayers";

import { KaartConfig } from "./kaart.config";
import * as ke from "./kaart-elementen";
import * as prt from "./kaart-protocol";
import { KaartWithInfo } from "./kaart-with-info";
import { kaartLogger } from "./log";

///////////////////////////////////
// Hulpfuncties
//

// Dit type helpt om het updaten van het model iets minder repetitief te maken.
type ModelUpdater = (kaart: KaartWithInfo) => KaartWithInfo;

/**
 * Functiecompositie waar f eerst uitgevoerd wordt en dan g.
 */
function andThen<A, B, C>(f: (a: A) => B, g: (b: B) => C) {
  return (a: A) => g(f(a));
}

/**
 * Functiecompositie van endofuncties.
 */
function chained<A>(...fs: ((a: A) => A)[]): (a: A) => A {
  return (a: A) => fs.reduce((acc, f) => f(acc), a);
}

function updateModel(partial: Partial<KaartWithInfo>): ModelUpdater {
  return (model: KaartWithInfo) => ({ ...model, ...partial } as KaartWithInfo);
}

const keepModel: ModelUpdater = (model: KaartWithInfo) => model;

function guardedUpdate(pred: (kaart: KaartWithInfo) => boolean, updater: ModelUpdater): ModelUpdater {
  return (model: KaartWithInfo) => (pred(model) ? updater(model) : model);
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// de reducers hieronder zijn dus geen pure functies. Ze hebben bijna allen een neveneffect op de openlayers map.
// de reden is dat enerzijds Map statefull is en anderzijds dat het niet triviaal is om een efficiente differ
// te maken op KaartWithInfo (en de object daarin) zodat we enkel de gepaste operaties op Map kunnen uitvoeren.
// In principe zouden we dit moeten opsplitsen in transformaties naar het nieuwe model en interpretaties van dat
// model.
//

/**
 *  Toevoegen bovenaan de kaart. Als er al een laag was met dezelfde titel, dan wordt die eerst verwijderd.
 */
function addLaagOnTop(laag: ke.Laag): ModelUpdater {
  return insertLaag(Number.MAX_SAFE_INTEGER, laag);
}

/**
 * Een laag verwijderen. De titel van de laag bepaalt welke er verwijderd wordt.
 */
function removeLaag(titel: string): ModelUpdater {
  return (kaart: KaartWithInfo) => {
    const teVerwijderen = kaart.lagenOpTitel.get(titel);
    if (teVerwijderen) {
      kaart.map.removeLayer(teVerwijderen); // Oesje. Side-effect. Gelukkig idempotent.
      return updateModel({
        lagenOpTitel: kaart.lagenOpTitel.delete(titel),
        lagen: kaart.lagen.filterNot(l => l.titel === titel).toList()
      })(kaart);
    } else {
      return kaart;
    }
  };
}

/**
 * Een laag invoegen op een bepaaalde positie zonder er rekening mee te houden dat er al een laag met die titel bestaat.
 * Maw samen te gebruiker met removeLaag.
 */
function insertLaagNoRemoveAt(positie: number, laag: ke.Laag): ModelUpdater {
  return (kaart: KaartWithInfo) => {
    const layer = toOlLayer(kaart.config, laag);
    const effectivePosition = Math.max(0, Math.min(positie, kaart.lagen.size));
    kaart.map.getLayers().insertAt(effectivePosition, layer);
    return updateModel({
      lagenOpTitel: kaart.lagenOpTitel.set(laag.titel, layer),
      lagen: kaart.lagen.insert(effectivePosition, laag)
    })(kaart);
  };
}

function insertLaag(positie: number, laag: ke.Laag): ModelUpdater {
  // De positie is absoluut (als er genoeg lagen zijn), maar niet noodzakelijk relatief als er al een laag met de titel bestond
  return andThen(removeLaag(laag.titel), insertLaagNoRemoveAt(positie, laag));
}

const addSchaal: ModelUpdater = guardedUpdate(
  kaart => !kaart.schaal,
  kaart => {
    const schaal = new ol.control.ScaleLine();
    kaart.map.addControl(schaal);
    return updateModel({ schaal: schaal })(kaart);
  }
);

const removeSchaal: ModelUpdater = guardedUpdate(
  kaart => !!kaart.schaal,
  kaart => {
    kaart.map.removeControl(kaart.schaal);
    return { ...kaart, schaal: null };
  }
);

const addFullScreen: ModelUpdater = guardedUpdate(
  kaart => !kaart.fullScreen,
  kaart => {
    const fullScreen = new ol.control.FullScreen();
    kaart.map.addControl(fullScreen);
    return { ...kaart, fullScreen: fullScreen };
  }
);

const removeFullScreen: ModelUpdater = guardedUpdate(
  kaart => !!kaart.fullScreen,
  kaart => {
    kaart.map.removeControl(kaart.fullScreen);
    return { ...kaart, fullScreen: null };
  }
);

function addStandaardInteracties(kaart: KaartWithInfo, scrollZoomOnFocus: boolean): KaartWithInfo {
  if (!kaart.stdInteracties || kaart.stdInteracties.isEmpty()) {
    const interacties = List(ol.interaction.defaults().getArray());
    interacties.forEach(i => kaart.map.addInteraction(i)); // side effects :-(
    const newKaart = { ...kaart, stdInteracties: interacties, scrollZoomOnFocus: scrollZoomOnFocus };
    return activateMouseWheelZoom(newKaart, !scrollZoomOnFocus);
  } else {
    return kaart;
  }
}

function removeStandaardInteracties(kaart: KaartWithInfo): KaartWithInfo {
  if (kaart.stdInteracties) {
    kaart.stdInteracties.forEach(i => kaart.map.removeInteraction(i));
    return { ...kaart, stdInteracties: null, scrollZoomOnFocus: false };
  } else {
    return kaart;
  }
}

function focusOnMap(kaart: KaartWithInfo): KaartWithInfo {
  if (kaart.scrollZoomOnFocus) {
    return activateMouseWheelZoom(kaart, true);
  } else {
    return kaart;
  }
}

function loseFocusOnMap(kaart: KaartWithInfo): KaartWithInfo {
  if (kaart.scrollZoomOnFocus) {
    return activateMouseWheelZoom(kaart, false);
  } else {
    return kaart;
  }
}

function activateMouseWheelZoom(kaart: KaartWithInfo, active: boolean): KaartWithInfo {
  kaart.stdInteracties
    .filter(interaction => interaction instanceof ol.interaction.MouseWheelZoom)
    .forEach(interaction => interaction.setActive(active));
  return kaart;
}

function updateMiddelpunt(kaart: KaartWithInfo, coordinate: [number, number]): KaartWithInfo {
  kaart.map.getView().setCenter(coordinate);
  return { ...kaart, middelpunt: kaart.map.getView().getCenter(), extent: kaart.map.getView().calculateExtent(kaart.map.getSize()) };
}

function updateZoom(kaart: KaartWithInfo, zoom: number): KaartWithInfo {
  kaart.map.getView().setZoom(zoom);
  return { ...kaart, zoom: kaart.map.getView().getZoom(), extent: kaart.map.getView().calculateExtent(kaart.map.getSize()) };
}

function updateExtent(kaart: KaartWithInfo, extent: ol.Extent): KaartWithInfo {
  kaart.map.getView().fit(extent);
  return {
    ...kaart,
    middelpunt: kaart.map.getView().getCenter(),
    zoom: kaart.map.getView().getZoom(),
    extent: kaart.map.getView().calculateExtent(kaart.map.getSize())
  };
}

function updateViewport(size: ol.Size): ModelUpdater {
  return (kaart: KaartWithInfo) => {
    // eerst de container aanpassen of de kaart is uitgerekt
    if (size[0]) {
      kaart.container.style.width = `${size[0]}px`;
      kaart.container.parentElement.style.width = `${size[0]}px`;
    }
    if (size[1]) {
      kaart.container.style.height = `${size[1]}px`;
      kaart.container.parentElement.style.height = `${size[1]}px`;
    }
    kaart.map.setSize(size);
    kaart.map.updateSize();
    return {
      ...kaart,
      size: kaart.map.getSize(),
      extent: kaart.map.getView().calculateExtent(kaart.map.getSize())
    };
  };
}

function replaceFeatures(kaart: KaartWithInfo, titel: string, features: List<ol.Feature>): KaartWithInfo {
  const laag = <ol.layer.Vector>kaart.lagenOpTitel.get(titel);
  if (laag && laag.getSource) {
    laag.getSource().clear(true);
    laag.getSource().addFeatures(features.toArray());
  }
  return kaart;
}

function toOlLayer(config: KaartConfig, laag: ke.Laag) {
  switch (laag.type) {
    case ke.ElementType.WMSLAAG: {
      const l = laag as ke.WmsLaag;
      return new ol.layer.Tile(<olx.layer.TileOptions>{
        title: l.titel,
        visible: true,
        extent: l.extent,
        source: new ol.source.TileWMS({
          projection: null,
          urls: l.urls.toArray(),
          params: {
            LAYERS: l.naam,
            TILED: true,
            SRS: config.srs,
            version: l.versie
          }
        })
      });
    }
    case ke.ElementType.VECTORLAAG: {
      const l = laag as ke.VectorLaag;
      return new ol.layer.Vector(<olx.layer.VectorOptions>{
        title: l.titel,
        source: l.source,
        visible: true,
        style: l.style
      });
    }
  }
}

// Als we een achtergrondselectie willen, dan mag er ook maar 1 achtergrond zijn. Om daar voor te zorgen,
// verwijderen we alle mogelijk achtergrondlagen behalve de laagste van de openlayers map.
const keepOnlyFirstBackground: ModelUpdater = (kaart: KaartWithInfo) =>
  kaart.possibleBackgrounds
    .map(l => l.titel)
    .rest() // De eerste niet verwijderen
    .reduce((model, titel) => removeLaag(titel)(model), kaart);

// We willlen er ook zeker van zijn dat de eerste kaart van de mogelijke achtergronden de initiële achtergrond
// is. Dat kan rare effecten geven als er meer dan 1 keer gevraagd wordt om een achtergrondselector te tonen.
const addFirstBackground: ModelUpdater = (kaart: KaartWithInfo) => {
  const eerste = kaart.possibleBackgrounds.first();
  if (eerste) {
    return insertLaag(0, eerste)(kaart);
  } else {
    return kaart;
  }
};

function setBackgrounds(backgrounds: List<ke.WmsLaag>): ModelUpdater {
  return updateModel({ possibleBackgrounds: backgrounds });
}

function showBackgroundSelector(show: boolean): ModelUpdater {
  return updateModel({ showBackgroundSelector: show });
}

export function kaartReducer(kaart: KaartWithInfo, cmd: prt.KaartEvnt): KaartWithInfo {
  switch (cmd.type) {
    case prt.KaartEvntTypes.ADDED_LAAG_ON_TOP:
      return addLaagOnTop((cmd as prt.AddedLaagOnTop).laag)(kaart);
    case prt.KaartEvntTypes.REMOVED_LAAG:
      return removeLaag((cmd as prt.RemovedLaag).titel)(kaart);
    case prt.KaartEvntTypes.INSERTED_LAAG:
      const inserted = cmd as prt.InsertedLaag;
      return insertLaag(inserted.positie, inserted.laag)(kaart);
    case prt.KaartEvntTypes.ADDED_SCHAAL:
      return addSchaal(kaart);
    case prt.KaartEvntTypes.REMOVED_SCHAAL:
      return removeSchaal(kaart);
    case prt.KaartEvntTypes.ADDED_FULL_SCREEN:
      return addFullScreen(kaart);
    case prt.KaartEvntTypes.REMOVED_FULL_SCREEN:
      return removeFullScreen(kaart);
    case prt.KaartEvntTypes.ADDED_STD_INT:
      return addStandaardInteracties(kaart, (cmd as prt.AddedStandaardInteracties).scrollZoomOnFocus);
    case prt.KaartEvntTypes.REMOVED_STD_INT:
      return removeStandaardInteracties(kaart);
    case prt.KaartEvntTypes.MIDDELPUNT_CHANGED:
      return updateMiddelpunt(kaart, (cmd as prt.MiddelpuntChanged).coordinate);
    case prt.KaartEvntTypes.ZOOM_CHANGED:
      return updateZoom(kaart, (cmd as prt.ZoomChanged).zoom);
    case prt.KaartEvntTypes.EXTENT_CHANGED:
      return updateExtent(kaart, (cmd as prt.ExtentChanged).extent);
    case prt.KaartEvntTypes.VIEWPORT_CHANGED:
      return updateViewport((cmd as prt.ViewportChanged).size)(kaart);
    case prt.KaartEvntTypes.FOCUS_ON_MAP:
      return focusOnMap(kaart);
    case prt.KaartEvntTypes.LOSE_FOCUS_ON_MAP:
      return loseFocusOnMap(kaart);
    case prt.KaartEvntTypes.SHOW_FEATURES:
      const replaceFeaturesEvent = cmd as prt.ReplaceFeatures;
      return replaceFeatures(kaart, replaceFeaturesEvent.titel, replaceFeaturesEvent.features);
    case prt.KaartEvntTypes.SHOW_BG_SELECTOR:
      return guardedUpdate(
        model => !model.showBackgroundSelector,
        chained(
          setBackgrounds((cmd as prt.ShowBackgroundSelector).backgrounds),
          keepOnlyFirstBackground,
          addFirstBackground,
          showBackgroundSelector(true)
        )
      )(kaart);
    case prt.KaartEvntTypes.HIDE_BG_SELECTOR:
      return showBackgroundSelector(false)(kaart);
    default:
      kaartLogger.warn("onverwacht commando", cmd);
      return keepModel(kaart);
  }
}
