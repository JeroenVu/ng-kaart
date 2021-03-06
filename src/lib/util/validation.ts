import { validation } from "fp-ts";
import { Applicative2C } from "fp-ts/lib/Applicative";
import { array as Array } from "fp-ts/lib/Array";
import { Monad2C } from "fp-ts/lib/Monad";
import { Option } from "fp-ts/lib/Option";
import { getArraySemigroup } from "fp-ts/lib/Semigroup";
import { sequence } from "fp-ts/lib/Traversable";
import { URI, Validation } from "fp-ts/lib/Validation";

export type ErrValidation<A> = Validation<string[], A>;

export const validationAp: Applicative2C<URI, string[]> = validation.getApplicative(getArraySemigroup<string>());

export const allOf = sequence(validationAp, Array);

export const success = <A>(a: A) => validation.success<string[], A>(a);
export const failure = <A>(err: string) => validation.failure<string[], A>([err]);

export function fromOption<A>(maybe: Option<A>, errorMsg: string): ErrValidation<A> {
  return maybe.map(t => validation.success<string[], A>(t)).getOrElse(validation.failure([errorMsg]));
}

export function fromPredicate<A>(a: A, pred: (a: A) => boolean, errMsg: string): ErrValidation<A> {
  return validation.fromPredicate(pred, () => [errMsg])(a);
}

export function fromBoolean(thruth: boolean, errMsg: string): Validation<string[], {}> {
  return thruth ? validation.success({}) : validation.failure([errMsg]);
}

export const validationMonad: Monad2C<URI, string[]> = validation.getMonad(getArraySemigroup<string>());

export const validationChain = validationMonad.chain;

export function applyValidationChain<A, B, C>(
  f: ((_: A) => Validation<string[], B>),
  g: ((_: B) => Validation<string[], C>)
): (_: A) => Validation<string[], C> {
  return (a: A) => validationChain(f(a), g);
}

export function join(texts: string[], sep = ","): string {
  return Array.reduce(
    texts, //
    "",
    (head: string, elt: string) => (head.length === 0 ? elt : head + sep + elt)
  );
}
