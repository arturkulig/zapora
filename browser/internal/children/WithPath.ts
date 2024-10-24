import { ZBElement } from "../../ZBElement";
import { ChildKey } from "./ChildKey";

export type ZBPathedFinalChildren = ZBPathedFinalChild[];

export interface ZBPathedFinalChild {
  path: ZonePath;
  item: FinalChild;
}

export type FinalChild = ZBElement | string;

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

export type ZoneOrigin = null | true;
