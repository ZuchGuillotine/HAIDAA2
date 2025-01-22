import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Authorization } from "../../../db/schema";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { Link } from "wouter";

export default function AuthorizationsPage() {
  const { user } = useUser();
  const { toast } = useToast();

  const { data: authorizations, isLoading } = useQuery<Authorization[]>({
    queryKey: ["/api/authorizations"],
    enabled: !!user && user.role === "patient",
  });

  if (!user || user.role !== "patient") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Authorizations</h1>
            <Link href="/">
              <Button variant="outline">Back to Profile</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="flex justify-end">
            <Link href="/authorizations/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Authorization
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div>Loading authorizations...</div>
          ) : !authorizations?.length ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <h2 className="text-xl font-semibold">No Authorizations Yet</h2>
                  <p className="text-gray-600 max-w-md mx-auto">
                    You haven't signed any authorizations yet. Click the button above to add your first authorization.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {authorizations.map((auth) => (
                <Card key={auth.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{auth.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Signed on {format(new Date(auth.signedAt!), "MMMM d, yyyy")}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}