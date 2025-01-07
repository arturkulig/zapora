import { html, stateless } from "@zapora/browser";

export const Input = stateless(
  (props: {
    placeholder?: string;
    defaultValue?: string;
    label: string;

    onSubmit: (result: string) => void;
    onBlur?: () => void;
  }) => {
    return html.div(
      {
        className: "input-container",
      },
      [
        html.input({
          className: "new-todo",
          props: {
            id: "todo-input",
            type: "text",
            autofocus: true,
            placeholder: props.placeholder,
            defaultValue: props.defaultValue,
          },
          on: {
            blur: () => {
              props.onBlur?.();
            },
            keydown: (e) => {
              if (e.target instanceof HTMLInputElement && e.key === "Enter") {
                const value = e.target.value.trim();

                if (!hasValidMin(value, 2)) return;

                props.onSubmit(sanitize(value));
                e.target.value = "";
              }
            },
          },
        }),
        html.label(
          {
            className: "visually-hidden",
            props: {
              htmlFor: "todo-input",
            },
          },
          [props.label],
        ),
      ],
    );
  },
);

function sanitize(text: string) {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };
  const reg = /[&<>"'/]/gi;
  return text.replace(reg, (match) => map[match]);
}

function hasValidMin(text: string, min: number) {
  return text.length >= min;
}
