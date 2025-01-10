import { fragment, stateful } from "@zapora/render-dom";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { Main } from "./Main";
import { Tasks } from "./Model";

export const App = stateful((_: void): { taskList$: Tasks } => ({
  taskList$: [],
}))((_, { taskList$ }) => {
  return fragment([
    Header({
      onAdd: (title) =>
        taskList$.next(
          taskList$.value.concat({ completed: false, title: title }),
        ),
    }),
    Main({
      tasks$: taskList$,
    }),
    Footer({
      tasks$: taskList$,
      removeCompleted() {
        taskList$.update((tasks) => tasks.filter((task) => !task.completed));
      },
    }),
  ]);
});
