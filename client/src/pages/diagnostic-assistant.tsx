import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SpeechControls } from "@/components/SpeechControls";
import { useSpeech } from "@/hooks/use-speech";
import { useMutation } from "@tanstack/react-query";
import { DiagnosticResponse } from "../../../server/openai";
import { useToast } from "@/hooks/use-toast";
import { useParams, Link } from "wouter";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Message {
  type: 'user' | 'assistant';
  content: string;
  diagnosticData?: DiagnosticResponse;
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.67) return "bg-green-100 text-green-800 border-green-200";
  if (confidence >= 0.34) return "bg-yellow-100 text-yellow-800 border-yellow-200";
  return "bg-red-100 text-red-800 border-red-200";
}

function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.67) return "High Confidence";
  if (confidence >= 0.34) return "Medium Confidence";
  return "Low Confidence";
}

export default function DiagnosticAssistantPage() {
  const { user } = useUser();
  const params = useParams();
  const patientId = params.id ? parseInt(params.id) : undefined;
  const [context, setContext] = useState("");
  const { speak } = useSpeech();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);

  const diagnosticMutation = useMutation<DiagnosticResponse, Error, string>({
    mutationFn: async (context) => {
      try {
        const response = await fetch(`/api/diagnostic/${patientId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ context }),
          credentials: 'include'
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Failed to get diagnostic insights');
        }

        return response.json();
      } catch (error) {
        console.error("Diagnostic error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      setMessages(prev => [
        ...prev,
        {
          type: 'user',
          content: context
        },
        {
          type: 'assistant',
          content: data.diagnosis,
          diagnosticData: data
        }
      ]);
      setContext("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = async () => {
    if (!context.trim()) return;
    await diagnosticMutation.mutateAsync(context);
  };

  const handleSpeak = (text: string) => {
    speak(text);
  };

  if (!user || !patientId) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/patients/${patientId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Diagnostic Assistant</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md h-[calc(100vh-12rem)]">
          <div className="h-full flex flex-col">
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6">
                <TooltipProvider>
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={cn(
                        "max-w-[80%] space-y-2",
                        message.type === 'user' ? 'ml-auto' : 'mr-auto'
                      )}
                    >
                      <div
                        className={cn(
                          "rounded-lg p-4",
                          message.type === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}
                      >
                        {message.content}
                      </div>

                      {message.diagnosticData && (
                        <div className="space-y-4 bg-muted/50 rounded-lg p-4 border">
                          <div className="flex items-center gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className={cn(
                                  "px-3 py-1 rounded-full text-sm font-medium border cursor-help",
                                  getConfidenceColor(message.diagnosticData.confidence)
                                )}>
                                  {getConfidenceLabel(message.diagnosticData.confidence)}: {(message.diagnosticData.confidence * 100).toFixed(1)}%
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Confidence score indicates the AI's certainty level in the diagnosis</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>

                          <div>
                            <div className="text-sm font-medium mb-2">Suggested Tests:</div>
                            <ul className="list-disc pl-5 text-sm space-y-1">
                              {message.diagnosticData.suggestedTests.map((test, i) => (
                                <li key={i}>{test}</li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <div className="text-sm font-medium mb-2">Treatment Options:</div>
                            <ul className="list-disc pl-5 text-sm space-y-1">
                              {message.diagnosticData.treatmentOptions.map((option, i) => (
                                <li key={i}>{option}</li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <div className="text-sm font-medium mb-2">Follow-up Questions:</div>
                            <ul className="list-disc pl-5 text-sm space-y-1">
                              {message.diagnosticData.followUpQuestions.map((question, i) => (
                                <li key={i}>{question}</li>
                              ))}
                            </ul>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSpeak(message.content)}
                            className="mt-2"
                          >
                            Read Aloud
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </TooltipProvider>
              </div>
            </ScrollArea>

            <div className="p-4 border-t bg-white">
              <div className="space-y-4">
                <Textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Enter patient symptoms and observations..."
                  className="min-h-[100px] bg-white"
                />

                <div className="flex items-center gap-4">
                  <SpeechControls onTranscriptChange={setContext} />
                  <Button
                    onClick={handleSubmit}
                    disabled={!context.trim() || diagnosticMutation.isPending}
                    className="ml-auto"
                  >
                    {diagnosticMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      "Send"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}