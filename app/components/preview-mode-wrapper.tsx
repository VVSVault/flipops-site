"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Construction, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PreviewModeWrapperProps {
  title: string;
  description: string;
  children: React.ReactNode;
  expectedRelease?: string;
}

export function PreviewModeWrapper({
  title,
  description,
  children,
  expectedRelease = "Q1 2025"
}: PreviewModeWrapperProps) {
  const [showPreview, setShowPreview] = useState(false);

  if (!showPreview) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              <Construction className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-center mb-2">
              {title}
            </CardTitle>
            <Badge variant="secondary" className="mx-auto mb-3">Coming Soon</Badge>
            <CardDescription className="text-center">{description}</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Expected release: {expectedRelease}
            </p>
            <Button onClick={() => setShowPreview(true)} variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              View Preview
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative">
      <Alert className="mb-4 border-amber-500/50 bg-amber-500/10">
        <Sparkles className="h-4 w-4 text-amber-500" />
        <AlertDescription className="flex items-center justify-between">
          <span>
            <strong>Preview Mode:</strong> This feature is coming soon.
            Data shown is for demonstration purposes only.
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowPreview(false)}
          >
            Exit Preview
          </Button>
        </AlertDescription>
      </Alert>
      {children}
    </div>
  );
}
