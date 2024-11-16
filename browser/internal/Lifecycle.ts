export interface Lifecycle {
  pushRefMounted: () => void;
  uninstallApplicators: () => void;
  pushRefUnmounted: () => void;
}
