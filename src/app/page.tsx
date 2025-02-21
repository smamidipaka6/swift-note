import { Editor } from "@/components/Editor";

// This is the Fastest, Most Light Version of the Site — it's the fastest website in the world (as far as I could find)

export default function Home() {
  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col">
      <div
        className="container mx-auto px-4 py-8 max-h-[92vh] overflow-y-auto no-scrollbar" // no-scrollbar is a class in globals.css
      >
        <Editor />
      </div>

      <footer className="absolute bottom-0 w-full py-4 text-center text-sm text-muted-foreground">
        Made with ❤️ by Sahit, Angan, and Cursor
      </footer>
    </div>
  );
}
