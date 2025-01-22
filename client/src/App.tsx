import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import { useUser } from "@/hooks/use-user";
import { Loader2 } from "lucide-react";
import PatientsPage from "@/pages/patients";
import DoctorDirectory from "@/pages/doctor-directory";
import Home from "@/pages/home";
import SandboxPage from "@/pages/sandbox";
import DiagnosticAssistantPage from "@/pages/diagnostic-assistant";
import ProfileEdit from "@/pages/profile-edit";
import AuthorizationsPage from "@/pages/authorizations";
import TermsPage from "@/pages/terms";
import PrivacyPage from "@/pages/privacy";
import ContactPage from "@/pages/contact";

function Router() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  // Public routes that don't require authentication
  if (!user) {
    return (
      <Switch>
        <Route path="/" component={AuthPage} />
        <Route path="/terms" component={TermsPage} />
        <Route path="/privacy" component={PrivacyPage} />
        <Route path="/contact" component={ContactPage} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <Switch>
      {/* Doctor-specific routes */}
      {user.role === "doctor" && (
        <>
          <Route path="/" component={DoctorDirectory} />
          <Route path="/patients" component={PatientsPage} />
          <Route path="/patients/:id" component={Home} />
          <Route path="/diagnostic/:id" component={DiagnosticAssistantPage} />
          <Route path="/sandbox" component={SandboxPage} />
        </>
      )}

      {/* Patient-specific routes */}
      {user.role === "patient" && (
        <>
          <Route path="/" component={Home} />
          <Route path="/profile/edit" component={ProfileEdit} />
          <Route path="/authorizations" component={AuthorizationsPage} />
        </>
      )}

      {/* Common routes */}
      <Route path="/terms" component={TermsPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/contact" component={ContactPage} />

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;