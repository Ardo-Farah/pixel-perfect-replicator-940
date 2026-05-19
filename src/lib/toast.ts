import { toast as sonnerToast } from "sonner";

// Toast rules:
// - bottom-right (set on <Toaster /> in __root.tsx)
// - success/info auto-dismiss after 4s
// - errors stay until dismissed (duration: Infinity) and show a close button

export const toast = {
  success(message: string, description?: string) {
    return sonnerToast.success(message, {
      description,
      duration: 4000,
    });
  },
  info(message: string, description?: string) {
    return sonnerToast(message, {
      description,
      duration: 4000,
    });
  },
  error(message: string, description?: string) {
    return sonnerToast.error(message, {
      description,
      duration: Infinity,
      closeButton: true,
    });
  },
};
