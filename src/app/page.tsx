import { Editor } from "@/components/Editor";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <h1 className="text-4xl font-semibold">Welcome to Swift Note</h1>

      <div className="container mx-auto px-4 py-8">
        <Editor />
      </div>
    </div>
  );
}
