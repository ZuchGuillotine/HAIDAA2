import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Patient } from "../../../db/schema";
import { useQuery } from "@tanstack/react-query";

interface PatientProfileProps {
  patientId: number;
  mockData?: any;
  isSandbox?: boolean;
}

export function PatientProfile({ patientId, mockData, isSandbox = false }: PatientProfileProps) {
  const { data: patient, isLoading } = useQuery<Patient>({
    queryKey: [`/api/patients/${patientId}`],
    enabled: !isSandbox, // Only fetch from API when not in sandbox mode
  });

  if (isLoading && !isSandbox) {
    return <div>Loading patient profile...</div>;
  }

  if (!patient && !isSandbox) {
    return <div>No patient data available</div>;
  }

  const profileData = isSandbox ? mockData : patient;

  if (!profileData) {
    return <div>No patient data available</div>;
  }

  // Get initials for avatar
  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback>
            {profileData.fullName ? getInitials(profileData.fullName) : 'P'}
          </AvatarFallback>
        </Avatar>
        <div>
          <CardTitle>
            {profileData.fullName || 'Patient'}
          </CardTitle>
          {!isSandbox && (
            <p className="text-sm text-muted-foreground">
              ID: {profileData.keyPair?.slice(0, 8)}...
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div>
          <h3 className="font-medium">Basic Information</h3>
          <div className="text-sm text-muted-foreground space-y-1 mt-2">
            <p>Full Name: {profileData.fullName || 'Not provided'}</p>
            <p>Gender: {profileData.gender || 'Not provided'}</p>
            <p>Date of Birth: {profileData.dateOfBirth || 'Not provided'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}