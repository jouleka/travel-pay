import { ChangeDetectorRef } from '@angular/core';
import { tap } from 'rxjs';

/** Schedule an OnPush render for async next/error state changes in subscribers. */
export function refreshView<T>(view: ChangeDetectorRef) {
  return tap<T>({
    next: () => view.markForCheck(),
    error: () => view.markForCheck(),
  });
}
