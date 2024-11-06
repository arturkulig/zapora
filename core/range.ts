import { Observable } from "./Observable";
import { SimpleSubscription } from "./SimpleSubscription";
import { then } from "./then";

export function range(min = 0, max = Number.MAX_SAFE_INTEGER) {
  return new Observable<number>((observer) => {
    const sub = new SimpleSubscription();

    let i = min;
    push();

    return sub;

    function push() {
      if (!observer.next) {
        return end();
      }
      if (sub.closed || observer.closed) {
        return;
      }
      void then(observer.next(i++), i <= max ? push : end);
    }

    function end() {
      if (!observer.complete || sub.closed || observer.closed) {
        return;
      }
      void observer.complete();
    }
  });
}
