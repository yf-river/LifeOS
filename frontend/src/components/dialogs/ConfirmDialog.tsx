'use client';

import { useUIStore } from '@/store';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function ConfirmDialog() {
  const { confirmDialog, hideConfirmDialog } = useUIStore();
  const { open, title, message, onConfirm, onCancel } = confirmDialog;

  const handleConfirm = () => {
    onConfirm?.();
    hideConfirmDialog();
  };

  const handleCancel = () => {
    onCancel?.();
    hideConfirmDialog();
  };

  return (
    <AlertDialog open={open} onOpenChange={hideConfirmDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>取消</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>确定</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
