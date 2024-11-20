export interface State {
  tasks: Tasks;
}

export type Tasks = Task[];

export interface Task {
  completed: boolean;
  title: string;
}
