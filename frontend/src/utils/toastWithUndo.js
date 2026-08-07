import { toast } from 'sonner';

export function successToastWithUndo(message, undo, options = {}) {
  toast.success(message, {
    ...options,
    action: {
      label: 'Undo',
      onClick: undo,
    },
  });
}
