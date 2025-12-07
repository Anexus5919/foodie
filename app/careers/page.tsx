"use client";

import { Button } from "../../components/ui/button";
import { Mail, Briefcase } from "lucide-react";

export default function CareersPage() {
  const handleDropCV = () => {
    window.location.href = "mailto:careers@foodie.com?subject=Job Application - [Your Name]";
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-4xl font-bold mb-6">Careers at Foodie</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Join us in our mission to change the way people eat. We are always looking for talented individuals to join our growing team.
      </p>
      
      <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-muted-foreground/20 rounded-xl bg-muted/10">
        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Briefcase className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-2xl font-semibold mb-2">No Openings Currently</h3>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          We don&rsquo;t have any active listings at the moment, but we are always looking for great talent.
        </p>
        
        <Button onClick={handleDropCV} className="gap-2">
          <Mail className="h-4 w-4" />
          Drop your CV
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Send your resume to careers@foodie.com
        </p>
      </div>
    </div>
  );
}