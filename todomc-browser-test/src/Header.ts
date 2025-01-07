import { html, stateless } from "@zapora/browser";
import { Input } from "./Input";

export const Header = stateless((props: { onAdd: (title: string) => void }) => {
  return html.header(
    {
      className: "header",
    },
    [
      html.h1({}, "todos"),
      Input({
        onSubmit: (result) => props.onAdd(result),
        label: "New Todo Input",
        placeholder: "What needs to be done?",
      }),
    ],
  );
});
