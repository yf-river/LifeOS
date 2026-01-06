import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ImageView } from './ImageView';

// 全局回调存储
let globalImageClickHandler: ((src: string) => void) | null = null;

export const setImageClickHandler = (handler: (src: string) => void) => {
  globalImageClickHandler = handler;
};

export const getImageClickHandler = () => globalImageClickHandler;

export const CustomImage = Node.create({
  name: 'image',
  group: 'block',
  inline: false,
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'img[src]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageView);
  },
});
