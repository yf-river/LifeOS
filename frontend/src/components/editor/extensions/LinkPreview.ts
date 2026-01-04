import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { LinkPreviewComponent } from './LinkPreviewComponent';

export interface LinkPreviewOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    linkPreview: {
      setLinkPreview: (options: { url: string }) => ReturnType;
    };
  }
}

export const LinkPreview = Node.create<LinkPreviewOptions>({
  name: 'linkPreview',

  group: 'block',

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      url: {
        default: null,
      },
      title: {
        default: null,
      },
      description: {
        default: null,
      },
      image: {
        default: null,
      },
      favicon: {
        default: null,
      },
      siteName: {
        default: null,
      },
      loading: {
        default: true,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-link-preview]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-link-preview': '' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(LinkPreviewComponent);
  },

  addCommands() {
    return {
      setLinkPreview:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});
