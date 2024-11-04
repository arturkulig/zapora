import { ChildKey } from "./internal/children/ChildKey";
import { ZB_NS, ZB_TAG_COMPONENT } from "./internal/children/fragmentSymbols";
import {
  ZBComponentElement,
  ZBComponentRender,
  ZBStateArchetype,
} from "./publicTypes";

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

export function stateless<PROPS>(
  render: ZBComponentRender<PROPS, Record<string, any>>,
) {
  return makeComponentFactory<PROPS, Record<string, any>>(render);
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
