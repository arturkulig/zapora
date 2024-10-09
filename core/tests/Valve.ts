export class Valve {
  #pressure = new Array<() => void>();
  #loose = false;

  getNewPromise() {
    return new Promise<void>((resolve) => {
      if (this.#loose) {
        return resolve();
      }
      this.#pressure.push(resolve);
    });
  }

  releaseFirst() {
    this.#pressure.shift()?.();
  }

  releasePending() {
    this.#pressure.splice(0).forEach((release) => release());
  }

  releaseForever() {
    this.#loose = true;
    this.releasePending();
  }
}
