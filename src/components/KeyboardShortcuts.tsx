import React from "react";

interface KeyboardShortcutsProps {
  isMac?: boolean;
  onClose?: () => void;
}

const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  isMac = true,
  onClose,
}) => {
  const modifierKey = isMac ? "⌘" : "Ctrl";

  return (
    <div
      className="bg-popover text-popover-foreground rounded-xl p-6 w-[35vw] 
      border border-border/50 relative"
    >
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Close keyboard shortcuts"
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      )}

      <h2 className="text-xl font-bold mb-4 text-center">Keyboard Shortcuts</h2>

      <div className="flex items-center justify-between py-3 border-b border-border">
        <div className="flex items-center space-x-2">
          <kbd className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-sm font-mono">
            {modifierKey}
          </kbd>
          <span>+</span>
          <kbd className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-sm font-mono">
            B
          </kbd>
        </div>
        <span className="text-base text-foreground ml-4">Bold</span>
      </div>

      <div className="flex items-center justify-between py-3 border-b border-border">
        <div className="flex items-center space-x-2">
          <kbd className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-sm font-mono">
            {modifierKey}
          </kbd>
          <span>+</span>
          <kbd className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-sm font-mono">
            I
          </kbd>
        </div>
        <span className="text-base text-foreground ml-4">Italic</span>
      </div>

      <div className="flex items-center justify-between py-3 border-b border-border">
        <div className="flex items-center space-x-2">
          <kbd className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-sm font-mono">
            {modifierKey}
          </kbd>
          <span>+</span>
          <kbd className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-sm font-mono">
            U
          </kbd>
        </div>
        <span className="text-base text-foreground ml-4">Underline</span>
      </div>

      <div className="flex items-center justify-between py-3 border-b border-border">
        <div className="flex items-center space-x-2">
          <kbd className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-sm font-mono">
            {modifierKey}
          </kbd>
          <span>+</span>
          <kbd className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-sm font-mono">
            Shift
          </kbd>
          <span>+</span>
          <kbd className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-sm font-mono">
            X
          </kbd>
        </div>
        <span className="text-base text-foreground ml-4">Strikethrough</span>
      </div>

      <div className="flex items-center justify-between py-3 border-b border-border">
        <div className="flex items-center space-x-2">
          <kbd className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-sm font-mono">
            {modifierKey}
          </kbd>
          <span>+</span>
          <kbd className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-sm font-mono">
            Shift
          </kbd>
          <span>+</span>
          <kbd className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-sm font-mono">
            8
          </kbd>
        </div>
        <span className="text-base text-foreground ml-4">Bullets</span>
      </div>

      <div className="flex items-center justify-between py-3 border-b border-border ml-10">
        <div className="flex items-center space-x-2">
          <kbd className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-sm font-mono">
            Tab
          </kbd>
        </div>
        <span className="text-base text-foreground ml-4">Sub-bullets</span>
      </div>

      <div className="flex items-center justify-between py-3 ml-10">
        <div className="flex items-center space-x-2">
          <kbd className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-sm font-mono">
            Shift
          </kbd>
          <span>+</span>
          <kbd className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-sm font-mono">
            Tab
          </kbd>
        </div>
        <span className="text-base text-foreground ml-4">Un-bullet</span>
      </div>

      <div className="flex items-center justify-between py-3">
        <div className="flex items-center space-x-2">
          <kbd className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-sm font-mono">
            {modifierKey}
          </kbd>
          <span>+</span>
          <kbd className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-sm font-mono">
            S
          </kbd>
        </div>
        <span className="text-base text-foreground ml-4">Save</span>
      </div>
    </div>
  );
};

export default KeyboardShortcuts;
