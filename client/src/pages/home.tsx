import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { PatientProfile } from "@/components/PatientProfile";
import { CollaborationPanel } from "@/components/CollaborationPanel";
import { useQuery } from "@tanstack/react-query";
import { Patient } from "../../../db/schema";
import { useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { UserCircle, FileText } from "lucide-react";
import { Footer } from "@/components/Footer";

export default function Home() {
  const { user, logout } = useUser();
  const params = useParams();
  const patientId = params.id ? parseInt(params.id) : undefined;

  const { data: patient, isLoading } = useQuery<Patient>({
    queryKey: [`/api/patients/${user?.id}`],
    enabled: !!user && user.role === "patient",
  });

  if (!user) return null;

  // For patient users, show their own profile
  if (user.role === "patient") {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <header className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Medical Profile</h1>
              <div className="flex items-center gap-4">
                <span>{user.username}</span>
                <Button variant="outline" onClick={() => logout()}>
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isLoading ? (
            <div>Loading profile...</div>
          ) : !patient || (!patient.fullName && !patient.dateOfBirth) ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <UserCircle className="w-16 h-16 mx-auto text-gray-400" />
                  <h2 className="text-xl font-semibold">Complete Your Profile</h2>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Please take a moment to complete your profile information. This will help us provide you with better medical care.
                  </p>
                  <Link href="/profile/edit">
                    <Button className="mt-4">
                      Update Profile Information
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              <PatientProfile patientId={user.id} />
              <div className="space-y-4">
                <Link href="/profile/edit">
                  <Button variant="outline" className="w-full">
                    Edit Profile
                  </Button>
                </Link>
                <Link href="/authorizations">
                  <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                    <FileText className="h-4 w-4" />
                    View Authorizations
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </main>
        <Footer />
      </div>
    );
  }

  // For doctor users, show the specific patient's details
  if (!patientId) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Patient Details</h1>
            <div className="flex items-center gap-4">
              <span>Dr. {user.username}</span>
              <Button variant="outline" onClick={() => logout()}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div>Loading patient details...</div>
        ) : patient ? (
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <PatientProfile patientId={patient.id} />
              <div>
                <Link href={`/diagnostic/${patient.id}`}>
                  <Button
                    className="w-full h-full text-lg font-semibold"
                    variant="outline"
                  >
                    Diagnostic Assistant
                  </Button>
                </Link>
              </div>
            </div>
            <CollaborationPanel patientId={patient.id} />
          </div>
        ) : (
          <div>Patient not found</div>
        )}
      </main>
      <Footer />
    </div>
  );
}