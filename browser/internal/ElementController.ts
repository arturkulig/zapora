import { Observer } from "@zapora/core";
import { Properties as CSSProperties } from "csstype";
import {
  AnyEventMap,
  ZBElementAllArguments,
  ZBElementPropNames,
} from "../public";
import { ChildrenComponentController } from "./ChildrenComponentController";
import { ClassNameComponentController } from "./ClassNameComponentController";
import { StreamedComponentController } from "./ComponentController";
import { ContextComposer } from "./ContextComposer";
import { AnyElement } from "./ElementNamespaces";
import { EventComponentController } from "./EventComponentController";
import { ImmutableProperties } from "./ImmutableProperties";
import { PropsComponentController } from "./PropsComponentController";
import { StyleComponentController } from "./StyleComponentController";

type CSSPropertiesNames = keyof CSSProperties;

interface ElementComponentsControllers<ELEMENT extends AnyElement> {
  className?: ClassNameComponentController<ELEMENT>;
  props: Partial<
    Record<ZBElementPropNames<ELEMENT>, PropsComponentController<ELEMENT, any>>
  >;
  style: Partial<
    Record<CSSPropertiesNames, StyleComponentController<ELEMENT, any>>
  >;
  animate?: StreamedComponentController<ELEMENT, any>;
  on: Record<string, EventComponentController<ELEMENT>>;
  children?: ChildrenComponentController<ELEMENT>;
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
      (futureComponents.className =
        this.presentComponents.className ||
        new ClassNameComponentController<ELEMENT>(this.element)).applySource(
        description.className,
      );
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
      (futureComponents.props[propName] =
        this.presentComponents.props[propName] ||
        new PropsComponentController<
          ELEMENT,
          Exclude<keyof ELEMENT, ImmutableProperties>
        >(
          this.element,
          propName as Exclude<keyof ELEMENT, ImmutableProperties>,
        )).applySource(description.props?.[propName]);
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
      (futureComponents.style[propName] =
        this.presentComponents.style[propName] ||
        new StyleComponentController<ELEMENT, CSSPropertiesNames>(
          this.element,
          propName,
        )).applySource(description.style?.[propName]);
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
      (futureComponents.on[propName] =
        this.presentComponents.on[propName] ||
        new EventComponentController<ELEMENT>(
          this.element,
          propName,
        )).applyUnit(description.on?.[propName]);
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
      (futureComponents.children =
        this.presentComponents.children ||
        new ChildrenComponentController<ELEMENT>(
          this.element,
          contexts,
        )).applySource(description.children);
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
    for (const component of Object.values(this.presentComponents.props)) {
      component.destroy();
    }
    for (const component of Object.values(this.presentComponents.style)) {
      component.destroy();
    }
    for (const component of Object.values(this.presentComponents.on)) {
      component.destroy();
    }
    this.presentComponents.children?.destroy();
  }
}
