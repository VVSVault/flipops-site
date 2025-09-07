import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PlaceholderPageProps {
  title: string;
  description: string;
  features?: string[];
}

export function PlaceholderPage({ title, description, features = [] }: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">{title}</h1>
        <p className="text-gray-400 mt-2">{description}</p>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Coming Soon</CardTitle>
          <CardDescription className="text-gray-400">
            This section is under development
          </CardDescription>
        </CardHeader>
        <CardContent>
          {features.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-400 mb-3">Planned features:</p>
              <ul className="space-y-2">
                {features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}