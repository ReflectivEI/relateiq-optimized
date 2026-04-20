import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { fetchQuestionnaire } from "@/lib/relateiq-api";
import { buildProfileFromQuestionnaire, type ProfileSection } from "@/lib/relateiq-analysis";

function SectionActions({ section }: { section: ProfileSection }) {
  const [active, setActive] = useState<keyof Pick<ProfileSection, "explain" | "whyItMatters" | "doDifferently" | "realLifeExample">>("explain");
  const labels = [
    { key: "explain", label: "Explain this" },
    { key: "whyItMatters", label: "Why it matters" },
    { key: "doDifferently", label: "What to do differently" },
    { key: "realLifeExample", label: "Real-life example" },
  ] as const;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {labels.map((item) => (
          <button
            key={item.key}
            onClick={() => setActive(item.key)}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              active === item.key
                ? "border-[hsl(145_26%_72%)] bg-[hsl(145_28%_95%)] text-[hsl(145_25%_35%)]"
                : "border-border/60 text-muted-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="rounded-2xl border border-[hsl(145_18%_86%)] bg-[hsl(145_20%_97%)] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(145_22%_45%)]">
          {labels.find((item) => item.key === active)?.label}
        </p>
        <p className="mt-2 text-[15px] leading-7 text-foreground">{section[active]}</p>
      </div>
    </div>
  );
}

export default function ProfilesPage() {
  const [person, setPerson] = useState<"Tony" | "Drew">("Tony");
  const { data: tony } = useQuery({
    queryKey: ["/api/questionnaire/Tony"],
    queryFn: () => fetchQuestionnaire("Tony"),
  });
  const { data: drew } = useQuery({
    queryKey: ["/api/questionnaire/Drew"],
    queryFn: () => fetchQuestionnaire("Drew"),
  });

  const activeResponses = person === "Tony" ? tony?.responses || [] : drew?.responses || [];
  const profile = useMemo(() => buildProfileFromQuestionnaire(person, activeResponses), [person, activeResponses]);

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="font-serif text-5xl tracking-tight text-foreground">Profiles</h1>
          <p className="mt-2 text-lg text-muted-foreground">AI-generated behavioral profiles based on questionnaire data</p>
        </div>
        <div className="text-right">
          <Button className="bg-[hsl(145_33%_48%)] hover:bg-[hsl(145_33%_43%)]">Regenerate Profile</Button>
          <p className="mt-2 text-xs text-muted-foreground">Last generated: Apr 20, 2026, 12:22 AM</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-[hsl(145_18%_86%)] bg-[hsl(145_20%_97%)] px-4 py-3 text-sm text-muted-foreground">
          Your responses are private. Nothing is shared with your partner unless you choose to share it.
        </div>
        <div className="rounded-2xl border border-[hsl(145_18%_86%)] bg-[hsl(145_20%_97%)] px-4 py-3 text-sm text-muted-foreground">
          Each section below is fully interactive. Tap to expand, then explore what it means, why it matters, what to do differently, and a real-life example.
        </div>
      </div>

      <div className="flex gap-2">
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
      </div>

      <Tabs defaultValue="my-profile" className="space-y-4">
        <TabsList className="bg-[hsl(42_18%_92%)]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="my-profile">My Profile</TabsTrigger>
          <TabsTrigger value="trait-map">Trait Map</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card className="rounded-[28px] border-border/70">
            <CardContent className="space-y-5 p-6">
              <p className="text-[15px] text-muted-foreground">{profile.notice}</p>
              <div className="flex flex-wrap gap-2">
                {profile.badges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-[hsl(145_18%_84%)] bg-[hsl(145_28%_95%)] px-3 py-1 text-sm text-[hsl(145_25%_35%)]"
                  >
                    {badge}
                  </span>
                ))}
              </div>
              <div className="rounded-3xl border border-border/60 bg-[hsl(42_28%_98%)] p-6 text-[15px] leading-7 text-foreground">
                {profile.intro}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-profile">
          <Accordion type="single" collapsible className="space-y-3">
            {profile.sections.map((section, index) => (
              <AccordionItem
                key={section.id}
                value={section.id}
                className="overflow-hidden rounded-[26px] border border-border/70 bg-background"
              >
                <AccordionTrigger className="px-5 py-5 text-left hover:no-underline">
                  <div className="min-w-0">
                    <p className="text-xl font-semibold text-foreground">{section.title}</p>
                    <p className="mt-2 text-sm font-normal text-muted-foreground">{section.summary}</p>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="border-t border-border/60 px-5 pt-5">
                  <SectionActions section={section} />
                  {index === 0 ? null : <div className="pt-2" />}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>

        <TabsContent value="trait-map">
          <div className="grid gap-4 lg:grid-cols-2">
            {profile.traitMap.map((item) => (
              <Card key={item.label} className="rounded-3xl">
                <CardContent className="p-6">
                  <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">{item.label}</p>
                  <p className="mt-3 text-lg text-foreground">{item.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
