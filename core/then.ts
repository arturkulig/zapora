import { ReceivedReceit } from "./Observer";

export function then(
  receit: ReceivedReceit,
  reaction: () => void,
): ReceivedReceit {
  if (receit) {
    return receit.then(reaction);
  } else {
    reaction();
  }
}
