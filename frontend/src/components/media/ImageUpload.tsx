'use client';

import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ImageIcon,
  XIcon,
  Loader2Icon,
  SparklesIcon,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface ImageUploadProps {
  noteId?: string;
  onUpload: (url: string, attachmentId: string) => void;
  onOCR?: (text: string) => void;
}

export function ImageUpload({ noteId, onUpload, onOCR }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);

    // 预览
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (noteId) formData.append('note_id', noteId);

      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE_URL}/upload/image`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await res.json();
      if (data.h?.c === 0) {
        const { url, id } = data.c;
        setUploadedUrl(url);
        onUpload(url, id);
      } else {
        setError(data.h?.e || '上传失败');
      }
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleOCR = async () => {
    if (!uploadedUrl || !onOCR) return;
    setOcrLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE_URL}/ai/ocr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ image_url: uploadedUrl }),
      });

      const data = await res.json();
      if (data.h?.c === 0) {
        onOCR(data.c.text);
      } else {
        setError('OCR识别失败: ' + (data.h?.e || ''));
      }
    } catch {
      setError('OCR识别失败');
    } finally {
      setOcrLoading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      handleUpload(file);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  const handleClear = () => {
    setPreview(null);
    setUploadedUrl(null);
    setError(null);
  };

  return (
    <div className="space-y-4">
      {!preview ? (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          )}
        >
          <input {...getInputProps()} ref={fileInputRef} />
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">
              {isDragActive ? '放开以上传' : '拖拽图片到此处'}
            </p>
            <p className="text-xs text-muted-foreground">
              或点击选择文件（最大 10MB）
            </p>
          </div>
        </div>
      ) : (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="max-w-full max-h-64 rounded-lg mx-auto"
          />
          
          {/* 上传中遮罩 */}
          {uploading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
              <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* 操作按钮 */}
          {!uploading && (
            <div className="absolute top-2 right-2 flex gap-1">
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8"
                onClick={handleClear}
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* OCR 按钮 */}
      {uploadedUrl && onOCR && (
        <Button
          variant="outline"
          onClick={handleOCR}
          disabled={ocrLoading}
          className="w-full"
        >
          {ocrLoading ? (
            <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <SparklesIcon className="h-4 w-4 mr-2" />
          )}
          识别图片文字 (OCR)
        </Button>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 rounded-md p-3">
          {error}
        </div>
      )}
    </div>
  );
}
