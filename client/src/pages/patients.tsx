import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Patient } from "../../../db/schema";
import { useLocation } from "wouter";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/hooks/use-user";

interface NewPatientData {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  visitContext: string;
  fhirData?: string;
}

export default function PatientsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [newPatient, setNewPatient] = useState<NewPatientData>({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    visitContext: "",
    fhirData: "",
  });

  const { data: patients, isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
    enabled: user?.role === "doctor",
  });

  const createPatientMutation = useMutation({
    mutationFn: async (patientData: NewPatientData) => {
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patientData),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      setIsCreating(false);
      setNewPatient({
        name: "",
        email: "",
        phone: "",
        dateOfBirth: "",
        visitContext: "",
        fhirData: "",
      });
      toast({
        title: "Success",
        description: "Patient created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPatientMutation.mutateAsync(newPatient);
    } catch (error) {
      console.error("Failed to create patient:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Patient Management</h1>
          {user?.role === "doctor" && (
            <Button onClick={() => setIsCreating(true)}>Add New Patient</Button>
          )}
        </div>

        {isCreating && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Patient</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Full Name
                  </label>
                  <Input
                    value={newPatient.name}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, name: e.target.value })
                    }
                    placeholder="Enter patient's full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={newPatient.email}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, email: e.target.value })
                    }
                    placeholder="Enter patient's email"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    value={newPatient.phone}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, phone: e.target.value })
                    }
                    placeholder="Enter patient's phone number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Date of Birth
                  </label>
                  <Input
                    type="date"
                    value={newPatient.dateOfBirth}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, dateOfBirth: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Initial Visit Context
                  </label>
                  <Textarea
                    value={newPatient.visitContext}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, visitContext: e.target.value })
                    }
                    placeholder="Enter details about the patient's current visit"
                    className="h-24"
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full"
                >
                  {showAdvanced ? "Hide" : "Show"} Advanced Options
                </Button>

                {showAdvanced && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      FHIR Data (Optional JSON)
                    </label>
                    <Textarea
                      value={newPatient.fhirData}
                      onChange={(e) =>
                        setNewPatient({ ...newPatient, fhirData: e.target.value })
                      }
                      placeholder="Paste FHIR JSON data here (optional)"
                      className="h-48"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button type="submit" disabled={createPatientMutation.isPending}>
                    {createPatientMutation.isPending ? "Creating..." : "Create Patient"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreating(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div>Loading patients...</div>
        ) : (
          <div className="grid gap-4">
            {patients?.map((patient) => {
              const fhirData = patient.fhirData as Record<string, any>;
              const name = fhirData?.name?.[0] || {};
              const displayName = `${name.given?.join(" ") || "Unknown"} ${name.family || ""}`;

              return (
                <Card
                  key={patient.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setLocation(`/patients/${patient.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{displayName}</h3>
                        <p className="text-sm text-muted-foreground">
                          ID: {patient.keyPair.slice(0, 8)}...
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}