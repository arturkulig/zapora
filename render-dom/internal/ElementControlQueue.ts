import { ZBElementDesc } from "../public";
import { ContextComposer } from "./ContextComposer";
import { ElementController } from "./ElementController";

enum UpdateType {
  change,
  removal,
}
type Update =
  | {
      type: UpdateType.change;
      description: ZBElementDesc;
      contexts: ContextComposer;
    }
  | {
      type: UpdateType.removal;
    };
type Entry = {
  controller: ElementController;
  instruction: Update;
};

export class ElementControlQueue {
  private schedule: Entry[] = [];

  private applying = false;

  scheduleUpdate(
    controller: ElementController,
    description: ZBElementDesc,
    contexts: ContextComposer,
  ) {
    this.push(controller, { type: UpdateType.change, description, contexts });
    this.apply();
  }

  scheduleUnmount(controller: ElementController) {
    this.push(controller, { type: UpdateType.removal });
    this.apply();
  }

  private apply() {
    if (!this.applying) {
      this.applying = true;

      const updated = new Set<ElementController>();
      const removed = new Set<ElementController>();

      while (this.schedule.length > 0) {
        const next = this.schedule.pop()!;
        switch (next.instruction.type) {
          case UpdateType.change: {
            next.controller.apply(
              next.instruction.description,
              next.instruction.contexts,
            );
            updated.add(next.controller);
            break;
          }
          case UpdateType.removal: {
            removed.add(next.controller);
            break;
          }
        }
      }

      this.applying = false;

      for (const controller of updated) {
        controller.mounted();
      }
      for (const controller of removed) {
        controller.unmounted();
      }
    }
  }

  private push(controller: ElementController, instruction: Update) {
    for (const entry of this.schedule) {
      if (entry.controller === controller) {
        entry.instruction = instruction;
        return;
      }
    }
    this.schedule.push({
      controller,
      instruction,
    });
  }
}
