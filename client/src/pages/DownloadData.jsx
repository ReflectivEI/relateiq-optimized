import React from "react";
import { Download, FileJson, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { tonyData } from "@/lib/exportData/tonyQuestionnaire";
import { drewData } from "@/lib/exportData/drewQuestionnaire";

function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DownloadData() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-xl mx-auto space-y-6">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Download Questionnaire Data</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Download the full questionnaire responses as JSON files, ready for import.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileJson className="w-5 h-5 text-primary" />
              Tony's Responses
            </CardTitle>
            <CardDescription>{tonyData.length} questions answered</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => downloadJSON(tonyData, "tony_questionnaire.json")} className="w-full gap-2">
              <Download className="w-4 h-4" /> Download tony_questionnaire.json
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileJson className="w-5 h-5 text-primary" />
              Drew's Responses
            </CardTitle>
            <CardDescription>{drewData.length} questions answered</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => downloadJSON(drewData, "drew_questionnaire.json")} className="w-full gap-2">
              <Download className="w-4 h-4" /> Download drew_questionnaire.json
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}