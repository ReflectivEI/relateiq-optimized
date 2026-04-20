import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchRelateIQState, uploadQuestionnaire } from "@/lib/relateiq-api";

type UploadTarget = "Tony" | "Drew";

export default function QuestionnairePage() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["/api/state"],
    queryFn: fetchRelateIQState,
  });
  const [selectedFiles, setSelectedFiles] = useState<Partial<Record<UploadTarget, File>>>({});

  const mutation = useMutation({
    mutationFn: async ({ person, file }: { person: UploadTarget; file: File }) => {
      const text = await file.text();
      const raw = JSON.parse(text) as Record<string, unknown> | Array<Record<string, unknown>>;
      return uploadQuestionnaire({
        person,
        fileName: file.name,
        raw,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/state"] });
    },
  });

  const handleFileSelection = (person: UploadTarget, fileList: FileList | null) => {
    const file = fileList?.[0];
    setSelectedFiles((current) => ({
      ...current,
      [person]: file || undefined,
    }));
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-serif text-3xl">Questionnaire Import</h1>
        <p className="text-muted-foreground">
          Tony and Drew questionnaire responses are now stored through the site itself and persisted in Cloudflare KV.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {data?.questionnaires.map((record) => (
          <Card key={record.person}>
            <CardHeader>
              <CardTitle>{record.person}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>Current file: <code>{record.fileName || record.sourceFile}</code></p>
              <p>
                Imported: <strong>{record.importedQuestions}</strong> / {record.totalQuestions}
              </p>
              {record.uploadedAt ? (
                <p className="text-muted-foreground">Uploaded: {new Date(record.uploadedAt).toLocaleString()}</p>
              ) : null}
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                {record.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
              <div className="space-y-2 border-t border-border/60 pt-3">
                <input
                  type="file"
                  accept="application/json"
                  onChange={(event) =>
                    handleFileSelection(record.person as UploadTarget, event.target.files)
                  }
                />
                <Button
                  disabled={!selectedFiles[record.person as UploadTarget] || mutation.isPending}
                  onClick={() =>
                    mutation.mutate({
                      person: record.person as UploadTarget,
                      file: selectedFiles[record.person as UploadTarget]!,
                    })
                  }
                >
                  {mutation.isPending ? "Uploading..." : `Upload ${record.person} JSON`}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Accepted Shape</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="overflow-auto rounded-2xl bg-muted/60 p-4 text-sm">
{`[
  {
    "person_name": "Tony",
    "category": "surface",
    "question_id": "s1",
    "question_text": "How do you usually react when plans change unexpectedly?",
    "answer": "Need time to process",
    "selected_options": ["Need time to process"]
  }
]`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
