import { Editor } from "@/components/Editor";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* <h1 className="text-4xl font-semibold">Welcome to Swift Note</h1> */}

      <div className="container mx-auto px-4 py-8 flex-grow">
        <Editor />
      </div>

      <footer className="w-full py-4 text-center text-sm text-muted-foreground">
        Made with ❤️ by Sahit, Angan, and Cursor
      </footer>
    </div>
  );
}
