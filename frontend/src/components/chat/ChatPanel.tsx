'use client';

/**
 * AI 聊天面板 - RAG 增强的 AI 对话
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Sparkles, X, Minimize2, Maximize2, BookOpen, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  contexts?: Array<{
    text: string;
    title?: string;
    score: number;
  }>;
  timestamp: Date;
}

interface ChatPanelProps {
  className?: string;
  onClose?: () => void;
}

export function ChatPanel({ className, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [useRag, setUseRag] = useState(true);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 自动滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  // 聚焦输入框
  useEffect(() => {
    if (!isMinimized) {
      inputRef.current?.focus();
    }
  }, [isMinimized]);

  // 发送消息
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setStreamingContent('');

    try {
      // 准备历史消息
      const history = messages.slice(-6).map(m => ({
        role: m.role,
        content: m.content,
      }));

      // 使用流式 API
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${API_BASE_URL}/chat/rag/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          query: userMessage.content,
          history,
          use_rag: useRag,
          top_k: 3,
        }),
      });

      if (!response.ok) {
        throw new Error('请求失败');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      let assistantContent = '';
      let contexts: ChatMessage['contexts'] = [];

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'context') {
                contexts = data.data.contexts || [];
              } else if (data.type === 'content') {
                assistantContent += data.data;
                setStreamingContent(assistantContent);
              } else if (data.type === 'error') {
                throw new Error(data.data);
              }
            } catch {
              // 跳过解析错误的行
            }
          }
        }
      }

      // 添加助手消息
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        contexts,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setStreamingContent('');

    } catch (error) {
      console.error('Chat error:', error);
      
      // 添加错误消息
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，我遇到了一些问题。请稍后重试。',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setStreamingContent('');
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // 最小化视图
  if (isMinimized) {
    return (
      <div
        className={cn(
          'fixed bottom-4 right-4 bg-[#2a2e3b] rounded-full p-3 cursor-pointer shadow-lg hover:bg-[#3a3e4b] transition-colors',
          className
        )}
        onClick={() => setIsMinimized(false)}
      >
        <Bot className="w-6 h-6 text-[#00d4aa]" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 w-[400px] h-[600px] bg-[#1e2128] rounded-lg shadow-2xl flex flex-col border border-[#3a3e4b]',
        className
      )}
    >
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#3a3e4b]">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-[#00d4aa]" />
          <span className="font-medium text-white">AI 助手</span>
          {useRag && (
            <span className="text-xs bg-[#00d4aa]/20 text-[#00d4aa] px-2 py-0.5 rounded">
              RAG
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setUseRag(!useRag)}
            className={cn(
              'p-1.5 rounded hover:bg-[#2a2e3b] transition-colors',
              useRag ? 'text-[#00d4aa]' : 'text-[#8b8f9a]'
            )}
            title={useRag ? '关闭知识库检索' : '开启知识库检索'}
          >
            <BookOpen className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 rounded hover:bg-[#2a2e3b] transition-colors text-[#8b8f9a]"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-[#2a2e3b] transition-colors text-[#8b8f9a]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-[#8b8f9a]">
            <Sparkles className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-sm">开始和 AI 助手对话</p>
            <p className="text-xs mt-1 opacity-70">
              {useRag ? '基于你的笔记回答问题' : '通用 AI 对话模式'}
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex gap-3',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-[#00d4aa]/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-[#00d4aa]" />
              </div>
            )}
            
            <div
              className={cn(
                'max-w-[80%] rounded-lg px-3 py-2',
                message.role === 'user'
                  ? 'bg-[#00d4aa] text-white'
                  : 'bg-[#2a2e3b] text-[#e1e4eb]'
              )}
            >
              {/* 引用的上下文 */}
              {message.contexts && message.contexts.length > 0 && (
                <div className="mb-2 text-xs opacity-70 border-l-2 border-[#00d4aa] pl-2">
                  <p className="font-medium mb-1">参考来源：</p>
                  {message.contexts.slice(0, 2).map((ctx, i) => (
                    <p key={i} className="truncate">
                      • {ctx.title || '笔记'}: {ctx.text.slice(0, 50)}...
                    </p>
                  ))}
                </div>
              )}
              
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>

            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-[#3a3e4b] flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-[#8b8f9a]" />
              </div>
            )}
          </div>
        ))}

        {/* 流式输出 */}
        {streamingContent && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-[#00d4aa]/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-[#00d4aa]" />
            </div>
            <div className="max-w-[80%] rounded-lg px-3 py-2 bg-[#2a2e3b] text-[#e1e4eb]">
              <p className="text-sm whitespace-pre-wrap">{streamingContent}</p>
              <span className="inline-block w-1 h-4 bg-[#00d4aa] animate-pulse ml-1" />
            </div>
          </div>
        )}

        {/* 加载状态 */}
        {isLoading && !streamingContent && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-[#00d4aa]/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-[#00d4aa]" />
            </div>
            <div className="rounded-lg px-3 py-2 bg-[#2a2e3b]">
              <Loader2 className="w-4 h-4 text-[#00d4aa] animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="p-4 border-t border-[#3a3e4b]">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息... (Enter 发送)"
            className="flex-1 bg-[#2a2e3b] text-[#e1e4eb] rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#00d4aa] placeholder-[#8b8f9a]"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className={cn(
              'px-3 py-2 rounded-lg transition-colors',
              input.trim() && !isLoading
                ? 'bg-[#00d4aa] text-white hover:bg-[#00c49a]'
                : 'bg-[#2a2e3b] text-[#8b8f9a] cursor-not-allowed'
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
