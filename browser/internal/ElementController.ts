import { Observer } from "@zapora/core";
import { Properties as CSSProperties } from "csstype";
import {
  AnyEventMap,
  ZBChildren,
  ZBElementAllArguments,
  ZBElementPropNames,
} from "../public";
import { ChildrenComponentController } from "./ChildrenComponentController";
import { ClassNameComponentController } from "./ClassNameComponentController";
import { ComponentController } from "./ComponentController";
import { ContextComposer } from "./ContextComposer";
import { AnyElement } from "./ElementNamespaces";
import { EventComponentController } from "./EventComponentController";
import { ImmutableProperties } from "./ImmutableProperties";
import { PropsController } from "./PropsController";
import { StyleComponentController } from "./StyleComponentController";

type CSSPropertiesNames = keyof CSSProperties;

interface ElementComponentsControllers<ELEMENT> {
  className?: ComponentController<ELEMENT, any>;
  props: Partial<
    Record<ZBElementPropNames<ELEMENT>, ComponentController<ELEMENT, any>>
  >;
  style: Partial<Record<CSSPropertiesNames, ComponentController<ELEMENT, any>>>;
  animate?: ComponentController<ELEMENT, any>;
  on: Record<string, ComponentController<ELEMENT, any>>;
  children?: ComponentController<ELEMENT, ZBChildren>;
}

type EventNames<
  ELEMENT extends AnyElement,
  EVENTMAP extends AnyEventMap,
> = keyof ZBElementAllArguments<ELEMENT, EVENTMAP>["on"];

export class ElementController<
  ELEMENT extends AnyElement,
  EVENTMAP extends AnyEventMap,
> {
  presentComponents: ElementComponentsControllers<ELEMENT> = {
    props: {},
    style: {},
    on: {},
  };

  ref: Observer<ELEMENT> | undefined = undefined;

  constructor(private element: ELEMENT) {}

  applyDescription(
    description: ZBElementAllArguments<ELEMENT, EVENTMAP>,
    contexts: ContextComposer,
  ) {
    const futureComponents: ElementComponentsControllers<ELEMENT> = {
      props: {},
      style: {},
      on: {},
    };

    this.ref = description.ref;

    this.applyClassName(description, futureComponents);
    this.applyProperties(description, futureComponents);
    this.applyStyle(description, futureComponents);
    this.applyEventHandlers(description, futureComponents);
    this.applyChildren(description, futureComponents, contexts);

    this.presentComponents = futureComponents;
  }

  private applyClassName(
    description: ZBElementAllArguments<ELEMENT, EVENTMAP>,
    futureComponents: ElementComponentsControllers<ELEMENT>,
  ) {
    if (
      description.className != null ||
      this.presentComponents.className != null
    ) {
      (
        futureComponents.className ||
        (futureComponents.className = new ClassNameComponentController<ELEMENT>(
          this.element,
        ))
      ).applySource(description.className);
    }
  }

  private applyProperties(
    description: ZBElementAllArguments<ELEMENT, EVENTMAP>,
    futureComponents: ElementComponentsControllers<ELEMENT>,
  ) {
    const presentNames = Object.keys(
      this.presentComponents.props,
    ) as ZBElementPropNames<ELEMENT>[];
    const futureNames = description.props
      ? (Object.keys(description.props) as ZBElementPropNames<ELEMENT>[])
      : [];
    const propNames = new Set<ZBElementPropNames<ELEMENT>>([
      ...presentNames,
      ...futureNames,
    ]);
    for (const propName of propNames) {
      (
        futureComponents.props[propName] ||
        (futureComponents.props[propName] = new PropsController<
          ELEMENT,
          Exclude<keyof ELEMENT, ImmutableProperties>
        >(
          this.element,
          propName as Exclude<keyof ELEMENT, ImmutableProperties>,
        ))
      ).applySource(description.props?.[propName]);
    }
  }

  private applyStyle(
    description: ZBElementAllArguments<ELEMENT, EVENTMAP>,
    futureComponents: ElementComponentsControllers<ELEMENT>,
  ) {
    const presentNames = Object.keys(
      this.presentComponents.style,
    ) as CSSPropertiesNames[];
    const futureNames = description.style
      ? (Object.keys(description.style) as CSSPropertiesNames[])
      : [];
    const propNames = new Set<CSSPropertiesNames>([
      ...presentNames,
      ...futureNames,
    ]);
    for (const propName of propNames) {
      (
        futureComponents.style[propName] ||
        (futureComponents.style[propName] = new StyleComponentController<
          ELEMENT,
          CSSPropertiesNames
        >(this.element, propName))
      ).applySource(description.style?.[propName]);
    }
  }

  private applyEventHandlers(
    description: ZBElementAllArguments<ELEMENT, EVENTMAP>,
    futureComponents: ElementComponentsControllers<ELEMENT>,
  ) {
    const presentNames = Object.keys(this.presentComponents.on) as EventNames<
      ELEMENT,
      EVENTMAP
    >[];
    const futureNames = description.on
      ? (Object.keys(description.on) as EventNames<ELEMENT, EVENTMAP>[])
      : [];
    const propNames = new Set<EventNames<ELEMENT, EVENTMAP>>([
      ...presentNames,
      ...futureNames,
    ]);
    for (const propName of propNames) {
      (
        futureComponents.on[propName] ||
        (futureComponents.on[propName] = new EventComponentController<ELEMENT>(
          this.element,
          propName,
        ))
      ).applySource(description.on?.[propName]);
    }
  }

  private applyChildren(
    description: ZBElementAllArguments<ELEMENT, EVENTMAP>,
    futureComponents: ElementComponentsControllers<ELEMENT>,
    contexts: ContextComposer,
  ) {
    if (
      description.children != null ||
      this.presentComponents.children != null
    ) {
      (
        futureComponents.children ||
        (futureComponents.children = new ChildrenComponentController<ELEMENT>(
          this.element,
          contexts,
        ))
      ).applySource(description.children);
    }
  }

  mounted() {
    if (this.ref && !this.ref.closed) {
      this.ref.next?.(this.element);
    }
  }

  unmounted() {
    if (this.ref && !this.ref.closed) {
      this.ref.complete?.();
    }

    this.presentComponents.className?.destroy();
    this.presentComponents.animate?.destroy();
    for (const propName in this.presentComponents.props) {
      this.presentComponents.props[
        propName as ZBElementPropNames<ELEMENT>
      ]?.destroy();
    }
    for (const propName in this.presentComponents.style) {
      this.presentComponents.style[propName as CSSPropertiesNames]?.destroy();
    }
    for (const eventName in this.presentComponents.on) {
      this.presentComponents.on[
        eventName as EventNames<ELEMENT, EVENTMAP>
      ]?.destroy();
    }
  }
}
