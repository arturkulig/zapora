export type Observer<T> = Partial<CompleteObserver<T>>;

export interface CompleteObserver<T> {
  closed: boolean;
  next: ValueHandler<T>;
  complete: FinalHandler;
}

type ValueHandler<T> = (value: T) => ReceivedReceit;
type FinalHandler = () => ReceivedReceit;

export type ReceivedReceit = void | Promise<void>;
