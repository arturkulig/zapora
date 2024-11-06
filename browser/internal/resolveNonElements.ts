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
  localStates: ComponentStateEntry[],
  contexts: ContextComposer,
  result: ZBPathedFinalChildren,
) {
  if (Array.isArray(children)) {
    for (let index = 0; index < children.length; index++) {
      resolveNonElement(
        children[index],
        index,
        path,
        localStates,
        contexts,
        result,
      );
    }
  } else {
    resolveNonElement(children, 0, path, localStates, contexts, result);
  }
}

function resolveNonElement(
  child: ZBChild,
  index: number,
  parentPath: ZonePath,
  localStates: ComponentStateEntry[],
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
      localStates,
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
      localStates,
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
    const componentState = selectLocalState(
      localStates,
      componentPath,
      child.props,
      child.defaultStateValues,
    );
    const componentUnresolvedChildren = child.component(
      child.props,
      componentState,
      contexts.resolver,
    );

    resolveNonElements(
      componentUnresolvedChildren,
      componentPath,
      localStates,
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
