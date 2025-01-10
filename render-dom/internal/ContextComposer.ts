import { ContextResolver } from "./ContextResolver";

export class ContextComposer {
  resolver: ContextResolver;

  constructor(protected repository: { [id: symbol]: any } = {}) {
    this.resolver = new ContextResolver(repository);
  }

  fork(id: symbol, instance: any) {
    return new ContextComposer({
      ...this.repository,
      [id]: instance,
    });
  }
}
