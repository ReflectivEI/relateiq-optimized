/**
 * VoiceRecorder.jsx
 * Voice-to-text recording with transcription, emotion tagging, and summarization
 */

import React, { useState, useRef } from "react";
import { Mic, Square, Loader2, Copy, Trash2, Info, Check, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/api/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function VoiceRecorder({
  onTranscribed,
  disabled = false,
  instructions = null,
  saveDestinationLabel = "the current answer field",
}) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [editableTranscript, setEditableTranscript] = useState("");
  const [emotion, setEmotion] = useState("");
  const [duration, setDuration] = useState(0);
  const [saved, setSaved] = useState(false);
  const [topics, setTopics] = useState([]);
  const [summary, setSummary] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const speechRecognitionRef = useRef(null);
  const liveTranscriptRef = useRef("");

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setRecording(true);
      setDuration(0);
      liveTranscriptRef.current = "";

      const SpeechRecognition =
        typeof window !== "undefined"
          ? window.SpeechRecognition || window.webkitSpeechRecognition
          : null;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";
        recognition.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map((result) => result[0]?.transcript || "")
            .join(" ")
            .trim();
          liveTranscriptRef.current = transcript;
        };
        recognition.onerror = () => {
          speechRecognitionRef.current = null;
        };
        recognition.start();
        speechRecognitionRef.current = recognition;
      }

      // Timer
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch (err) {
      toast.error("Microphone access denied");
    }
  };

  // Stop recording and process
  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return;

    clearInterval(timerRef.current);
    const recorder = mediaRecorderRef.current;
    setRecording(false);
    setProcessing(true);
    speechRecognitionRef.current?.stop();

    try {
      const audioBlob = await new Promise((resolve) => {
        const handleStop = () => {
          recorder.removeEventListener("stop", handleStop);
          resolve(new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" }));
        };
        recorder.addEventListener("stop", handleStop, { once: true });
        recorder.stop();
      });

      const transcriptSeed = liveTranscriptRef.current.trim();
      if (!transcriptSeed) {
        toast.error("No speech was detected. Please try again.");
        setProcessing(false);
        return;
      }

      let uploaded = null;
      // TODO: Re-enable raw audio storage once the file upload endpoint is updated to
      // accept the recorder payload reliably across browsers. For now, keep the
      // transcript review/save flow stable and store the edited transcript instead.
      if (!(audioBlob instanceof Blob) || audioBlob.size <= 0) {
        uploaded = null;
      }

      const result = await api.integrations.Core.InvokeLLM({
        prompt: `You are analyzing a transcribed voice memo about a daily relationship reflection.
        
Your tasks:
1. Clean up this transcript lightly for readability without changing meaning
2. Identify the primary emotion/tone (vulnerable, thoughtful, grateful, hopeful, reflective, honest)
3. Extract 1-2 key topics (e.g. communication, intimacy, conflict, growth, gratitude, memories, dreams)
4. Provide a brief structured summary

Return ONLY a JSON object (no markdown, no extra text):
{
  "transcript": "cleaned transcript text",
  "emotion": "emotion word",
  "topics": ["topic1", "topic2"],
  "summary": "1-2 sentence summary"
}

TRANSCRIPT:
${transcriptSeed}`,
        model: "llama-3.3-70b-versatile",
        response_json_schema: {
          type: "object",
          properties: {
            transcript: { type: "string" },
            emotion: { type: "string" },
            topics: { type: "array", items: { type: "string" } },
            summary: { type: "string" },
          },
        },
      });

      if (result && result.transcript) {
        setTranscript(result.transcript);
        setEditableTranscript(result.transcript);
        setEmotion(result.emotion || "");
        setTopics(result.topics || []);
        setSummary(result.summary || "");
        setFileUrl(uploaded?.file_url || "");
        setSaved(false);
        toast.success("Voice memo transcribed. Review it, make edits if needed, then save.");
      } else {
        toast.error("Transcription failed");
      }
    } catch (err) {
      toast.error("Processing error");
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const clearRecording = () => {
    setTranscript("");
    setEditableTranscript("");
    setEmotion("");
    setDuration(0);
    setTopics([]);
    setSummary("");
    setFileUrl("");
    setSaved(false);
    audioChunksRef.current = [];
    liveTranscriptRef.current = "";
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(editableTranscript || transcript);
    toast.success("Transcript copied");
  };

  const handleSaveTranscript = () => {
    const finalText = (editableTranscript || transcript).trim();
    if (!finalText) {
      toast.error("There is no transcript to save yet.");
      return;
    }

    onTranscribed?.({
      text: finalText,
      emotion,
      topics,
      summary,
      file_url: fileUrl,
    });
    setSaved(true);
    toast.success(`Your answer has been saved to ${saveDestinationLabel}.`);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-3">
      {/* Recording controls */}
      {!transcript ? (
        <div className="space-y-3">
          {recording ? (
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="p-4 rounded-xl bg-red-50 border-2 border-red-200 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-3 h-3 rounded-full bg-red-500"
                />
                <div>
                  <p className="text-sm font-semibold text-red-900">Recording...</p>
                  <p className="text-xs text-red-700">{formatDuration(duration)}</p>
                </div>
              </div>
              <Button
                onClick={stopRecording}
                size="sm"
                variant="destructive"
                className="gap-1.5"
              >
                <Square className="w-3 h-3" />
                Stop
              </Button>
            </motion.div>
          ) : (
            <Button
              onClick={startRecording}
              disabled={disabled || processing}
              className="w-full gap-2 h-10"
              variant="outline"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Transcribing...
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  Record Voice Memo
                </>
              )}
            </Button>
          )}

          {instructions && (
            <div className="rounded-xl border border-[#0e6f72]/20 bg-[#f3fbfb] dark:border-primary/30 dark:bg-card p-3">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-[#0e6f72]" />
                <p className="text-sm font-semibold text-foreground">{instructions.title}</p>
              </div>
              <ul className="mt-2 space-y-1.5 pl-5 text-xs leading-5 text-muted-foreground">
                {instructions.bullets?.map((bullet) => (
                  <li key={bullet} className="list-disc">{bullet}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}

      {/* Transcript review and save */}
      <AnimatePresence>
        {transcript && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 rounded-[1.25rem] border-2 border-blue-200 bg-blue-50 dark:border-blue-800/70 dark:bg-blue-950/25 p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-900">
                  <span className="inline-flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    Transcript Ready
                  </span>
                </p>
                <p className="mt-1 text-xs leading-5 text-blue-800/80 dark:text-blue-200/90">
                  Review the transcript, make edits if needed, then save it to {saveDestinationLabel}.
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={copyToClipboard}
                  className="p-1.5 hover:bg-blue-100 rounded transition-colors"
                  title="Copy"
                >
                  <Copy className="w-3.5 h-3.5 text-blue-700" />
                </button>
                <button
                  onClick={clearRecording}
                  className="p-1.5 hover:bg-blue-100 rounded transition-colors"
                  title="Clear"
                >
                  <Trash2 className="delete-action-icon w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-blue-900">
                Edit Transcript
              </label>
              <Textarea
                value={editableTranscript}
                onChange={(event) => {
                  setEditableTranscript(event.target.value);
                  setSaved(false);
                }}
                className="min-h-[140px] rounded-[1rem] border-blue-200 bg-white px-4 py-3 text-sm leading-6 text-blue-950 dark:border-blue-800/70 dark:bg-background dark:text-foreground"
              />
            </div>

            {emotion && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-medium text-blue-800">Emotion:</span>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 capitalize text-blue-800">
                  {emotion}
                </span>
                {topics.map((topic) => (
                  <span key={topic} className="rounded-full bg-white px-2 py-0.5 text-blue-800 dark:bg-background dark:text-blue-300">
                    {topic}
                  </span>
                ))}
              </div>
            )}

            {summary ? (
              <p className="rounded-xl border border-blue-200/80 bg-white/80 px-3 py-2 text-xs leading-5 text-blue-900 dark:border-blue-800/70 dark:bg-background/80 dark:text-blue-200">
                <span className="font-semibold">Summary:</span> {summary}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button onClick={handleSaveTranscript} className="gap-2">
                <Check className="h-4 w-4" />
                Save Transcript
              </Button>
              {saved ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-[#0e6f72]/20 bg-white px-3 py-2 text-xs font-medium text-[#0e6f72] dark:border-primary/30 dark:bg-background dark:text-primary">
                  <Check className="h-3.5 w-3.5" />
                  Saved to {saveDestinationLabel}
                </span>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
