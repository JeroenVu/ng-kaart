import * as ol from "openlayers";

import { Validation } from "./json-object-interpreting";
import { jsonAwvV0RuleCompiler, ContextAwareStyleFunction } from "./json-awv-v0-stijlfunctie";
import * as oi from "./json-object-interpreting";

///////////////////////////////////////////////////
// De externe input valideren als een StyleFunction
//

// type StyleFunction = (feature: (ol.Feature | ol.render.Feature), resolution: number) => (ol.style.Style | ol.style.Style[]);
export function definitieToStyleFunction(encoding: string, definitieText: string): Validation<ContextAwareStyleFunction> {
  if (encoding === "json") {
    return jsonDefinitieStringToRuleExecutor(definitieText);
  } else {
    return oi.fail(`Formaat '${encoding}' wordt niet ondersteund`);
  }
}

function jsonDefinitieStringToRuleExecutor(definitieText: string): Validation<ContextAwareStyleFunction> {
  try {
    const unvalidatedJson = JSON.parse(definitieText);
    return compileRuleJson(unvalidatedJson);
  } catch (error) {
    return oi.fail("De gegeven definitie was geen geldige JSON");
  }
}

function compileRuleJson(definitie: Object): Validation<ContextAwareStyleFunction> {
  return oi
    .field("version", oi.str)(definitie)
    .chain(version => {
      switch (version) {
        case "awv-v0":
          return oi.field("definition", jsonAwvV0RuleCompiler)(definitie);
        default:
          return oi.fail(`Versie '${version}' wordt niet ondersteund`);
      }
    });
}
