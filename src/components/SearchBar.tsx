'use client';

import React, { useState, useCallback } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  query: string;
}

const SearchBar = ({ onSearch, query }: SearchBarProps) => {
  const [inputValue, setInputValue] = useState(query);

  // Debounce the search to prevent too many queries while typing
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      onSearch(value);
    }, 300),
    [onSearch]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    debouncedSearch(value);
  };

  return (
    <div className="w-96 relative">
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        placeholder="Search notes..."
        // className="w-full p-2 pl-10 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/25"
        className = "w-full pl-10 h-10 rounded-lg bg-background border border-foreground/40 px-3 py-2 text-card-foreground placeholder:text-muted-foreground/70 focus:border-foreground/60 focus:outline-none focus:ring-1 focus:ring-foreground/60 focus:bg-card/60"
      />
      <svg
        className="absolute left-3 top-3 h-5 w-5 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </div>
  );
};

// Debounce helper function
function debounce<F extends (...args: any[]) => any>(
  func: F,
  wait: number
): (...args: Parameters<F>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<F>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default SearchBar;
