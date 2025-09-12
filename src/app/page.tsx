import { Editor } from "@/components/Editor";
import { ModeToggle } from "@/components/ModeToggle";
import HelpPopup from "@/components/HelpPopup";

export default function Home() {


  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col">
      <div className="flex flex-row space-x-2 absolute top-8 right-12">
        <ModeToggle />
        <HelpPopup />
      </div>

      <div className="container mx-auto px-4 py-8 max-h-[92vh] overflow-y-auto no-scrollbar">
        <Editor />
      </div>

      <footer className="absolute bottom-0 w-full py-4 text-center text-sm text-muted-foreground">
        Made with ❤️ by Sahit
      </footer>
    </div>
  );
}
