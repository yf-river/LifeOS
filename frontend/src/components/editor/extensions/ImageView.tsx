'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export const ImageView = ({ node }: NodeViewProps) => {
  const { src, alt } = node.attrs;
  const [isSelected, setIsSelected] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 监听点击外部区域，取消选中状态
  useEffect(() => {
    if (!isSelected) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // 如果点击的是当前图片节点内部，不处理
      if (containerRef.current?.contains(target)) {
        return;
      }
      // 点击外部，取消选中
      setIsSelected(false);
    };

    // 延迟添加监听器，避免当前点击事件触发
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isSelected]);

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (isSelected) {
      // 第二次点击：打开预览
      setShowPreview(true);
      setIsSelected(false);
    } else {
      // 第一次点击：选中图片
      setIsSelected(true);
    }
  };

  const handleClose = () => {
    setShowPreview(false);
  };

  // 是否显示紫框：悬浮或选中时显示
  const showBorder = isHovered || isSelected;

  return (
    <>
      <NodeViewWrapper
        as="div"
        data-image-node="true"
        contentEditable={false}
        className={cn('relative inline-block py-2', 'max-w-[50%] max-h-[80vh]')}
      >
        <div
          ref={containerRef}
          onClick={handleClick}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={cn(
            'relative cursor-pointer select-none transition-all',
            showBorder && 'ring-2 ring-purple-500'
          )}
        >
          <img 
            src={src} 
            alt={alt} 
            className="block w-full h-auto rounded-lg object-contain pointer-events-none" 
            draggable={false}
          />
        </div>
      </NodeViewWrapper>

      {/* 图片预览弹窗 */}
      {showPreview && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80"
          onClick={handleClose}
        >
          {/* 关闭按钮 */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          
          {/* 图片 */}
          <img
            src={src}
            alt={alt}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>,
        document.body
      )}
    </>
  );
};
