'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNotesStore, useUIStore } from '@/store';
import { cn } from '@/lib/utils';

/**
 * AI 助手面板 - Get笔记 右侧 AI 面板
 * 
 * 支持 RAG 增强的 AI 对话，基于用户笔记内容回答问题
 */

// 快捷提问模板
const QUICK_PROMPTS = [
  { id: 'weekly', label: '帮我生成周报', icon: '📊' },
  { id: 'todos', label: '整理一周待办', icon: '✅' },
  { id: 'hot', label: '24小时热点', icon: '🔥' },
  { id: 'research', label: '多维度深度调研', icon: '🔍' },
  { id: 'solution', label: '寻找解决方案', icon: '💡' },
  { id: 'quotes', label: '搜索金句/观点', icon: '💬' },
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
  contexts?: Array<{
    text: string;
    title?: string;
    score: number;
  }>;
}

export function AIPanel() {
  const { currentNote } = useNotesStore();
  const { toggleAIPanel } = useUIStore();
  const [inputValue, setInputValue] = useState('');
  const [useRag, setUseRag] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 自动滚动
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  const handleQuickPrompt = (prompt: typeof QUICK_PROMPTS[0]) => {
    setInputValue(prompt.label);
    inputRef.current?.focus();
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    setStreamingContent('');

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

      // 准备历史消息
      const history = messages.slice(-6).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch(`${API_BASE_URL}/chat/rag/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          query: userMessage,
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
      let contexts: Message['contexts'] = [];

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
              // 跳过解析错误
            }
          }
        }
      }

      // 添加助手消息
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: assistantContent,
        contexts,
      }]);
      setStreamingContent('');

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '抱歉，我遇到了一些问题。请稍后重试。' 
      }]);
    } finally {
      setIsLoading(false);
      setStreamingContent('');
    }
  };

  const clearChat = () => {
    setMessages([]);
    setStreamingContent('');
  };

  return (
    <div className="flex flex-col h-full bg-[#f2f2f3]">
      {/* 面板头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#e4e4e7] bg-white">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#333639]">AI 助手</span>
          {useRag && (
            <span className="text-xs bg-[#2a88ff]/10 text-[#2a88ff] px-1.5 py-0.5 rounded">
              RAG
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="p-1 hover:bg-[#f5f5f5] rounded text-[#8a8f99]"
              title="清空对话"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={toggleAIPanel}
            className="p-1 hover:bg-[#f5f5f5] rounded"
          >
            <CloseIcon className="w-4 h-4 text-[#8a8f99]" />
          </button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          // 初始状态 - 显示欢迎信息和快捷提问
          <div className="p-4">
            {/* 欢迎信息 */}
            <div className="text-center py-8">
              <div className="text-4xl mb-4">💬</div>
              <p className="text-[#333639] font-medium">你好，我是你的 AI 助手</p>
              <p className="text-xs text-[#8a8f99] mt-1">
                {useRag ? '基于你的笔记回答问题' : '通用 AI 对话模式'}
              </p>
            </div>

            {/* 快捷提问 */}
            <div className="space-y-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt.id}
                  onClick={() => handleQuickPrompt(prompt)}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-[#e5e6ea] hover:border-[#ccc] hover:shadow-sm transition-all text-left"
                >
                  <span>{prompt.icon}</span>
                  <span className="text-sm text-[#333639]">{prompt.label}</span>
                </button>
              ))}
            </div>

            {/* 分隔线 */}
            <div className="my-4 border-t border-[#e4e4e7]" />

            {/* Get日报 */}
            <button className="w-full flex items-center gap-2 px-3 py-3 bg-white rounded-lg border border-[#e5e6ea] hover:border-[#ccc] hover:shadow-sm transition-all">
              <span className="text-lg">📰</span>
              <div className="text-left">
                <p className="text-sm font-medium text-[#333639]">Get日报</p>
                <p className="text-xs text-[#8a8f99]">基于你的笔记生成每日摘要</p>
              </div>
            </button>
          </div>
        ) : (
          // 对话状态 - 显示消息列表
          <div className="p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx}>
                {/* 引用的上下文 */}
                {msg.role === 'assistant' && msg.contexts && msg.contexts.length > 0 && (
                  <div className="mb-2 text-xs text-[#8a8f99] bg-[#f5f5f5] rounded p-2 border-l-2 border-[#2a88ff]">
                    <p className="font-medium mb-1">📚 参考来源：</p>
                    {msg.contexts.slice(0, 2).map((ctx, i) => (
                      <p key={i} className="truncate">
                        • {ctx.title || '笔记'}: {ctx.text.slice(0, 40)}...
                      </p>
                    ))}
                  </div>
                )}
                
                <div
                  className={cn(
                    'max-w-[90%] p-3 rounded-lg',
                    msg.role === 'user'
                      ? 'ml-auto bg-[#2a88ff] text-white'
                      : 'mr-auto bg-white text-[#333639] border border-[#e5e6ea]'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            
            {/* 流式输出 */}
            {streamingContent && (
              <div className="mr-auto max-w-[90%] p-3 bg-white rounded-lg border border-[#e5e6ea]">
                <p className="text-sm whitespace-pre-wrap text-[#333639]">
                  {streamingContent}
                  <span className="inline-block w-1 h-4 bg-[#2a88ff] animate-pulse ml-0.5" />
                </p>
              </div>
            )}
            
            {/* 加载状态 */}
            {isLoading && !streamingContent && (
              <div className="mr-auto p-3 bg-white rounded-lg border border-[#e5e6ea]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#8a8f99] rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-[#8a8f99] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-[#8a8f99] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 输入区 */}
      <div className="p-4 bg-white border-t border-[#e4e4e7]">
        {/* 选中笔记提示 */}
        {currentNote && (
          <div className="mb-2 px-2 py-1 bg-[#f5f5f5] rounded text-xs text-[#8a8f99] flex items-center gap-1">
            <FileIcon className="w-3 h-3" />
            <span className="truncate">{currentNote.title || '无标题笔记'}</span>
          </div>
        )}

        {/* 输入框 */}
        <div className="relative">
          <div className="flex items-center gap-1 mb-2">
            <button className="p-1 hover:bg-[#f5f5f5] rounded" title="添加文件">
              <PlusIcon className="w-4 h-4 text-[#8a8f99]" />
            </button>
            <button
              onClick={() => setUseRag(!useRag)}
              className={cn(
                'px-2 py-0.5 text-xs rounded flex items-center gap-1',
                useRag ? 'bg-[#2a88ff] text-white' : 'bg-[#f5f5f5] text-[#8a8f99]'
              )}
              title={useRag ? '关闭知识库检索' : '开启知识库检索'}
            >
              <BookIcon className="w-3 h-3" />
              知识库
            </button>
            <button className="p-1 hover:bg-[#f5f5f5] rounded" title="文档">
              <DocIcon className="w-4 h-4 text-[#8a8f99]" />
            </button>
            <button className="p-1 hover:bg-[#f5f5f5] rounded" title="网页">
              <GlobeIcon className="w-4 h-4 text-[#8a8f99]" />
            </button>
          </div>

          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={useRag ? "基于笔记内容提问" : "随便聊聊"}
              className="flex-1 max-h-[120px] resize-none border border-[#e5e6ea] rounded-lg px-3 py-2 text-sm text-[#333639] placeholder-[#adb5bd] focus:outline-none focus:border-[#2a88ff]"
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                inputValue.trim() && !isLoading
                  ? 'bg-[#111418] text-white hover:bg-[#333]'
                  : 'bg-[#e5e6ea] text-[#adb5bd] cursor-not-allowed'
              )}
            >
              发送
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Icons
function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function DocIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  );
}
