import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { CollaborationSession, CollaborationMessage } from "../../../db/schema";

interface CollaborationPanelProps {
  patientId: number;
}

export function CollaborationPanel({ patientId }: CollaborationPanelProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [activeSession, setActiveSession] = useState<CollaborationSession | null>(null);
  const [messages, setMessages] = useState<CollaborationMessage[]>([]);

  const { data: sessions, refetch: refetchSessions } = useQuery<CollaborationSession[]>({
    queryKey: [`/api/collaboration/sessions/${patientId}`],
    enabled: user?.role === "doctor",
  });

  const createSessionMutation = useMutation({
    mutationFn: async (title: string) => {
      const response = await fetch("/api/collaboration/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, title }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      refetchSessions();
      toast({
        title: "Success",
        description: "Collaboration session created",
      });
    },
  });

  useEffect(() => {
    if (!activeSession || !user) return;

    // Create WebSocket connection
    const wsUrl = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${
      window.location.host
    }/ws`;

    const socket = new WebSocket(wsUrl);
    let pingInterval: NodeJS.Timeout;

    socket.onopen = () => {
      // Send session join message
      socket.send(
        JSON.stringify({
          type: "session",
          sessionId: activeSession.id,
          userId: user.id,
        })
      );

      // Setup ping interval
      pingInterval = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: "ping" }));
        }
      }, 25000);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error,
        });
        return;
      }

      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Failed to connect to collaboration session",
      });
    };

    setWs(socket);

    return () => {
      clearInterval(pingInterval);
      socket.close();
    };
  }, [activeSession, user, toast]);

  const sendMessage = () => {
    if (!ws || !message.trim() || !activeSession) return;

    ws.send(
      JSON.stringify({
        type: "chat",
        content: message,
      })
    );

    setMessage("");
  };

  const handleCreateSession = async () => {
    const title = prompt("Enter session title");
    if (!title) return;

    await createSessionMutation.mutateAsync(title);
  };

  const handleJoinSession = async (session: CollaborationSession) => {
    try {
      const response = await fetch(
        `/api/collaboration/messages/${session.id}`,
        { credentials: "include" }
      );
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const messages = await response.json();
      setMessages(messages);
      setActiveSession(session);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Collaboration</CardTitle>
      </CardHeader>
      <CardContent>
        {!activeSession ? (
          <div className="space-y-4">
            <Button onClick={handleCreateSession}>Create New Session</Button>
            {sessions?.map((session) => (
              <div
                key={session.id}
                className="p-4 border rounded flex justify-between items-center"
              >
                <div>
                  <h3 className="font-medium">{session.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    Created:{" "}
                    {new Date(session.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Button onClick={() => handleJoinSession(session)}>
                  Join Session
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">{activeSession.title}</h3>
              <Button
                variant="outline"
                onClick={() => setActiveSession(null)}
              >
                Leave Session
              </Button>
            </div>

            <ScrollArea className="h-[400px] border rounded p-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-4 ${
                    msg.senderId === user?.id
                      ? "text-right"
                      : "text-left"
                  }`}
                >
                  <div
                    className={`inline-block p-3 rounded-lg ${
                      msg.senderId === user?.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </ScrollArea>

            <div className="flex gap-2">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1"
              />
              <Button onClick={sendMessage}>Send</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}