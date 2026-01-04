'use client';

import { useNotesStore } from '@/store';
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
import { AlertTriangleIcon, ClipboardIcon, ServerIcon } from 'lucide-react';

export function ConflictDialog() {
  const { conflictData, resolveConflict, clearConflict } = useNotesStore();

  if (!conflictData) return null;

  return (
    <AlertDialog open={!!conflictData} onOpenChange={() => clearConflict()}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <AlertTriangleIcon className="h-5 w-5 text-yellow-600" />
            </div>
            <AlertDialogTitle>检测到版本冲突</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            此笔记已在其他设备上被修改。您的本地更改已自动复制到剪贴板。
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-4 p-4 bg-muted rounded-lg">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <ServerIcon className="h-4 w-4" />
            服务器版本
          </h4>
          <div className="text-sm text-muted-foreground">
            <p className="font-medium">{conflictData.title || '无标题'}</p>
            <p className="mt-1 line-clamp-3">
              {conflictData.content?.slice(0, 200) || '无内容'}
            </p>
            <p className="mt-2 text-xs">
              更新于 {new Date(conflictData.updated_at).toLocaleString('zh-CN')}
            </p>
          </div>
        </div>

        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm text-blue-800 flex items-start gap-2">
          <ClipboardIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>您的本地内容已复制到剪贴板，可以随时粘贴恢复。</p>
        </div>

        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel onClick={() => resolveConflict(false)}>
            保留本地（已在剪贴板）
          </AlertDialogCancel>
          <AlertDialogAction onClick={() => resolveConflict(true)}>
            使用服务器版本
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
