import { Editor } from "@/components/Editor";

const hideScrollbarStyle = {
  msOverflowStyle: "none",
  scrollbarWidth: "none",
  WebkitOverflowScrolling: "touch"
} as React.CSSProperties;

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <h1 className="text-4xl font-semibold">Welcome to Swift Note</h1>

      <div 
        className="container mx-auto px-4 py-8 mt-8 max-h-[85vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [&::-ms-overflow-style]:none [&::scrollbar-width]:none"
        style={hideScrollbarStyle}
      >
        <Editor />
      </div>
    </div>
  );
}
