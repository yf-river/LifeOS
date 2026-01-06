'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotesStore, useUIStore } from '@/store';
import { cn } from '@/lib/utils';

/**
 * AI 助手面板 - Get笔记风格深度还原
 * 
 * 功能：
 * - RAG 增强对话（基于笔记内容）
 * - 预设快捷问题
 * - AI 自动模式 / 手动模式
 * - 流式输出响应
 * - 对话历史
 * - 上下文引用展示
 */

// AI 模式
type AIMode = 'AUTO' | 'MANUAL';

// 快捷提问模板 - 参考 Get笔记
const QUICK_PROMPTS = [
  { 
    id: 'weekly', 
    label: '帮我生成周报', 
    fullPrompt: '汇总一周笔记，生成"本周重点工作总结"和"下周计划"',
    icon: '📊',
    color: '#3b82f6'
  },
  { 
    id: 'todos', 
    label: '整理一周待办', 
    fullPrompt: '提取一周笔记里的待办事项，按紧急-重要程度排序',
    icon: '✅',
    color: '#10b981'
  },
  { 
    id: 'hot', 
    label: '24小时热点', 
    fullPrompt: '汇总过去 24 小时全球最值得关注的 10 条新闻，并各用 50 字摘要',
    icon: '🔥',
    color: '#f59e0b'
  },
  { 
    id: 'research', 
    label: '多维度深度调研', 
    fullPrompt: '请根据我提供的 [事件/产品/问题] 开展多维度的调研，包含背景、核心优势、争议点及当前现状。',
    icon: '🔍',
    color: '#8b5cf6'
  },
  { 
    id: 'solution', 
    label: '寻找解决方案', 
    fullPrompt: '遇到一个难题，稍后我会发给你，请在全部内容中搜索，有哪些解决方案或思维模型？',
    icon: '💡',
    color: '#ec4899'
  },
  { 
    id: 'quotes', 
    label: '搜索金句/观点', 
    fullPrompt: '稍后我会发给你一个[主题/关键词]，请搜索相关内容，找出相关的精彩金句或颠覆性观点。',
    icon: '💬',
    color: '#06b6d4'
  },
];

// 特色功能
const SPECIAL_FEATURES = [
  {
    id: 'daily',
    label: 'Get日报',
    description: '基于你的笔记生成每日摘要',
    icon: '📰',
    prompt: '帮我生成今日笔记的摘要报告，包括重点内容、待办事项和关键洞察'
  },
];

interface Message {
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

// 生成唯一 ID
const generateId = () => Math.random().toString(36).substring(2, 15);

export function AIPanel() {
  const { currentNote, notes } = useNotesStore();
  const { toggleAIPanel } = useUIStore();
  
  // 状态
  const [inputValue, setInputValue] = useState('');
  const [aiMode, setAIMode] = useState<AIMode>('AUTO');
  const [useRag, setUseRag] = useState(true);
  const [useWeb, setUseWeb] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 自动滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  // 自动调整输入框高度
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputValue]);

  // 处理快捷提问
  const handleQuickPrompt = (prompt: typeof QUICK_PROMPTS[0]) => {
    setInputValue(prompt.fullPrompt);
    inputRef.current?.focus();
  };

  // 处理特色功能
  const handleSpecialFeature = (feature: typeof SPECIAL_FEATURES[0]) => {
    setInputValue(feature.prompt);
    handleSend(feature.prompt);
  };

  // 发送消息
  const handleSend = async (overrideMessage?: string) => {
    const messageToSend = overrideMessage || inputValue.trim();
    if (!messageToSend || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: messageToSend,
      timestamp: new Date(),
    };

    setInputValue('');
    setMessages(prev => [...prev, userMessage]);
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
          query: messageToSend,
          history,
          use_rag: useRag,
          top_k: 5,
          mode: aiMode,
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
      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: assistantContent,
        contexts,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setStreamingContent('');

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: generateId(),
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

  // 清空对话
  const clearChat = () => {
    setMessages([]);
    setStreamingContent('');
  };

  // 复制消息
  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    // TODO: 显示复制成功提示
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa]">
      {/* 面板头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#e8e8e8] bg-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center">
            <SparkleIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-[14px] font-semibold text-[#111418]">AI 助手</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              {useRag && (
                <span className="text-[10px] bg-[#eff6ff] text-[#3b82f6] px-1.5 py-0.5 rounded font-medium">
                  RAG
                </span>
              )}
              <span className="text-[10px] text-[#8a8f99]">
                {aiMode === 'AUTO' ? '自动模式' : '手动模式'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <motion.button
              onClick={clearChat}
              className="p-2 hover:bg-[#f5f5f5] rounded-lg text-[#8a8f99] transition-colors"
              title="清空对话"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <TrashIcon className="w-4 h-4" />
            </motion.button>
          )}
          <motion.button
            onClick={() => setShowSettings(!showSettings)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              showSettings ? "bg-[#f5f5f5] text-[#111418]" : "hover:bg-[#f5f5f5] text-[#8a8f99]"
            )}
            title="设置"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <SettingsIcon className="w-4 h-4" />
          </motion.button>
          <motion.button
            onClick={toggleAIPanel}
            className="p-2 hover:bg-[#f5f5f5] rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <CloseIcon className="w-4 h-4 text-[#8a8f99]" />
          </motion.button>
        </div>
      </div>

      {/* 设置面板 */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-[#e8e8e8] bg-white"
          >
            <div className="p-4 space-y-3">
              {/* AI 模式切换 */}
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#5a5f6b]">AI 模式</span>
                <div className="flex bg-[#f5f5f5] rounded-lg p-0.5">
                  <button
                    onClick={() => setAIMode('AUTO')}
                    className={cn(
                      "px-3 py-1 text-[12px] rounded-md transition-colors",
                      aiMode === 'AUTO' 
                        ? "bg-white text-[#111418] shadow-sm" 
                        : "text-[#8a8f99]"
                    )}
                  >
                    自动
                  </button>
                  <button
                    onClick={() => setAIMode('MANUAL')}
                    className={cn(
                      "px-3 py-1 text-[12px] rounded-md transition-colors",
                      aiMode === 'MANUAL' 
                        ? "bg-white text-[#111418] shadow-sm" 
                        : "text-[#8a8f99]"
                    )}
                  >
                    手动
                  </button>
                </div>
              </div>
              
              {/* 知识库开关 */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[13px] text-[#5a5f6b]">知识库检索</span>
                  <p className="text-[11px] text-[#adb3be]">基于笔记内容回答</p>
                </div>
                <button
                  onClick={() => setUseRag(!useRag)}
                  className={cn(
                    "w-10 h-6 rounded-full transition-colors relative",
                    useRag ? "bg-[#3b82f6]" : "bg-[#e5e6ea]"
                  )}
                >
                  <motion.div
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                    animate={{ left: useRag ? 20 : 4 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* 联网搜索开关 */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[13px] text-[#5a5f6b]">联网搜索</span>
                  <p className="text-[11px] text-[#adb3be]">获取最新信息</p>
                </div>
                <button
                  onClick={() => setUseWeb(!useWeb)}
                  className={cn(
                    "w-10 h-6 rounded-full transition-colors relative",
                    useWeb ? "bg-[#3b82f6]" : "bg-[#e5e6ea]"
                  )}
                >
                  <motion.div
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                    animate={{ left: useWeb ? 20 : 4 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 主内容区 */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          // 初始状态 - 显示欢迎信息和快捷提问
          <div className="p-4">
            {/* 欢迎信息 */}
            <motion.div 
              className="text-center py-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center shadow-lg">
                <SparkleIcon className="w-8 h-8 text-white" />
              </div>
              <p className="text-[16px] font-semibold text-[#111418]">你好，我是你的 AI 助手</p>
              <p className="text-[13px] text-[#8a8f99] mt-1">
                {useRag ? '基于你的笔记回答问题' : '通用 AI 对话模式'}
              </p>
              <p className="text-[11px] text-[#adb3be] mt-0.5">
                当前有 {notes.length} 篇笔记可供检索
              </p>
            </motion.div>

            {/* 快捷提问 */}
            <div className="mb-4">
              <p className="text-[12px] text-[#8a8f99] mb-2 font-medium">你可以这样问我</p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <motion.button
                    key={prompt.id}
                    onClick={() => handleQuickPrompt(prompt)}
                    className="flex items-center gap-2 px-3 py-2.5 bg-white rounded-xl border border-[#e8e8e8] hover:border-[#ccc] hover:shadow-sm transition-all text-left"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-lg">{prompt.icon}</span>
                    <span className="text-[12px] text-[#333639] font-medium line-clamp-1">{prompt.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* 分隔线 */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-[#e8e8e8]" />
              <span className="text-[11px] text-[#adb3be]">特色功能</span>
              <div className="flex-1 h-px bg-[#e8e8e8]" />
            </div>

            {/* 特色功能 */}
            {SPECIAL_FEATURES.map((feature) => (
              <motion.button
                key={feature.id}
                onClick={() => handleSpecialFeature(feature)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-[#e8e8e8] hover:border-[#ccc] hover:shadow-sm transition-all"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f59e0b] to-[#f97316] flex items-center justify-center">
                  <span className="text-xl">{feature.icon}</span>
                </div>
                <div className="text-left flex-1">
                  <p className="text-[13px] font-semibold text-[#111418]">{feature.label}</p>
                  <p className="text-[11px] text-[#8a8f99]">{feature.description}</p>
                </div>
                <ChevronRightIcon className="w-4 h-4 text-[#adb3be]" />
              </motion.button>
            ))}
          </div>
        ) : (
          // 对话状态 - 显示消息列表
          <div className="p-4 space-y-4">
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {/* 引用的上下文 */}
                  {msg.role === 'assistant' && msg.contexts && msg.contexts.length > 0 && (
                    <motion.div 
                      className="mb-2 text-[11px] text-[#5a5f6b] bg-[#f5f7fa] rounded-lg p-2.5 border-l-2 border-[#3b82f6]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <p className="font-semibold mb-1.5 flex items-center gap-1">
                        <BookIcon className="w-3 h-3" />
                        参考来源
                      </p>
                      {msg.contexts.slice(0, 2).map((ctx, i) => (
                        <p key={i} className="truncate text-[#8a8f99] mb-0.5">
                          • {ctx.title || '笔记'}: {ctx.text.slice(0, 50)}...
                        </p>
                      ))}
                    </motion.div>
                  )}
                  
                  <div
                    className={cn(
                      'max-w-[90%] p-3 rounded-2xl relative group',
                      msg.role === 'user'
                        ? 'ml-auto bg-[#111418] text-white'
                        : 'mr-auto bg-white text-[#333639] shadow-sm'
                    )}
                  >
                    <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    
                    {/* 复制按钮 */}
                    <button
                      onClick={() => copyMessage(msg.content)}
                      className={cn(
                        "absolute -bottom-6 opacity-0 group-hover:opacity-100 transition-opacity",
                        "text-[11px] text-[#8a8f99] hover:text-[#5a5f6b] flex items-center gap-1",
                        msg.role === 'user' ? 'right-0' : 'left-0'
                      )}
                    >
                      <CopyIcon className="w-3 h-3" />
                      复制
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* 流式输出 */}
            {streamingContent && (
              <motion.div 
                className="mr-auto max-w-[90%] p-3 bg-white rounded-2xl shadow-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="text-[13px] leading-relaxed whitespace-pre-wrap text-[#333639]">
                  {streamingContent}
                  <span className="inline-block w-0.5 h-4 bg-[#3b82f6] animate-pulse ml-0.5 rounded" />
                </p>
              </motion.div>
            )}
            
            {/* 加载状态 */}
            {isLoading && !streamingContent && (
              <motion.div 
                className="mr-auto p-3 bg-white rounded-2xl shadow-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex items-center gap-1.5">
                  <motion.div
                    className="w-2 h-2 bg-[#3b82f6] rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-[#3b82f6] rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-[#3b82f6] rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                  />
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 输入区 */}
      <div className="p-4 bg-white border-t border-[#e8e8e8]">
        {/* 当前上下文提示 */}
        {currentNote && useRag && (
          <motion.div 
            className="mb-2 px-2.5 py-1.5 bg-[#f5f7fa] rounded-lg text-[11px] text-[#5a5f6b] flex items-center gap-1.5"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <FileIcon className="w-3.5 h-3.5 text-[#3b82f6]" />
            <span className="truncate flex-1">当前笔记: {currentNote.title || '无标题'}</span>
            <span className="text-[#adb3be]">+ {notes.length - 1} 篇</span>
          </motion.div>
        )}

        {/* 快捷功能按钮 */}
        <div className="flex items-center gap-1.5 mb-2">
          <button
            onClick={() => setUseRag(!useRag)}
            className={cn(
              'px-2.5 py-1 text-[11px] rounded-lg flex items-center gap-1 transition-colors',
              useRag 
                ? 'bg-[#3b82f6] text-white' 
                : 'bg-[#f5f5f5] text-[#8a8f99] hover:bg-[#ebebeb]'
            )}
          >
            <BookIcon className="w-3.5 h-3.5" />
            笔记
          </button>
          <button
            onClick={() => setUseWeb(!useWeb)}
            className={cn(
              'px-2.5 py-1 text-[11px] rounded-lg flex items-center gap-1 transition-colors',
              useWeb 
                ? 'bg-[#3b82f6] text-white' 
                : 'bg-[#f5f5f5] text-[#8a8f99] hover:bg-[#ebebeb]'
            )}
          >
            <GlobeIcon className="w-3.5 h-3.5" />
            网页
          </button>
          <button className="px-2.5 py-1 text-[11px] rounded-lg flex items-center gap-1 bg-[#f5f5f5] text-[#8a8f99] hover:bg-[#ebebeb] transition-colors">
            <DocIcon className="w-3.5 h-3.5" />
            文档
          </button>
        </div>

        {/* 输入框 */}
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
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
              placeholder={useRag ? "基于笔记内容提问..." : "随便聊聊..."}
              className="w-full max-h-[120px] resize-none border border-[#e5e6ea] rounded-xl px-3 py-2.5 text-[13px] text-[#333639] placeholder-[#adb5bd] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/20 transition-all"
              rows={1}
              disabled={isLoading}
            />
          </div>
          <motion.button
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || isLoading}
            className={cn(
              'px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all',
              inputValue.trim() && !isLoading
                ? 'bg-[#111418] text-white hover:bg-[#333] shadow-sm'
                : 'bg-[#e5e6ea] text-[#adb5bd] cursor-not-allowed'
            )}
            whileHover={inputValue.trim() && !isLoading ? { scale: 1.02 } : {}}
            whileTap={inputValue.trim() && !isLoading ? { scale: 0.98 } : {}}
          >
            <SendIcon className="w-4 h-4" />
          </motion.button>
        </div>

        {/* 快捷键提示 */}
        <p className="mt-2 text-[10px] text-[#adb3be] text-center">
          按 Enter 发送，Shift+Enter 换行
        </p>
      </div>
    </div>
  );
}

// Icons
function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function DocIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}
