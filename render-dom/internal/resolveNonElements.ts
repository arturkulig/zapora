import { Atom } from "@zapora/core";
import { ZBChild, ZBChildren } from "../public/types";
import { ChildKey } from "./ChildKey";
import { ContextComposer } from "./ContextComposer";
import {
  ZB_NS,
  ZB_TAG_COMPONENT,
  ZB_TAG_CONTEXT,
  ZB_TAG_FRAGMENT,
} from "./fragmentSymbols";
import { mapValues } from "./mapValues";
import {
  isSamePath,
  ZBFinalElementTag,
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
  presentStates: ComponentStateEntry[],
  usedStates: ComponentStateEntry[],
  contexts: ContextComposer,
  result: ZBPathedFinalChildren,
) {
  if (Array.isArray(children)) {
    for (let index = 0; index < children.length; index++) {
      resolveNonElement(
        children[index],
        index,
        path,
        presentStates,
        usedStates,
        contexts,
        result,
      );
    }
  } else {
    resolveNonElement(
      children,
      0,
      path,
      presentStates,
      usedStates,
      contexts,
      result,
    );
  }
}

function resolveNonElement(
  child: ZBChild,
  index: number,
  parentPath: ZonePath,
  presentStates: ComponentStateEntry[],
  usedStates: ComponentStateEntry[],
  contexts: ContextComposer,
  result: ZBPathedFinalChildren,
) {
  if (typeof child === "string") {
    result.push({
      type: ZBFinalElementTag.string,
      path: [{ origin: null, position: index }],
      desc: child,
    });
    return;
  }
  if (child.namespace === ZB_NS && child.tag === ZB_TAG_CONTEXT) {
    resolveNonElements(
      child.children,
      parentPath,
      presentStates,
      usedStates,
      contexts.fork(child.id, child.instance),
      result,
    );
    return;
  }

  if (child.namespace === ZB_NS && child.tag === ZB_TAG_FRAGMENT) {
    const fragmentZonePath = [...parentPath, makeZone(true, index, child.key)];
    resolveNonElements(
      child.children,
      fragmentZonePath,
      presentStates,
      usedStates,
      contexts,
      result,
    );
    return;
  }

  if (child.namespace === ZB_NS && child.tag === ZB_TAG_COMPONENT) {
    const componentPath = [
      ...parentPath,
      makeZone(child.component, index, child.key),
    ];
    const componentStateEntry = selectLocalState(
      presentStates,
      componentPath,
      child.props,
      child.defaultStateValues,
    );
    if (componentStateEntry) {
      usedStates.push(componentStateEntry);
    }

    const componentUnresolvedChildren = child.component(
      child.props,
      componentStateEntry?.states ?? {},
      contexts.resolver,
    );

    resolveNonElements(
      componentUnresolvedChildren,
      componentPath,
      presentStates,
      usedStates,
      contexts,
      result,
    );
    return;
  }

  result.push({
    type: ZBFinalElementTag.element,
    desc: child,
    path: [...parentPath, makeZone(null, index, child.key)],
    contexts,
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
): ComponentStateEntry | null {
  for (const entry of localStates) {
    if (isSamePath(entry.path, componentPath)) {
      return entry;
    }
  }

  if (!defaultStateValues) {
    return null;
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

  return entry;
}
