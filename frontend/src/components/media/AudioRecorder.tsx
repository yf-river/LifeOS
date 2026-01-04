'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  MicIcon,
  StopCircleIcon,
  PlayIcon,
  PauseIcon,
  UploadIcon,
  Loader2Icon,
  SparklesIcon,
  TrashIcon,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface AudioRecorderProps {
  noteId?: string;
  onUpload: (url: string, attachmentId: string) => void;
  onASR?: (text: string) => void;
}

export function AudioRecorder({ noteId, onUpload, onASR }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [asrLoading, setAsrLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 开始录音
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      // 计时器
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch {
      setError('无法访问麦克风');
    }
  };

  // 停止录音
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  // 播放/暂停
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // 上传音频
  const handleUpload = async () => {
    if (!audioBlob) return;
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');
      if (noteId) formData.append('note_id', noteId);

      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE_URL}/upload/audio`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await res.json();
      if (data.h?.c === 0) {
        const { url, id } = data.c;
        setUploadedUrl(url);
        onUpload(url, id);
      } else {
        setError(data.h?.e || '上传失败');
      }
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  // 语音识别
  const handleASR = async () => {
    if (!uploadedUrl || !onASR) return;
    setAsrLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE_URL}/ai/asr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ audio_url: uploadedUrl }),
      });

      const data = await res.json();
      if (data.h?.c === 0) {
        onASR(data.c.text);
      } else {
        setError('语音识别失败: ' + (data.h?.e || ''));
      }
    } catch {
      setError('语音识别失败');
    } finally {
      setAsrLoading(false);
    }
  };

  // 清除
  const handleClear = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setUploadedUrl(null);
    setDuration(0);
    setIsPlaying(false);
  };

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 清理
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  return (
    <div className="space-y-4">
      {/* 录音控制 */}
      <div className="flex items-center justify-center gap-4">
        {!audioBlob ? (
          <>
            <Button
              variant={isRecording ? 'destructive' : 'default'}
              size="lg"
              className="rounded-full w-16 h-16"
              onClick={isRecording ? stopRecording : startRecording}
            >
              {isRecording ? (
                <StopCircleIcon className="h-8 w-8" />
              ) : (
                <MicIcon className="h-8 w-8" />
              )}
            </Button>
            {isRecording && (
              <div className="text-lg font-mono">{formatTime(duration)}</div>
            )}
          </>
        ) : (
          <>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full w-12 h-12"
              onClick={togglePlay}
            >
              {isPlaying ? (
                <PauseIcon className="h-6 w-6" />
              ) : (
                <PlayIcon className="h-6 w-6" />
              )}
            </Button>
            <div className="text-lg font-mono">{formatTime(duration)}</div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
            >
              <TrashIcon className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>

      {/* 录音波形占位 */}
      {isRecording && (
        <div className="flex items-center justify-center gap-1 h-8">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-primary rounded-full animate-pulse"
              style={{
                height: `${Math.random() * 100}%`,
                animationDelay: `${i * 50}ms`,
              }}
            />
          ))}
        </div>
      )}

      {/* 音频播放器 */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}

      {/* 上传按钮 */}
      {audioBlob && !uploadedUrl && (
        <Button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full"
        >
          {uploading ? (
            <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <UploadIcon className="h-4 w-4 mr-2" />
          )}
          上传录音
        </Button>
      )}

      {/* ASR 按钮 */}
      {uploadedUrl && onASR && (
        <Button
          variant="outline"
          onClick={handleASR}
          disabled={asrLoading}
          className="w-full"
        >
          {asrLoading ? (
            <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <SparklesIcon className="h-4 w-4 mr-2" />
          )}
          语音转文字 (ASR)
        </Button>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 rounded-md p-3">
          {error}
        </div>
      )}
    </div>
  );
}
