export interface Lifecycle {
  pushRefMounted: () => void;
  uninstallApplicators: () => void;
  pushUnmounted: () => void;
}
