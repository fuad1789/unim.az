"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AutocompleteProps<T> {
  items: T[];
  onSelect: (item: T) => void;
  onSearch: (query: string) => void;
  placeholder: string;
  getItemKey: (item: T) => string;
  getItemLabel: (item: T) => string;
  getItemDescription?: (item: T) => string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function Autocomplete<T>({
  items,
  onSelect,
  onSearch,
  placeholder,
  getItemKey,
  getItemLabel,
  getItemDescription,
  searchQuery,
  setSearchQuery,
  isLoading = false,
  disabled = false,
}: AutocompleteProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, onSearch]);

  // Reset active index when items change
  useEffect(() => {
    setActiveIndex(0);
  }, [items]);

  // Scroll active item into view
  useEffect(() => {
    const activeItem = itemRefs.current[activeIndex];
    if (activeItem) {
      activeItem.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % items.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
        break;
      case "Enter":
        e.preventDefault();
        if (items[activeIndex]) {
          onSelect(items[activeIndex]);
          setIsOpen(false);
        }
        break;
      case "Escape":
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelect = (item: T) => {
    onSelect(item);
    setIsOpen(false);
    setSearchQuery(getItemLabel(item));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputBlur = () => {
    // Delay closing to allow for clicks on items
    setTimeout(() => setIsOpen(false), 150);
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-300 transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <AnimatePresence>
        {isOpen && items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto"
          >
            <ul className="py-2">
              {items.map((item, index) => (
                <li key={getItemKey(item)}>
                  <button
                    ref={(el) => {
                      itemRefs.current[index] = el;
                    }}
                    onClick={() => handleSelect(item)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors ${
                      index === activeIndex ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="font-medium text-gray-800">
                      {getItemLabel(item)}
                    </div>
                    {getItemDescription && (
                      <div className="text-sm text-gray-500 mt-1">
                        {getItemDescription(item)}
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {isOpen && items.length === 0 && !isLoading && searchQuery && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50"
        >
          <div className="px-4 py-3 text-center text-gray-500">
            Uyğun nəticə tapılmadı
          </div>
        </motion.div>
      )}
    </div>
  );
}
