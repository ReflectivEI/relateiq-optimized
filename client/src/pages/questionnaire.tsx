import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchQuestionnaire, uploadQuestionnaire } from "@/lib/relateiq-api";
import type { QuestionnaireResponse } from "@/lib/relateiq-analysis";

type UploadTarget = "Tony" | "Drew";

function ResponseCard({ response }: { response: QuestionnaireResponse }) {
  const selectedOptions = Array.isArray(response.selected_options) ? response.selected_options : [];
  const answer = typeof response.answer === "string" ? response.answer : response.answer != null ? String(response.answer) : "";
  const numericScale = selectedOptions.length === 1 && /^[1-5]$/.test(selectedOptions[0]);

  return (
    <Card className="rounded-[26px] border-border/70">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-medium text-foreground">{response.question_text}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border border-border/60 px-2 py-1">{response.category.replace(/_/g, " ")}</span>
              {response.mode ? <span className="rounded-full border border-border/60 px-2 py-1">{response.mode}</span> : null}
              {response.weight ? <span className="rounded-full border border-border/60 px-2 py-1">{response.weight}</span> : null}
            </div>
          </div>
        </div>

        {numericScale ? (
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <div
                key={value}
                className={`rounded-2xl border px-3 py-3 text-center text-sm font-medium ${
                  selectedOptions[0] === String(value)
                    ? "border-[hsl(145_33%_48%)] bg-[hsl(145_33%_48%)] text-white"
                    : "border-border/60 text-muted-foreground"
                }`}
              >
                {value}
              </div>
            ))}
          </div>
        ) : null}

        {!numericScale && selectedOptions.length > 0 ? (
          <div className="space-y-2">
            {selectedOptions.map((option) => (
              <div
                key={option}
                className="rounded-2xl border border-[hsl(145_18%_84%)] bg-[hsl(145_25%_96%)] px-4 py-3 text-sm text-foreground"
              >
                {option}
              </div>
            ))}
          </div>
        ) : null}

        {answer && (!selectedOptions.length || answer.length > 6) ? (
          <div className="rounded-2xl border border-border/60 bg-[hsl(42_28%_98%)] p-4 text-[15px] leading-7 text-foreground">
            {answer}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function QuestionnairePage() {
  const queryClient = useQueryClient();
  const [person, setPerson] = useState<UploadTarget>("Tony");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: tony } = useQuery({
    queryKey: ["/api/questionnaire/Tony"],
    queryFn: () => fetchQuestionnaire("Tony"),
  });
  const { data: drew } = useQuery({
    queryKey: ["/api/questionnaire/Drew"],
    queryFn: () => fetchQuestionnaire("Drew"),
  });

  const activeData = person === "Tony" ? tony : drew;
  const grouped = useMemo(() => {
    const map = new Map<string, QuestionnaireResponse[]>();
    for (const response of activeData?.responses || []) {
      const key = response.category;
      const next = map.get(key) || [];
      next.push(response);
      map.set(key, next);
    }
    return Array.from(map.entries());
  }, [activeData]);

  const mutation = useMutation({
    mutationFn: async ({ target, file }: { target: UploadTarget; file: File }) => {
      const text = await file.text();
      const raw = JSON.parse(text) as Record<string, unknown> | Array<Record<string, unknown>>;
      return uploadQuestionnaire({
        person: target,
        fileName: file.name,
        raw,
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/questionnaire/Tony"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/questionnaire/Drew"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/state"] }),
      ]);
      setSelectedFile(null);
    },
  });

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div>
        <h1 className="font-serif text-4xl text-foreground">Questionnaire</h1>
        <p className="mt-2 text-muted-foreground">Browse the real questionnaire responses now loaded for Tony and Drew.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {(["Tony", "Drew"] as const).map((value) => (
          <button
            key={value}
            onClick={() => setPerson(value)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              person === value
                ? "bg-background shadow-sm ring-1 ring-border"
                : "bg-[hsl(42_18%_92%)] text-muted-foreground"
            }`}
          >
            {value}
          </button>
        ))}
        <span className="text-sm text-muted-foreground">
          {activeData?.responses?.length || 0} responses loaded
        </span>
      </div>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Replace Uploaded JSON</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept="application/json"
            onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
          />
          <Button
            disabled={!selectedFile || mutation.isPending}
            onClick={() => selectedFile && mutation.mutate({ target: person, file: selectedFile })}
          >
            {mutation.isPending ? "Uploading..." : `Upload ${person} JSON`}
          </Button>
          {activeData?.fileName ? (
            <span className="text-sm text-muted-foreground">
              Current file: {activeData.fileName}
            </span>
          ) : null}
        </CardContent>
      </Card>

      <div className="space-y-6">
        {grouped.map(([category, items]) => (
          <section key={category} className="space-y-3">
            <div>
              <h2 className="text-xl font-semibold capitalize text-foreground">{category.replace(/_/g, " ")}</h2>
              <p className="text-sm text-muted-foreground">{items.length} questions</p>
            </div>
            <div className="space-y-4">
              {items.map((response: QuestionnaireResponse) => (
                <ResponseCard key={response.question_id} response={response} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
