import { useUser } from "@/hooks/use-user";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PatientProfile } from "@/components/PatientProfile";
import { DiagnosticAssistant } from "@/components/DiagnosticAssistant";
import { CollaborationPanel } from "@/components/CollaborationPanel";

// Mock patient data for the sandbox environment
const MOCK_PATIENTS = [
  {
    id: 9001,
    fhirData: {
      name: [{ given: ["John"], family: "Doe" }],
      birthDate: "1985-06-15",
      gender: "male",
      conditions: [
        { code: "I10", display: "Hypertension" },
        { code: "E11", display: "Type 2 Diabetes" }
      ],
      medications: [
        { code: "316077", display: "Lisinopril 10mg" },
        { code: "213169", display: "Metformin 500mg" }
      ]
    }
  },
  {
    id: 9002,
    fhirData: {
      name: [{ given: ["Jane"], family: "Smith" }],
      birthDate: "1992-03-24",
      gender: "female",
      conditions: [
        { code: "J45", display: "Asthma" },
        { code: "M06", display: "Rheumatoid Arthritis" }
      ],
      medications: [
        { code: "351683", display: "Albuterol Inhaler" },
        { code: "197319", display: "Prednisone 5mg" }
      ]
    }
  }
];

export default function SandboxPage() {
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
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">Training Sandbox</h1>
              <span className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-full">
                Practice Environment
              </span>
            </div>
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
        <Card className="mb-6 p-4 bg-blue-50 border-blue-200">
          <p className="text-blue-700">
            This is a training environment with mock patient data. Feel free to explore all features
            and functionalities without affecting real patient records.
          </p>
        </Card>

        <div className="space-y-8">
          {MOCK_PATIENTS.map((patient) => (
            <div key={patient.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="grid md:grid-cols-2 gap-8">
                <PatientProfile 
                  patientId={patient.id} 
                  mockData={patient.fhirData}
                  isSandbox={true}
                />
                <DiagnosticAssistant 
                  patientId={patient.id}
                  mockData={patient.fhirData}
                  isSandbox={true}
                />
              </div>
              <CollaborationPanel 
                patientId={patient.id}
                isSandbox={true}
              />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}