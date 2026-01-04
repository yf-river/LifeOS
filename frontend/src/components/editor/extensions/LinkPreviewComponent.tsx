'use client';

import { useEffect, useState, useCallback } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLinkIcon, GlobeIcon } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export function LinkPreviewComponent({ node, updateAttributes }: NodeViewProps) {
  const { url, title, description, image, favicon, siteName, loading } = node.attrs;
  const [error, setError] = useState(false);

  const fetchPreview = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/link-preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch preview');
      }

      const res = await response.json();
      if (res.h?.c === 0) {
        const data = res.c;
        updateAttributes({
          title: data.title,
          description: data.description,
          image: data.image,
          favicon: data.favicon,
          siteName: data.site_name,
          loading: false,
        });
      } else {
        setError(true);
        updateAttributes({ loading: false });
      }
    } catch (e) {
      setError(true);
      updateAttributes({ loading: false });
    }
  }, [url, updateAttributes]);

  useEffect(() => {
    if (loading && url) {
      fetchPreview();
    }
  }, [url, loading, fetchPreview]);

  if (loading) {
    return (
      <NodeViewWrapper>
        <div className="border border-border rounded-lg p-4 my-2">
          <div className="flex gap-4">
            <Skeleton className="w-24 h-24 rounded" />
            <div className="flex-1">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  if (error) {
    return (
      <NodeViewWrapper>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-primary hover:underline my-2"
        >
          <GlobeIcon className="h-4 w-4" />
          {url}
          <ExternalLinkIcon className="h-3 w-3" />
        </a>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block border border-border rounded-lg overflow-hidden my-2 hover:border-primary/50 transition-colors"
      >
        <div className="flex">
          {image && (
            <div className="w-32 h-24 flex-shrink-0">
              <img
                src={image}
                alt={title || ''}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
          <div className="flex-1 p-3 min-w-0">
            <h4 className="font-medium text-sm truncate">{title || url}</h4>
            {description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              {favicon ? (
                <img
                  src={favicon}
                  alt=""
                  className="w-4 h-4"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <GlobeIcon className="w-4 h-4" />
              )}
              <span className="truncate">{siteName || new URL(url).hostname}</span>
            </div>
          </div>
        </div>
      </a>
    </NodeViewWrapper>
  );
}
