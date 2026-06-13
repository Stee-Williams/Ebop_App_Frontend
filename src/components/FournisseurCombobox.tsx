import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type ComboboxOption = {
  value: string;
  label: string;
};

type FournisseurComboboxProps = {
  id?: string;
  options: ComboboxOption[];
  value: string;
  selectedId: string;
  onChange: (next: { value: string; selectedId: string }) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

export function FournisseurCombobox({
  id,
  options,
  value,
  selectedId,
  onChange,
  disabled = false,
  placeholder = "Sélectionner ou saisir...",
  className,
}: FournisseurComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const trimmedSearch = search.trim();
  const normalizedSearch = trimmedSearch.toLowerCase();

  const filtered = useMemo(() => {
    if (!normalizedSearch) return options;
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(normalizedSearch)
    );
  }, [options, normalizedSearch]);

  const exactMatch = useMemo(
    () =>
      options.some(
        (opt) => opt.label.toLowerCase() === normalizedSearch
      ),
    [options, normalizedSearch]
  );

  const displayLabel = value || placeholder;

  const handleSelectExisting = (opt: ComboboxOption) => {
    onChange({ value: opt.label, selectedId: opt.value });
    setSearch("");
    setOpen(false);
  };

  const handleSelectNew = () => {
    if (!trimmedSearch) return;
    onChange({ value: trimmedSearch, selectedId: "" });
    setSearch("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-11 w-full justify-between border-gray-200 bg-white font-normal hover:bg-white",
            !value && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">{displayLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Rechercher ou saisir un nom..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {filtered.length === 0 && !trimmedSearch ? (
              <CommandEmpty>Aucun fournisseur en base.</CommandEmpty>
            ) : null}
            {filtered.length > 0 && (
              <CommandGroup heading="Fournisseurs existants">
                {filtered.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    value={opt.label}
                    onSelect={() => handleSelectExisting(opt)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedId === opt.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {opt.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {trimmedSearch && !exactMatch && (
              <CommandGroup heading="Nouveau fournisseur">
                <CommandItem value={`create-${trimmedSearch}`} onSelect={handleSelectNew}>
                  <Plus className="mr-2 h-4 w-4 text-emerald-600" />
                  <span>
                    Utiliser « <strong>{trimmedSearch}</strong> »
                  </span>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
