"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { useDebounce } from "@/lib/hooks/useSearch";

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  debounceDelay?: number;
  isLandingPage?: boolean;
}

export function SearchBar({
  onSearch,
  placeholder = "Search events...",
  debounceDelay = 300,
  isLandingPage = false,
}: SearchBarProps) {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const debouncedValue = useDebounce(inputValue, debounceDelay);

  // Trigger search when debounced value changes
  const handleSearch = useCallback(() => {
    if (onSearch) {
      onSearch(debouncedValue);
    }
  }, [debouncedValue, onSearch]);

  // Use effect to call search when debounced value changes
  const React = require("react");
  React.useEffect(() => {
    handleSearch();
  }, [debouncedValue, handleSearch]);

  const handleClear = () => {
    setInputValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && isLandingPage) {
      router.push(`/search?q=${encodeURIComponent(inputValue)}`);
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400 transition-all"
        />
        {inputValue && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Clear search"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
