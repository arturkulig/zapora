import { Atom } from "@zapora/core";
import { ZBChild, ZBChildren } from "../../publicTypes";
import { ChildKey } from "./ChildKey";
import { ZB_NS, ZB_TAG_COMPONENT, ZB_TAG_FRAGMENT } from "./fragmentSymbols";
import { mapValues } from "./mapValues";
import {
  isSamePath,
  ZBPathedFinalChildren,
  ZoneOrigin,
  ZonePath,
} from "./ZonePath";

export interface ComponentStateEntry {
  path: ZonePath;
  states: Record<string, Atom<any>>;
}

export function resolveNonElements(
  children: ZBChildren,
  path: ZonePath,
  localStates: ComponentStateEntry[],
  result: ZBPathedFinalChildren,
) {
  if (Array.isArray(children)) {
    for (let index = 0; index < children.length; index++) {
      resolveNonElement(children[index], index, path, localStates, result);
    }
  } else {
    resolveNonElement(children, 0, path, localStates, result);
  }
}

function resolveNonElement(
  child: ZBChild,
  index: number,
  path: ZonePath,
  localStates: ComponentStateEntry[],
  result: ZBPathedFinalChildren,
) {
  if (typeof child === "string") {
    result.push({
      path: [{ origin: null, position: index }],
      item: child,
    });
    return;
  }

  if (child.namespace === ZB_NS && child.tag === ZB_TAG_FRAGMENT) {
    if (child.children.length) {
      const fragmentZonePath = [...path, makeZone(true, index, child.key)];

      resolveNonElements(child.children, fragmentZonePath, localStates, result);
    }
    return;
  }

  if (child.namespace === ZB_NS && child.tag === ZB_TAG_COMPONENT) {
    const componentPath = [
      ...path,
      makeZone(child.component, index, child.key),
    ];
    const componentState = selectLocalState(
      localStates,
      componentPath,
      child.props,
      child.defaultStateValues,
    );
    const componentUnresolvedChildren = child.component(
      child.props,
      componentState,
    );

    Array.isArray(componentUnresolvedChildren)
      ? resolveNonElements(
          componentUnresolvedChildren,
          componentPath,
          localStates,
          result,
        )
      : resolveNonElement(
          componentUnresolvedChildren,
          0,
          componentPath,
          localStates,
          result,
        );
    return;
  }

  result.push({
    item: child,
    path: [...path, makeZone(null, index, child.key)],
  });
}

function makeZone(origin: ZoneOrigin, position: number, key?: ChildKey) {
  return key != null ? { origin, key } : { origin, position };
}

function selectLocalState<PROPS>(
  localStates: ComponentStateEntry[],
  componentPath: ZonePath,
  props: PROPS,
  defaultStateValues: Record<string, any> | undefined,
) {
  for (const entry of localStates) {
    if (isSamePath(entry.path, componentPath)) {
      return entry.states;
    }
  }

  if (!defaultStateValues) {
    return {};
  }

  const entry: ComponentStateEntry = {
    path: componentPath,
    states: mapValues(
      typeof defaultStateValues === "function"
        ? defaultStateValues(props)
        : defaultStateValues,
      (defaultValue) => new Atom(defaultValue),
    ),
  };

  localStates.push(entry);

  return entry.states;
}
