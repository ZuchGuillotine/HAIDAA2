import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { useSpeech } from "@/hooks/use-speech";

interface SpeechControlsProps {
  onTranscriptChange?: (transcript: string) => void;
}

export function SpeechControls({ onTranscriptChange }: SpeechControlsProps) {
  const {
    isListening,
    isSpeaking,
    transcript,
    startListening,
    stopListening,
    cancelSpeech,
    setTranscript,
  } = useSpeech();

  const handleTranscriptChange = (newTranscript: string) => {
    setTranscript(newTranscript);
    if (onTranscriptChange) {
      onTranscriptChange(newTranscript);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Button
        variant={isListening ? "destructive" : "default"}
        size="icon"
        onClick={isListening ? stopListening : startListening}
      >
        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      </Button>

      <Button
        variant={isSpeaking ? "destructive" : "default"}
        size="icon"
        onClick={cancelSpeech}
        disabled={!isSpeaking}
      >
        {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </Button>

      {transcript && (
        <div className="flex-1">
          <textarea
            className="w-full min-h-[100px] p-2 rounded border"
            value={transcript}
            onChange={(e) => handleTranscriptChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
