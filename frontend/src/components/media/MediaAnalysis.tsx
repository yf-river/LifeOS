'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api';

/**
 * 多媒体分析面板 - Get笔记风格
 * 
 * 功能：
 * - 图片 OCR 识别
 * - 链接摘要提取
 * - 录音转文字（ASR）
 */

interface MediaAnalysisProps {
  onInsertText?: (text: string) => void;
  className?: string;
}

type AnalysisType = 'ocr' | 'link' | 'asr' | null;

interface OCRResult {
  text: string;
}

interface LinkPreviewResult {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  favicon: string | null;
  site_name: string | null;
}

interface SummaryResult {
  summary: string;
}

interface ASRResult {
  text: string;
}

export function MediaAnalysis({ onInsertText, className }: MediaAnalysisProps) {
  const [activeType, setActiveType] = useState<AnalysisType>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // OCR 状态
  const [ocrResult, setOcrResult] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // 链接状态
  const [linkUrl, setLinkUrl] = useState('');
  const [linkPreview, setLinkPreview] = useState<LinkPreviewResult | null>(null);
  const [linkSummary, setLinkSummary] = useState<string | null>(null);
  
  // ASR 状态
  const [asrResult, setAsrResult] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // 处理图片选择
  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setOcrResult(null);

    try {
      // 转换为 base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        setSelectedImage(base64);
        
        // 提取纯 base64（去掉 data:image/xxx;base64, 前缀）
        const base64Data = base64.split(',')[1];
        
        // 调用 OCR API
        const result = await apiClient.post<OCRResult>('/ai/ocr', {
          image_base64: base64Data,
        });
        
        setOcrResult(result.text);
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || 'OCR 识别失败');
      setLoading(false);
    }
  }, []);

  // 处理链接分析
  const handleLinkAnalysis = useCallback(async () => {
    if (!linkUrl.trim()) {
      setError('请输入链接地址');
      return;
    }

    setLoading(true);
    setError(null);
    setLinkPreview(null);
    setLinkSummary(null);

    try {
      // 获取链接预览
      const preview = await apiClient.post<LinkPreviewResult>('/ai/link-preview', {
        url: linkUrl,
      });
      setLinkPreview(preview);

      // 如果有描述，生成摘要
      if (preview.description) {
        const summary = await apiClient.post<SummaryResult>('/ai/summary', {
          content: `${preview.title || ''}\n${preview.description}`,
          max_length: 200,
        });
        setLinkSummary(summary.summary);
      }
    } catch (err: any) {
      setError(err.message || '链接分析失败');
    } finally {
      setLoading(false);
    }
  }, [linkUrl]);

  // 开始录音
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      setError('无法访问麦克风，请检查权限设置');
    }
  }, []);

  // 停止录音
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  // 上传并识别音频
  const handleASR = useCallback(async () => {
    if (!audioBlob) {
      setError('请先录音');
      return;
    }

    setLoading(true);
    setError(null);
    setAsrResult(null);

    try {
      // 先上传音频
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');

      const token = localStorage.getItem('auth_token');
      const uploadResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/upload/audio`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const uploadResult = await uploadResponse.json();
      if (uploadResult.h?.c !== 0) {
        throw new Error(uploadResult.h?.e || '上传失败');
      }

      // 调用 ASR API
      const asrResult = await apiClient.post<ASRResult>('/ai/asr', {
        attachment_id: uploadResult.c.id,
      });

      setAsrResult(asrResult.text);
    } catch (err: any) {
      setError(err.message || '语音识别失败');
    } finally {
      setLoading(false);
    }
  }, [audioBlob]);

  // 插入到编辑器
  const handleInsert = useCallback((text: string) => {
    onInsertText?.(text);
  }, [onInsertText]);

  // 重置状态
  const resetState = useCallback(() => {
    setOcrResult(null);
    setSelectedImage(null);
    setLinkUrl('');
    setLinkPreview(null);
    setLinkSummary(null);
    setAsrResult(null);
    setAudioBlob(null);
    setError(null);
  }, []);

  const tabs = [
    { id: 'ocr', label: '图片识别', icon: '🖼️' },
    { id: 'link', label: '链接摘要', icon: '🔗' },
    { id: 'asr', label: '语音转文字', icon: '🎙️' },
  ] as const;

  return (
    <div className={cn('bg-white rounded-2xl shadow-lg border border-[#e8e8e8]', className)}>
      {/* 标签栏 */}
      <div className="flex border-b border-[#e8e8e8]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveType(activeType === tab.id ? null : tab.id);
              resetState();
            }}
            className={cn(
              'flex-1 py-3 px-4 text-[13px] font-medium transition-all',
              activeType === tab.id
                ? 'text-[#111418] border-b-2 border-[#111418] bg-[#f8f8f8]'
                : 'text-[#8a8f99] hover:text-[#5a5f6b] hover:bg-[#fafafa]'
            )}
          >
            <span className="mr-1.5">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <AnimatePresence mode="wait">
        {activeType && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4">
              {/* OCR 图片识别 */}
              {activeType === 'ocr' && (
                <div className="space-y-4">
                  <input
                    type="file"
                    accept="image/*"
                    ref={imageInputRef}
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  
                  <div
                    onClick={() => imageInputRef.current?.click()}
                    className="border-2 border-dashed border-[#e5e6ea] rounded-xl p-6 text-center cursor-pointer hover:border-[#111418] hover:bg-[#fafafa] transition-all"
                  >
                    {selectedImage ? (
                      <img
                        src={selectedImage}
                        alt="Selected"
                        className="max-h-48 mx-auto rounded-lg"
                      />
                    ) : (
                      <>
                        <div className="text-4xl mb-2">📷</div>
                        <p className="text-[14px] text-[#5a5f6b]">
                          点击选择图片或拖拽到此处
                        </p>
                        <p className="text-[12px] text-[#8a8f99] mt-1">
                          支持 JPG、PNG、GIF 格式
                        </p>
                      </>
                    )}
                  </div>

                  {ocrResult && (
                    <div className="bg-[#f8f8f8] rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[12px] text-[#8a8f99]">识别结果</span>
                        <button
                          onClick={() => handleInsert(ocrResult)}
                          className="text-[12px] text-[#3b82f6] hover:underline"
                        >
                          插入到笔记
                        </button>
                      </div>
                      <p className="text-[14px] text-[#333] whitespace-pre-wrap">
                        {ocrResult}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 链接摘要 */}
              {activeType === 'link' && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="输入链接地址..."
                      className="flex-1 px-4 py-2.5 border border-[#e5e6ea] rounded-xl text-[14px] focus:outline-none focus:border-[#111418]"
                      onKeyDown={(e) => e.key === 'Enter' && handleLinkAnalysis()}
                    />
                    <button
                      onClick={handleLinkAnalysis}
                      disabled={loading}
                      className="px-4 py-2.5 bg-[#111418] text-white rounded-xl text-[14px] font-medium hover:bg-[#333] disabled:opacity-50 transition-colors"
                    >
                      {loading ? '分析中...' : '分析'}
                    </button>
                  </div>

                  {linkPreview && (
                    <div className="bg-[#f8f8f8] rounded-xl p-4 space-y-3">
                      {linkPreview.image && (
                        <img
                          src={linkPreview.image}
                          alt={linkPreview.title || ''}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex items-center gap-2">
                        {linkPreview.favicon && (
                          <img
                            src={linkPreview.favicon}
                            alt=""
                            className="w-4 h-4"
                          />
                        )}
                        <span className="text-[12px] text-[#8a8f99]">
                          {linkPreview.site_name}
                        </span>
                      </div>
                      <h4 className="text-[15px] font-medium text-[#111418]">
                        {linkPreview.title}
                      </h4>
                      {linkPreview.description && (
                        <p className="text-[13px] text-[#5a5f6b] line-clamp-2">
                          {linkPreview.description}
                        </p>
                      )}
                      
                      {linkSummary && (
                        <div className="pt-3 border-t border-[#e5e6ea]">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[12px] text-[#8a8f99]">AI 摘要</span>
                            <button
                              onClick={() => handleInsert(`[${linkPreview.title}](${linkUrl})\n\n${linkSummary}`)}
                              className="text-[12px] text-[#3b82f6] hover:underline"
                            >
                              插入到笔记
                            </button>
                          </div>
                          <p className="text-[14px] text-[#333]">{linkSummary}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 语音转文字 */}
              {activeType === 'asr' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-4">
                    {!isRecording && !audioBlob && (
                      <button
                        onClick={startRecording}
                        className="flex items-center gap-2 px-6 py-3 bg-[#ef4444] text-white rounded-full text-[14px] font-medium hover:bg-[#dc2626] transition-colors"
                      >
                        <span className="w-3 h-3 bg-white rounded-full animate-pulse" />
                        开始录音
                      </button>
                    )}
                    
                    {isRecording && (
                      <button
                        onClick={stopRecording}
                        className="flex items-center gap-2 px-6 py-3 bg-[#111418] text-white rounded-full text-[14px] font-medium hover:bg-[#333] transition-colors"
                      >
                        <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        停止录音
                      </button>
                    )}
                    
                    {audioBlob && !isRecording && (
                      <div className="flex gap-2">
                        <button
                          onClick={startRecording}
                          className="px-4 py-2.5 border border-[#e5e6ea] text-[#5a5f6b] rounded-xl text-[14px] hover:bg-[#f5f5f5] transition-colors"
                        >
                          重新录制
                        </button>
                        <button
                          onClick={handleASR}
                          disabled={loading}
                          className="px-6 py-2.5 bg-[#111418] text-white rounded-xl text-[14px] font-medium hover:bg-[#333] disabled:opacity-50 transition-colors"
                        >
                          {loading ? '识别中...' : '开始识别'}
                        </button>
                      </div>
                    )}
                  </div>

                  {audioBlob && (
                    <div className="flex justify-center">
                      <audio
                        controls
                        src={URL.createObjectURL(audioBlob)}
                        className="w-full max-w-sm"
                      />
                    </div>
                  )}

                  {asrResult && (
                    <div className="bg-[#f8f8f8] rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[12px] text-[#8a8f99]">识别结果</span>
                        <button
                          onClick={() => handleInsert(asrResult)}
                          className="text-[12px] text-[#3b82f6] hover:underline"
                        >
                          插入到笔记
                        </button>
                      </div>
                      <p className="text-[14px] text-[#333] whitespace-pre-wrap">
                        {asrResult}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 加载状态 */}
              {loading && (
                <div className="flex items-center justify-center py-4">
                  <div className="w-5 h-5 border-2 border-[#111418] border-t-transparent rounded-full animate-spin" />
                  <span className="ml-2 text-[14px] text-[#5a5f6b]">处理中...</span>
                </div>
              )}

              {/* 错误提示 */}
              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-[13px]">
                  {error}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
