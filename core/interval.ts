import { then } from "./internal/then";
import { Observable } from "./Observable";
import { TidySubscription } from "./TidySubscription";

export function interval(periodMs: number) {
  return new Observable<number>((observer) => {
    const { next } = observer;
    let i = -1;
    let ready = true;

    const token = next
      ? setInterval(() => {
          i++;
          if (!ready) {
            return;
          }
          if (observer.closed) {
            return;
          }
          ready = false;
          void then(next.call(observer, i), () => {
            ready = true;
          });
        }, periodMs)
      : undefined;

    return new TidySubscription(() => {
      clearInterval(token);
    });
  });
}
