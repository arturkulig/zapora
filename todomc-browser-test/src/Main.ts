import { html, stateless } from "@zapora/browser";
import { Atom, combineLatest, map } from "@zapora/core";
import { Item } from "./Item";
import { Tasks } from "./Model";
import { hash$ } from "./locations";

type Modes = "all" | "active" | "completed";

export const Main = stateless((props: { tasks$: Atom<Tasks> }) => {
  const visibleTasks$ = combineLatest<[Modes, Record<Modes, Tasks>]>([
    hash$.pipe((_) =>
      map(_, (hash) => {
        switch (hash) {
          case "#/":
            return "all" as const;
          case "#/active":
            return "active" as const;
          case "#/completed":
            return "completed" as const;
          default:
            return "all" as const;
        }
      }),
    ),
    props.tasks$.pipe((_) =>
      map(_, (tasks) => ({
        all: tasks,
        active: tasks.filter((task) => !task.completed),
        completed: tasks.filter((task) => task.completed),
      })),
    ),
  ]).pipe((_) => map(_, ([mode, selections]) => selections[mode]));

  return html.main(
    {
      className: "main",
    },
    [
      html.div.key`toggle`(
        {
          className: "toggle-all-container",
        },
        [
          html.input({
            className: "toggle-all",
            props: {
              type: "checkbox",
              id: "toggle-all",
              checked: visibleTasks$.pipe((_) =>
                map(_, (visibleTasks) =>
                  visibleTasks.every((todo) => todo.completed),
                ),
              ),
            },
            on: {
              change() {
                props.tasks$.update((tasks) =>
                  tasks.map((task) => ({
                    ...task,
                    completed: !tasks.some((task) => task.completed),
                  })),
                );
              },
            },
          }),
          html.label(
            {
              className: "toggle-all-label",
            },
            ["Toggle All Input"],
          ),
        ],
      ),
      html.ul(
        {
          className: "todo-list",
        },
        visibleTasks$.pipe((_) =>
          map(_, (visibleTasks) =>
            visibleTasks.map((task) =>
              Item({
                task,
                onRemove(tasksToRemove) {
                  props.tasks$.update((tasks) =>
                    tasks.filter((task) => task !== tasksToRemove),
                  );
                },
                onToggle(taskToToggle) {
                  props.tasks$.update((tasks) =>
                    tasks.map((task) =>
                      task === taskToToggle
                        ? { ...task, completed: !task.completed }
                        : task,
                    ),
                  );
                },
                onUpdate(taskToRename, title) {
                  props.tasks$.update((tasks) =>
                    tasks.map((task) =>
                      task === taskToRename ? { ...task, title } : task,
                    ),
                  );
                },
              }),
            ),
          ),
        ),
      ),
    ],
  );
});
