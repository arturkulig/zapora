import { render } from "@zapora/browser";

import "todomvc-app-css/index.css";
import "todomvc-common/base.css";
import { App } from "./App";
import "./style";

render(App(), document.querySelector("#root")!);
