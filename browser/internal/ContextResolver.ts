import { Context } from "../public/Context";

export type ContextRepository = { [id: symbol]: any };

export class ContextResolver {
  #repository: ContextRepository;

  constructor(repository: ContextRepository) {
    this.#repository = repository;
  }

  get<T>(context: Context<T>): T {
    const found = this.#retrieve(context.id);
    if (found == null) {
      throw new Error(
        `Requested context unavailable. ${Object.getOwnPropertySymbols(this.#repository).length} other contexts available.`,
      );
    }
    return found.ok;
  }

  tryGet<T>(context: Context<T>): T | undefined {
    return this.#retrieve(context.id)?.ok;
  }

  #retrieve(id: symbol) {
    for (const repositoryId of Object.getOwnPropertySymbols(this.#repository)) {
      if (id === repositoryId) {
        return { ok: this.#repository[id] };
      }
    }
    return undefined;
  }
}
