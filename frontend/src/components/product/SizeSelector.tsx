"use client";

interface SizeSelectorProps {
  sizes: string;
  selectedSize: string | null;
  onSelect: (size: string) => void;
}

export default function SizeSelector({
  sizes,
  selectedSize,
  onSelect,
}: SizeSelectorProps) {
  const sizeList = sizes
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (sizeList.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-700 mb-2">Select Size</h3>
      <div className="flex flex-wrap gap-2">
        {sizeList.map((size) => (
          <button
            key={size}
            onClick={() => onSelect(size)}
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              selectedSize === size
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-700 border-gray-300 hover:border-indigo-400"
            }`}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  );
}