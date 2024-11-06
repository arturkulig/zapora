import { ChildKey } from "../internal/ChildKey";
import { ContextResolver } from "../internal/ContextResolver";
import { ZB_NS, ZB_TAG_COMPONENT } from "../internal/fragmentSymbols";
import {
  ZBChildren,
  ZBComponentElement,
  ZBComponentRender,
  ZBStateArchetype,
} from "./types";

export function stateful<PROPS, STATE extends ZBStateArchetype>(
  defaultStateValues: (props: PROPS) => STATE,
): (render: ZBComponentRender<PROPS, STATE>) => Component<PROPS>;
export function stateful<STATE extends ZBStateArchetype>(
  defaultStateValues: STATE,
): <PROPS>(render: ZBComponentRender<PROPS, STATE>) => Component<PROPS>;
export function stateful<PROPS, STATE extends ZBStateArchetype>(
  defaultStateValues: ContainerOrGenerator<PROPS, STATE>,
) {
  return function establishComponentRender(
    render: ZBComponentRender<PROPS, STATE>,
  ) {
    return makeComponentFactory<PROPS, STATE>(render, defaultStateValues);
  };
}

export interface ZBStatelessComponentRender<PROPS = any> {
  (props: PROPS, context: ContextResolver): ZBChildren;
}

export function stateless<PROPS>(render: ZBStatelessComponentRender<PROPS>) {
  return makeComponentFactory<PROPS, Record<string, any>>(
    (props, _, contextResolver) => render(props, contextResolver),
  );
}

export type Component<PROPS> = {
  (props: PROPS): ZBComponentElement;
  key: (key: TemplateStringsArray) => (props: PROPS) => ZBComponentElement;
};

function makeComponentFactory<PROPS, STATE extends Record<string, any>>(
  render: ZBComponentRender<PROPS, STATE>,
  defaultStateValues?: ContainerOrGenerator<PROPS, STATE>,
): Component<PROPS> {
  return Object.assign(makeComponentContents, {
    key: makeComponentContentsWithKey,
  });

  function makeComponentContentsWithKey(key: TemplateStringsArray) {
    return function (props: PROPS) {
      return makeKeyedComponentContents<PROPS, STATE>(
        render,
        props,
        defaultStateValues,
        key.join(""),
      );
    };
  }
  function makeComponentContents(props: PROPS): ZBComponentElement {
    return makeKeyedComponentContents<PROPS, STATE>(
      render,
      props,
      defaultStateValues,
    );
  }
}

function makeKeyedComponentContents<PROPS, STATE extends Record<string, any>>(
  render: ZBComponentRender<PROPS, STATE>,
  props: PROPS,
  defaultStateValues?: ContainerOrGenerator<PROPS, STATE>,
  key?: ChildKey,
): ZBComponentElement {
  return {
    namespace: ZB_NS,
    tag: ZB_TAG_COMPONENT,
    key,
    component: render,
    props,
    defaultStateValues,
  };
}

type ContainerOrGenerator<PROPS, STATE> = STATE | ((props: PROPS) => STATE);
