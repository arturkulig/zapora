import { html, stateful } from "@zapora/browser";
import { map } from "@zapora/core";
import { Input } from "./Input";
import { Task } from "./Model";

export const Item = stateful(
  (_props: {
    task: Task;
    onToggle: (task: Task) => void;
    onRemove: (task: Task) => void;
    onUpdate: (task: Task, title: string) => void;
  }) => ({
    writeable$: false,
  }),
)((props, { writeable$ }) => {
  return html.li(
    {
      className: props.task.completed ? "completed" : "",
    },
    [
      html.div(
        {
          className: "view",
        },
        writeable$.pipe((_) =>
          map(_, (isWriteable) =>
            isWriteable
              ? [
                  Input({
                    label: "Edit Todo Input",
                    defaultValue: props.task.title,
                    onSubmit: (title) => {
                      if (title.length === 0) {
                        props.onRemove(props.task);
                      } else {
                        props.onUpdate(props.task, title);
                      }

                      writeable$.next(false);
                    },
                    onBlur() {
                      writeable$.next(false);
                    },
                  }),
                ]
              : [
                  html.input({
                    className: "toggle",
                    props: { type: "checkbox", checked: props.task.completed },
                    on: {
                      change() {
                        props.onToggle(props.task);
                      },
                    },
                  }),
                  html.label(
                    {
                      on: {
                        click: () => {
                          writeable$.next(true);
                        },
                      },
                    },
                    [props.task.title],
                  ),
                  html.button({
                    className: "destroy",
                    on: {
                      click() {
                        props.onRemove(props.task);
                      },
                    },
                  }),
                ],
          ),
        ),
      ),
    ],
  );
});
