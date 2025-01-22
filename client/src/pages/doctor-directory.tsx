import { useUser } from "@/hooks/use-user";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FlaskConical } from "lucide-react";
import { Link } from "wouter";

export default function DoctorDirectory() {
  const { user, logout } = useUser();

  if (!user || user.role !== "doctor") {
    return null;
  }

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Medical Diagnostic Platform</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Dr. {user.username}</span>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/patients">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-6 w-6" />
                  Patient Management
                </CardTitle>
                <CardDescription>
                  Access and manage your patient records, diagnostics, and collaboration sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  View patient profiles, medical history, and diagnostic reports. Collaborate with other healthcare professionals in real-time.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/sandbox">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FlaskConical className="h-6 w-6" />
                  Training Sandbox
                </CardTitle>
                <CardDescription>
                  Practice and familiarize yourself with the platform using mock patient data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Explore platform features with sample cases, test diagnostic tools, and practice collaborative workflows in a safe environment.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}