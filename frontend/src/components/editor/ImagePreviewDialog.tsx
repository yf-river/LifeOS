'use client';

import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

interface ImagePreviewDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  imageUrl: string | null;
}

export function ImagePreviewDialog({
  isOpen,
  onOpenChange,
  imageUrl,
}: ImagePreviewDialogProps) {
  console.log('ImagePreviewDialog render:', { isOpen, imageUrl: imageUrl?.substring(0, 50) });
  
  if (!imageUrl) {
    console.log('ImagePreviewDialog: no imageUrl, returning null');
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] p-0 bg-transparent border-0">
        <img
          src={imageUrl}
          alt="Image Preview"
          className="w-full h-full object-contain"
        />
      </DialogContent>
    </Dialog>
  );
}
