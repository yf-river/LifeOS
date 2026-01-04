'use client';

/**
 * 链接预览卡片组件
 * 
 * 显示 URL 的 OG 信息（标题、描述、图片）
 */

import { useState, useEffect } from 'react';
import { ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface LinkPreviewData {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
  site_name?: string;
}

interface LinkPreviewProps {
  url: string;
  className?: string;
  compact?: boolean;
}

export function LinkPreview({ url, className, compact = false }: LinkPreviewProps) {
  const [data, setData] = useState<LinkPreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPreview = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`${API_BASE_URL}/ai/link-preview`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ url }),
        });

        const result = await res.json();
        if (result.h?.c === 0) {
          setData(result.c);
        } else {
          setError(result.h?.e || '获取预览失败');
        }
      } catch (err) {
        setError('获取预览失败');
      } finally {
        setLoading(false);
      }
    };

    if (url) {
      fetchPreview();
    }
  }, [url]);

  // 加载中
  if (loading) {
    return (
      <div className={cn(
        'flex items-center gap-2 p-3 bg-[#f5f5f5] rounded-lg',
        className
      )}>
        <Loader2 className="w-4 h-4 animate-spin text-[#8a8f99]" />
        <span className="text-sm text-[#8a8f99]">加载预览...</span>
      </div>
    );
  }

  // 加载失败 - 显示简单链接
  if (error || !data) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'flex items-center gap-2 p-3 bg-[#f5f5f5] rounded-lg hover:bg-[#eee] transition-colors',
          className
        )}
      >
        <ExternalLink className="w-4 h-4 text-[#8a8f99]" />
        <span className="text-sm text-[#2a88ff] truncate">{url}</span>
      </a>
    );
  }

  // 紧凑模式
  if (compact) {
    return (
      <a
        href={data.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'flex items-center gap-2 p-2 bg-[#f5f5f5] rounded-lg hover:bg-[#eee] transition-colors',
          className
        )}
      >
        {data.favicon && (
          <img src={data.favicon} alt="" className="w-4 h-4" onError={(e) => e.currentTarget.style.display = 'none'} />
        )}
        <span className="text-sm text-[#333639] truncate">{data.title || data.url}</span>
        <ExternalLink className="w-3 h-3 text-[#8a8f99] flex-shrink-0" />
      </a>
    );
  }

  // 完整卡片模式
  return (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'block bg-white border border-[#e5e6ea] rounded-lg overflow-hidden hover:shadow-md transition-shadow',
        className
      )}
    >
      <div className="flex">
        {/* 预览图 */}
        {data.image && (
          <div className="w-[120px] h-[90px] flex-shrink-0 bg-[#f5f5f5]">
            <img
              src={data.image}
              alt={data.title || ''}
              className="w-full h-full object-cover"
              onError={(e) => e.currentTarget.parentElement!.style.display = 'none'}
            />
          </div>
        )}

        {/* 内容 */}
        <div className="flex-1 p-3 min-w-0">
          {/* 站点信息 */}
          <div className="flex items-center gap-1.5 mb-1">
            {data.favicon && (
              <img
                src={data.favicon}
                alt=""
                className="w-4 h-4"
                onError={(e) => e.currentTarget.style.display = 'none'}
              />
            )}
            <span className="text-xs text-[#8a8f99] truncate">
              {data.site_name || new URL(data.url).hostname}
            </span>
          </div>

          {/* 标题 */}
          <h4 className="text-sm font-medium text-[#333639] line-clamp-1 mb-1">
            {data.title || data.url}
          </h4>

          {/* 描述 */}
          {data.description && (
            <p className="text-xs text-[#8a8f99] line-clamp-2">
              {data.description}
            </p>
          )}
        </div>
      </div>
    </a>
  );
}

/**
 * 链接预览列表组件
 * 
 * 从文本中提取 URL 并显示预览
 */
interface LinkPreviewListProps {
  content: string;
  className?: string;
}

// URL 正则
const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g;

export function LinkPreviewList({ content, className }: LinkPreviewListProps) {
  const urls = content.match(URL_REGEX) || [];
  const uniqueUrls = Array.from(new Set(urls)).slice(0, 3); // 最多显示 3 个

  if (uniqueUrls.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      {uniqueUrls.map((url) => (
        <LinkPreview key={url} url={url} />
      ))}
    </div>
  );
}
