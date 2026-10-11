import { ComponentRegistry, WorkspaceStore } from 'mailspring-exports';

import AirmailSortButton from './airmail-sort-button';
import SortStore from './sort-store';
import { installThreadListSortHook, reloadThreadList } from './thread-list-sort-hook';

export function activate() {
  installThreadListSortHook();
  SortStore.activate();

  ComponentRegistry.register(AirmailSortButton, {
    location: WorkspaceStore.Location.ThreadList.Toolbar,
  });

  reloadThreadList();
}

export function serialize() {}

export function deactivate() {
  ComponentRegistry.unregister(AirmailSortButton);
  SortStore.deactivate();
}
