import { Atom } from "@zapora/core";

export const hash$ = new Atom(window.location.hash);

hash$.subscribe({
  next: (value) => {
    if (window.location.hash !== value) {
      const url = new URL("/");
      url.hash = value;
      window.history.pushState(null, "", url);
    }
  },
});

window.addEventListener("popstate", () => {
  hash$.next(window.location.hash);
});
