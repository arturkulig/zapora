import { html, stateless } from "@zapora/browser";
import { Atom, map } from "@zapora/core";
import { Tasks } from "./Model";
import { hash$ } from "./locations";

export const Footer = stateless(
  (props: { tasks$: Atom<Tasks>; removeCompleted: () => void }) => {
    return html.footer(
      {
        className: "footer",
      },
      [
        html.span(
          { className: "todo-count" },
          props.tasks$.pipe((_) =>
            map(_, (tasks) => [
              `${tasks.length} ${tasks.length === 1 ? "item" : "items"} left!`,
            ]),
          ),
        ),
        html.ul({ className: "filters" }, [
          html.li({}, [
            html.a(
              {
                className: hash$.pipe((_) =>
                  map(_, (hash) =>
                    hash === "#/" || hash === "" ? "selected" : "",
                  ),
                ),
                props: { href: "#/" },
              },
              "All",
            ),
            html.a(
              {
                className: hash$.pipe((_) =>
                  map(_, (hash) => (hash === "#/active" ? "selected" : "")),
                ),
                props: { href: "#/active" },
              },
              "Active",
            ),
            html.a(
              {
                className: hash$.pipe((_) =>
                  map(_, (hash) => (hash === "#/completed" ? "selected" : "")),
                ),
                props: { href: "#/completed" },
              },
              "Completed",
            ),
          ]),
        ]),
        html.button(
          {
            className: "clear-completed",
            props: {
              disabled: props.tasks$.pipe((_) =>
                map(
                  _,
                  (tasks) =>
                    tasks.filter((task) => !task.completed).length ===
                    tasks.length,
                ),
              ),
            },
            on: {
              click: props.removeCompleted,
            },
          },
          "Clear completed",
        ),
      ],
    );
  },
);
