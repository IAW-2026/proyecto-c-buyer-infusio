"use client";

import { useRouter, useSearchParams } from "next/navigation";

export interface FilterOption {
  label: string;
  value: string;
  count: number;
}

export interface FilterGroup {
  label: string;
  param: "origins" | "types" | "priceRange";
  multi: boolean;
  options: FilterOption[];
}

interface Props {
  groups: FilterGroup[];
  accent: "terracotta" | "olive" | "slate";
  query: string;
}

export default function FilterSidebar({ groups, accent, query }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const checkColor =
    accent === "terracotta" ? "#b86f4c" :
    accent === "slate"      ? "#7A6B77" :
    "#6b7056";

  const accentText =
    accent === "terracotta" ? "text-terracotta" :
    accent === "slate"      ? "text-[#7A6B77]" :
    "text-olive";

  const hasActiveFilters =
    searchParams.has("origins") ||
    searchParams.has("types") ||
    searchParams.has("priceRange");

  function getActiveValues(param: string): string[] {
    const val = searchParams.get(param);
    return val ? val.split("|").filter(Boolean) : [];
  }

  function toggle(param: "origins" | "types" | "priceRange", value: string, multi: boolean) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");

    if (multi) {
      const current = getActiveValues(param);
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      if (next.length === 0) {
        params.delete(param);
      } else {
        params.set(param, next.join("|"));
      }
    } else {
      if (searchParams.get(param) === value) {
        params.delete(param);
      } else {
        params.set(param, value);
      }
    }

    router.push(`/?${params.toString()}`);
  }

  function clearFilters() {
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    router.push(`/?${params.toString()}`);
  }

  return (
    <aside className="hidden lg:block w-52 shrink-0 pt-1 sticky top-24 self-start">
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="text-xs tracking-[0.15em] text-muted-foreground hover:text-brown mb-6 transition-colors"
        >
          LIMPIAR FILTROS ×
        </button>
      )}

      {groups.map((group, gi) => {
        const activeValues = getActiveValues(group.param);

        return (
          <div
            key={group.param}
            className={`py-6 ${gi < groups.length - 1 ? "border-b border-tan" : ""}`}
          >
            <p className={`text-xs tracking-[0.2em] mb-4 ${accentText}`}>{group.label}</p>
            <ul className="space-y-3">
              {group.options.map((opt) => {
                const isActive = group.multi
                  ? activeValues.includes(opt.value)
                  : searchParams.get(group.param) === opt.value;

                return (
                  <li key={opt.value}>
                    <button
                      onClick={() => toggle(group.param, opt.value, group.multi)}
                      className="flex items-center gap-3 w-full text-left group"
                    >
                      {/* Checkbox square */}
                      <span
                        className="w-4 h-4 shrink-0 border flex items-center justify-center transition-colors"
                        style={{
                          borderColor: isActive ? checkColor : "#d4cfc5",
                          backgroundColor: isActive ? checkColor : "transparent",
                        }}
                      >
                        {isActive && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path
                              d="M1 4L3.5 6.5L9 1"
                              stroke="white"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                      <span className="text-sm text-brown group-hover:text-brown/70 transition-colors leading-none">
                        {opt.label}
                      </span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {opt.count}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </aside>
  );
}
