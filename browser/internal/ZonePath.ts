import { ZBComponentRender, ZBElement } from "../public/types";
import type { ChildKey } from "./ChildKey";
import { ContextComposer } from "./ContextComposer";

export type ZBPathedFinalChildren = ZBPathedFinalChild[];

export enum ZBFinalElementTag {
  element,
  string,
}

export type ZBPathedFinalChild =
  | {
      type: ZBFinalElementTag.element;
      path: ZonePath;
      contexts: ContextComposer;
      desc: ZBElement;
    }
  | {
      type: ZBFinalElementTag.string;
      path: ZonePath;
      desc: string;
    };

export type ZonePath = Zone[];

export type Zone =
  | {
      origin: ZoneOrigin;
      key: ChildKey;
    }
  | {
      origin: ZoneOrigin;
      position: number;
    };

export type ZoneOrigin = ZBComponentRender | null | true;

export function isSamePath(
  pathA: ZonePath | undefined,
  pathB: ZonePath | undefined,
) {
  if (pathA == null && pathB == null) {
    return true;
  }
  if (pathA == null || pathB == null) {
    return false;
  }
  if (pathA.length !== pathB.length) {
    return false;
  }
  for (let i = 0; i < pathA.length; i++) {
    if (!isSameZone(pathA[i], pathB[i])) {
      return false;
    }
  }
  return true;
}

export function isSameZone(zoneA: Zone, zoneB: Zone) {
  return (
    zoneA.origin === zoneB.origin &&
    (("key" in zoneA && "key" in zoneB && zoneA.key === zoneB.key) ||
      ("position" in zoneA &&
        "position" in zoneB &&
        zoneA.position === zoneB.position))
  );
}
