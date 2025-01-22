import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SpeechControls } from "./SpeechControls";
import { useSpeech } from "@/hooks/use-speech";
import { useMutation } from "@tanstack/react-query";
import { DiagnosticResponse } from "../../../server/openai";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DiagnosticAssistantProps {
  patientId: number;
  mockData?: any;
  isSandbox?: boolean;
}

export function DiagnosticAssistant({ patientId, mockData, isSandbox = false }: DiagnosticAssistantProps) {
  const [context, setContext] = useState("");
  const { speak } = useSpeech();
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

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
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = async () => {
    try {
      await diagnosticMutation.mutateAsync(context);
      setShowResults(true);
    } catch (error) {
      // Error is handled by the mutation's onError
      console.error("Diagnostic error:", error);
    }
  };

  const handleSpeak = (text: string) => {
    speak(text);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Diagnostic Assistant</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Patient Context</label>
          <Textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Enter patient symptoms and observations..."
            className="min-h-[150px] bg-white"
          />
        </div>

        <SpeechControls onTranscriptChange={setContext} />

        <Button
          onClick={handleSubmit}
          disabled={!context || diagnosticMutation.isPending}
          className="w-full"
        >
          {diagnosticMutation.isPending ? "Analyzing..." : "Get Diagnostic Insights"}
        </Button>

        <AlertDialog open={showResults} onOpenChange={setShowResults}>
          <AlertDialogContent className="max-w-3xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Diagnostic Results</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="mt-4 space-y-6">
              {diagnosticMutation.data && (
                <>
                  <div className="space-y-2">
                    <div className="font-medium">Diagnosis</div>
                    <div className="bg-gray-50 p-4 rounded-md">
                      {diagnosticMutation.data.diagnosis}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSpeak(diagnosticMutation.data.diagnosis)}
                      className="mt-2"
                    >
                      Read Aloud
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="font-medium">Confidence Level</div>
                    <div className="bg-gray-50 p-4 rounded-md">
                      {(diagnosticMutation.data.confidence * 100).toFixed(1)}%
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="font-medium">Suggested Tests</div>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <ul className="list-disc pl-5">
                        {diagnosticMutation.data.suggestedTests.map((test, i) => (
                          <li key={i}>{test}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="font-medium">Treatment Options</div>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <ul className="list-disc pl-5">
                        {diagnosticMutation.data.treatmentOptions.map((option, i) => (
                          <li key={i}>{option}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="font-medium">Follow-up Questions</div>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <ul className="list-disc pl-5">
                        {diagnosticMutation.data.followUpQuestions.map((question, i) => (
                          <li key={i}>{question}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </>
              )}
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}