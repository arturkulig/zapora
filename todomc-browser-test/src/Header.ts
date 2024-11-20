import { html, stateless } from "@zapora/browser";
import { Input } from "./Input";

export const Header = stateless((props: { onAdd: (title: string) => void }) => {
  return html.header({
    className: "header",
    children: [
      html.h1({ children: "todos" }),
      Input({
        onSubmit: (result) => props.onAdd(result),
        label: "New Todo Input",
        placeholder: "What needs to be done?",
      }),
    ],
  });
});
