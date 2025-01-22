import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Footer } from "@/components/Footer";
import { Link } from "wouter";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Terms of Service</h1>
              <Link href="/">
                <Button variant="outline">Back to Home</Button>
              </Link>
            </div>
            <div className="prose">
              <p>Terms of Service content will be added here.</p>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
