import { RefType, ZBElementDesc } from "../public";
import { AnimationComponentController } from "./AnimationComponentController";
import { ChildrenComponentController } from "./ChildrenComponentController";
import { ClassNameComponentController } from "./ClassNameComponentController";
import { ContextComposer } from "./ContextComposer";
import { ElementControlQueue } from "./ElementControlQueue";
import { AnyElement } from "./ElementNamespaces";
import { EventComponentController } from "./EventComponentController";
import { PropsComponentController } from "./PropsComponentController";
import { StyleComponentController } from "./StyleComponentController";

interface ElementComponentsControllers {
  className?: ClassNameComponentController;
  props: Record<string, PropsComponentController>;
  style: Record<string, StyleComponentController>;
  animate?: AnimationComponentController;
  on: Record<string, EventComponentController>;
  children?: ChildrenComponentController;
}

export class ElementController {
  presentComponents: ElementComponentsControllers = {
    props: {},
    style: {},
    on: {},
  };

  ref: RefType | undefined = undefined;

  constructor(
    private queue: ElementControlQueue,
    private element: AnyElement,
  ) {}

  designate(description: ZBElementDesc, contexts: ContextComposer) {
    this.queue.scheduleUpdate(this, description, contexts);
  }

  apply(description: ZBElementDesc, contexts: ContextComposer) {
    const futureComponents: ElementComponentsControllers = {
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
    description: ZBElementDesc,
    futureComponents: ElementComponentsControllers,
  ) {
    if (
      description.className != null ||
      this.presentComponents.className != null
    ) {
      (futureComponents.className =
        this.presentComponents.className ||
        new ClassNameComponentController(this.element)).applySource(
        description.className,
      );
    }
  }

  private applyProperties(
    description: ZBElementDesc,
    futureComponents: ElementComponentsControllers,
  ) {
    const presentNames = Object.keys(this.presentComponents.props);
    const futureNames = description.props ? Object.keys(description.props) : [];
    const propNames = new Set([...presentNames, ...futureNames]);
    for (const propName of propNames) {
      (futureComponents.props[propName] =
        this.presentComponents.props[propName] ||
        new PropsComponentController<string, any>(
          this.element,
          propName,
        )).applySource(description.props?.[propName]);
    }
  }

  private applyStyle(
    description: ZBElementDesc,
    futureComponents: ElementComponentsControllers,
  ) {
    const presentNames = keysOf(this.presentComponents.style);
    const futureNames = description.style ? keysOf(description.style) : [];
    const propNames = new Set([...presentNames, ...futureNames]);
    for (const propName of propNames) {
      (futureComponents.style[propName] =
        this.presentComponents.style[propName] ||
        new StyleComponentController(this.element, propName)).applySource(
        description.style?.[propName],
      );
    }
  }

  private applyEventHandlers(
    description: ZBElementDesc,
    futureComponents: ElementComponentsControllers,
  ) {
    const presentNames = keysOf(this.presentComponents.on);
    const futureNames = description.on ? keysOf(description.on) : [];
    const propNames = new Set([...presentNames, ...futureNames]);
    for (const propName of propNames) {
      (futureComponents.on[propName] =
        this.presentComponents.on[propName] ||
        new EventComponentController(this.element, propName)).applyUnit(
        description.on?.[propName],
      );
    }
  }

  private applyChildren(
    description: ZBElementDesc,
    futureComponents: ElementComponentsControllers,
    contexts: ContextComposer,
  ) {
    if (
      description.children != null ||
      this.presentComponents.children != null
    ) {
      (futureComponents.children =
        this.presentComponents.children ||
        new ChildrenComponentController(
          this.queue,
          this.element,
          contexts,
        )).applySource(description.children);
    }
  }

  private wasMounted = false;
  mounted() {
    if (this.wasMounted) {
      return;
    }
    this.wasMounted = true;
    if (this.ref) {
      this.ref(this.element);
    }
  }

  unmounted() {
    if (this.wasMounted && this.ref) {
      this.ref(null);
    }
    this.wasMounted = true;

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

function keysOf<T extends Record<any, any>>(subject: T) {
  return (Object.keys(subject) as Array<Extract<keyof T, string>>) ?? [];
}
