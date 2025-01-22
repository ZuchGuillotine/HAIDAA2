import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Footer } from "@/components/Footer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AuthPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"doctor" | "patient">("patient");
  const { login, register } = useUser();
  const { toast } = useToast();

  const handleSubmit = async (action: "login" | "register") => {
    try {
      const result = await (action === "login" ? login : register)({
        username,
        password,
        role: action === "register" ? role : undefined,
      });

      if (!result.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
        return;
      }

      toast({
        title: "Success",
        description: `Successfully ${action === "login" ? "logged in" : "registered"}`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-grow flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle className="text-center">HAIDAA</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit("login");
                  }}
                  className="space-y-4"
                >
                  <Input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button type="submit" className="w-full">
                    Login
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit("register");
                  }}
                  className="space-y-4"
                >
                  <Input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Select
                    value={role}
                    onValueChange={(value) => setRole(value as "doctor" | "patient")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="doctor">Doctor</SelectItem>
                      <SelectItem value="patient">Patient</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="submit" className="w-full">
                    Register
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}