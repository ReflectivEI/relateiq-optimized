import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchRelateIQState } from "@/lib/relateiq-api";

export default function ToolsPage() {
  const { data } = useQuery({
    queryKey: ["/api/state"],
    queryFn: fetchRelateIQState,
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-serif text-3xl">Tools</h1>
        <p className="text-muted-foreground">
          These practical workflows run directly on the current GitHub and Cloudflare stack.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {data?.tools.map((tool) => (
          <Link key={tool.id} href={tool.route}>
            <Card className="transition hover:border-primary/40 hover:bg-primary/5">
              <CardHeader>
                <CardTitle>{tool.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{tool.purpose}</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
