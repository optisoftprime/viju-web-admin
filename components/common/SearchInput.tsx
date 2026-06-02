"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";

// Interface for SearchInput props
interface SearchInputProps {
  placeholder?: string;
  onSearch?: (value: string) => void;
  debounceDelay?: number;
  fullWidth?: boolean;
  className?: string;
}

/**
 * SearchInput Component
 * A reusable search input with debounce, onChange handling, and clear functionality
 *
 * @param {SearchInputProps} props - Component props
 * @param {string} props.placeholder - Placeholder text for the input
 * @param {Function} props.onSearch - Callback function when search value changes (after debounce)
 * @param {number} props.debounceDelay - Debounce delay in milliseconds (default: 500ms)
 * @param {string} props.className - Additional CSS classes
 *
 * @example
 * <SearchInput
 *   placeholder="Search customers..."
 *   onSearch={(value) => console.log(value)}
 *   debounceDelay={500}
 * />
 */
export default function SearchInput({
  placeholder = "Search...",
  onSearch,
  debounceDelay = 500,
  fullWidth = false,
  className = "",
}: SearchInputProps) {
  // State for the input value
  const [inputValue, setInputValue] = useState("");

  // Ref to track the debounce timer
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Handle input change event
   * Clears previous debounce timer and sets new one
   * Logs value to console after debounce delay
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      console.log("Search value:", value);
      onSearch?.(value);
    }, debounceDelay);
  };

  /**
   * Handle clear button click
   * Resets input value and triggers search callback with empty string
   */
  const handleClear = () => {
    setInputValue("");

    // Clear debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Trigger search callback immediately
    console.log("Search value:", "");
    onSearch?.("");
  };

  /**
   * Cleanup debounce timer on component unmount
   */
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`relative  ${fullWidth ? "w-full" : "max-w-md"}  ${className}`}
    >
      {/* Search Input Container */}
      <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2 border border-muted/20 hover:border-muted/50 focus-within:border-muted/30 transition-colors">
        {/* Search Icon */}
        <Search className="w-5 h-5 text-muted shrink-0" />

        {/* Input Field */}
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-xs text-foreground placeholder-muted placeholder:font-medium"
        />

        {/* Clear Button (X icon) - visible when input has value */}
        {inputValue && (
          <button
            onClick={handleClear}
            className="text-muted hover:text-foreground transition-colors p-1 flex-shrink-0"
            aria-label="Clear search"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
