import { toast } from "react-toastify";

export function successToast(message: string) {
  toast.success(message, {});
}

export function errorToast(message: string) {
  toast.error(message, {});
}
