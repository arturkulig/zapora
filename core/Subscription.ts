export interface Subscription {
  cancel: Cancellation;
  closed: boolean;
}

type Cancellation = () => void;
