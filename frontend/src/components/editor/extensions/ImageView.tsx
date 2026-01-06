'use client';

import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store';

export const ImageView = ({ node }: NodeViewProps) => {
  const { src, alt } = node.attrs;
  const selectedImageSrc = useUIStore((state) => state.selectedImageSrc);
  const setSelectedImageSrc = useUIStore((state) => state.setSelectedImageSrc);
  const setPreviewImageUrl = useUIStore((state) => state.setPreviewImageUrl);
  
  const isSelected = selectedImageSrc === src;

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('Image clicked, src:', src);
    console.log('Currently selected:', selectedImageSrc);
    console.log('Is selected:', isSelected);
    
    if (isSelected) {
      // 第二次点击：打开预览并清除选中状态
      console.log('Opening preview for:', src);
      setPreviewImageUrl(src);
      setSelectedImageSrc(null); // 清除选中状态
    } else {
      // 第一次点击：选中图片
      console.log('Selecting image:', src);
      setSelectedImageSrc(src);
    }
  };

  return (
    <NodeViewWrapper
      as="div"
      data-image-node="true"
      contentEditable={false}
      className={cn('relative inline-block py-2', 'max-w-[50%] max-h-[80vh]')}
    >
      <div
        onClick={handleClick}
        onMouseDown={(e) => e.stopPropagation()} // 防止编辑器捕获点击
        className={cn(
          'relative cursor-pointer select-none',
          isSelected && 'ring-2 ring-purple-500 ring-offset-2 rounded-lg'
        )}
      >
        <img 
          src={src} 
          alt={alt} 
          className="block w-full h-auto rounded-lg object-contain pointer-events-none" 
          draggable={false}
        />
        {isSelected && (
          <div className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8zm8-3a1 1 0 00-1 1v1H8a1 1 0 000 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};
