'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { cn } from '@/lib/utils';
import { X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

export const ImageView = ({ node }: NodeViewProps) => {
  const { src, alt } = node.attrs;
  const [isSelected, setIsSelected] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // 监听点击外部区域，取消选中状态
  useEffect(() => {
    if (!isSelected) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (containerRef.current?.contains(target)) {
        return;
      }
      setIsSelected(false);
    };

    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isSelected]);

  // 监听 Ctrl+C 复制图片
  useEffect(() => {
    if (!isSelected) return;

    const handleCopy = async (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        try {
          // 获取图片并转换为 Blob
          const response = await fetch(src);
          const blob = await response.blob();
          
          // 写入剪贴板
          await navigator.clipboard.write([
            new ClipboardItem({
              [blob.type]: blob,
            }),
          ]);
        } catch (err) {
          console.error('复制图片失败:', err);
        }
      }
    };

    window.addEventListener('keydown', handleCopy);
    return () => window.removeEventListener('keydown', handleCopy);
  }, [isSelected, src]);

  // 监听滚轮缩放
  useEffect(() => {
    if (!showPreview) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setScale(prev => Math.max(0.5, Math.min(5, prev + delta)));
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showPreview]);

  // 监听拖动
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      setPosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  // 重置状态
  const handleClose = () => {
    setShowPreview(false);
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (isSelected) {
      setShowPreview(true);
      setIsSelected(false);
    } else {
      setIsSelected(true);
    }
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(5, prev + 0.25));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(0.5, prev - 0.25));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleImageMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

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
            'relative select-none transition-all',
            isSelected ? 'cursor-zoom-in' : 'cursor-default',
            showBorder && 'ring-2'
          )}
          style={showBorder ? { '--tw-ring-color': 'rgb(116, 112, 241)' } as React.CSSProperties : undefined}
        >
          <img 
            src={src} 
            alt={alt} 
            className="block w-full h-auto rounded-lg object-contain pointer-events-none" 
            draggable={false}
          />
          
          {/* 四角的小圆点 */}
          {showBorder && (
            <>
              <div className="absolute -top-1 -left-1 w-2 h-2 rounded-full" style={{ backgroundColor: 'rgb(116, 112, 241)' }} />
              <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full" style={{ backgroundColor: 'rgb(116, 112, 241)' }} />
              <div className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full" style={{ backgroundColor: 'rgb(116, 112, 241)' }} />
              <div className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full" style={{ backgroundColor: 'rgb(116, 112, 241)' }} />
            </>
          )}
        </div>
      </NodeViewWrapper>

      {/* 图片预览弹窗 */}
      {showPreview && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90"
          onClick={handleClose}
        >
          {/* 工具栏 */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-gray-900/90 backdrop-blur-md rounded-lg px-4 py-2 z-10 shadow-2xl border border-white/10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleZoomOut();
              }}
              className="p-2 hover:bg-white/20 rounded transition-colors"
              title="缩小 (Ctrl+滚轮)"
            >
              <ZoomOut className="w-5 h-5 text-white" />
            </button>
            
            <span className="text-white text-sm font-medium min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleZoomIn();
              }}
              className="p-2 hover:bg-white/20 rounded transition-colors"
              title="放大 (Ctrl+滚轮)"
            >
              <ZoomIn className="w-5 h-5 text-white" />
            </button>

            <div className="w-px h-6 bg-white/30 mx-2" />

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRotate();
              }}
              className="p-2 hover:bg-white/20 rounded transition-colors"
              title="旋转"
            >
              <RotateCw className="w-5 h-5 text-white" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleReset();
              }}
              className="px-3 py-2 hover:bg-white/20 rounded transition-colors text-white text-sm font-medium"
              title="重置"
            >
              重置
            </button>
          </div>

          {/* 关闭按钮 */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-900/90 hover:bg-gray-800/90 backdrop-blur-md transition-colors shadow-2xl border border-white/10"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          
          {/* 图片容器 */}
          <div 
            className="flex items-center justify-center w-full h-full"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.2s ease-out',
              }}
            >
              <img
                ref={imageRef}
                src={src}
                alt={alt}
                className="max-w-[90vw] max-h-[90vh] object-contain select-none"
                style={{
                  cursor: isDragging ? 'grabbing' : 'grab'
                }}
                onMouseDown={handleImageMouseDown}
                draggable={false}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
