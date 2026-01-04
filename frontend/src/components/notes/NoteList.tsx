'use client';

import { useMemo } from 'react';
import { useNotesStore, useUIStore } from '@/store';
import { NoteCard } from './NoteCard';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * 笔记列表组件 - 严格按照 Get笔记 spec 实现
 * 
 * 结构：
 * ── 今天 ──
 * [笔记卡片 1]
 * [笔记卡片 2]
 * 
 * ── 昨天 ──
 * [笔记卡片 3]
 * 
 * ── 更早 ──
 * [笔记卡片 4]
 */
export function NoteList() {
  const { notes, isLoading, currentNote, setCurrentNote } = useNotesStore();
  const { setViewMode } = useUIStore();

  // 按日期分组笔记
  const groupedNotes = useMemo(() => {
    const groups: { [key: string]: typeof notes } = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    notes.forEach((note) => {
      const noteDate = new Date(note.created_at);
      noteDate.setHours(0, 0, 0, 0);
      
      let groupKey: string;
      if (noteDate.getTime() === today.getTime()) {
        groupKey = '今天';
      } else if (noteDate.getTime() === yesterday.getTime()) {
        groupKey = '昨天';
      } else {
        // 格式化为 "1月3日" 或 "2025年12月31日"
        const isThisYear = noteDate.getFullYear() === today.getFullYear();
        if (isThisYear) {
          groupKey = `${noteDate.getMonth() + 1}月${noteDate.getDate()}日`;
        } else {
          groupKey = `${noteDate.getFullYear()}年${noteDate.getMonth() + 1}月${noteDate.getDate()}日`;
        }
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(note);
    });

    // 转换为数组并按时间倒序排列
    return Object.entries(groups).sort((a, b) => {
      // 今天、昨天排在前面
      if (a[0] === '今天') return -1;
      if (b[0] === '今天') return 1;
      if (a[0] === '昨天') return -1;
      if (b[0] === '昨天') return 1;
      return 0;
    });
  }, [notes]);

  // 点击笔记卡片
  const handleNoteClick = (note: typeof notes[0]) => {
    setCurrentNote(note);
    setViewMode('detail');
  };

  // 加载状态
  if (isLoading) {
    return (
      <div className="py-6 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-4 space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 空状态
  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-[#8a8f99]">
        <div className="text-6xl mb-4">📝</div>
        <p className="text-lg font-medium">暂无笔记</p>
        <p className="text-sm mt-1">在上方输入框开始记录你的想法</p>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6">
      {groupedNotes.map(([groupLabel, groupNotes]) => (
        <div key={groupLabel}>
          {/* 日期分隔线 */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 h-px bg-[#e4e4e7]" />
            <span className="text-xs text-[#8a8f99] font-medium">{groupLabel}</span>
            <div className="flex-1 h-px bg-[#e4e4e7]" />
          </div>

          {/* 笔记卡片列表 */}
          <div className="space-y-4">
            {groupNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => handleNoteClick(note)}
                isSelected={currentNote?.id === note.id}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
