import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { getPaginationRange } from "@/lib/pagination";
import { cn } from "@/lib/utils";

type TablePaginationProps = {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
};

export function TablePagination({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  itemLabel = "élément",
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const label = totalItems > 1 ? `${itemLabel}s` : itemLabel;

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 border-t border-gray-100 bg-slate-50/50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p className="shrink-0 text-sm text-muted-foreground">
        Affichage de{" "}
        <span className="font-medium text-gray-900">
          {(currentPage - 1) * pageSize + 1}
        </span>
        {" à "}
        <span className="font-medium text-gray-900">
          {Math.min(currentPage * pageSize, totalItems)}
        </span>
        {" sur "}
        <span className="font-medium text-gray-900">{totalItems}</span> {label}
        {totalPages > 1 && (
          <span className="text-muted-foreground">
            {" "}
            · Page {currentPage}/{totalPages}
          </span>
        )}
      </p>

      {totalPages > 1 && (
        <Pagination className="mx-0 w-full justify-center sm:w-auto sm:justify-end">
          <PaginationContent className="flex-wrap justify-center gap-1 rounded-xl border border-gray-200 bg-white px-2 py-1 shadow-sm">
            <PaginationItem>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 gap-1 px-2.5"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Précédent</span>
              </Button>
            </PaginationItem>

            {getPaginationRange(currentPage, totalPages).map((token, index) =>
              token === "ellipsis" ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={token}>
                  <PaginationLink
                    href="#"
                    isActive={token === currentPage}
                    className={cn(
                      "h-9 w-9",
                      token === currentPage &&
                        "border-indigo-200 bg-indigo-600 text-white hover:bg-indigo-600 hover:text-white"
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      onPageChange(token);
                    }}
                  >
                    {token}
                  </PaginationLink>
                </PaginationItem>
              )
            )}

            <PaginationItem>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 gap-1 px-2.5"
                disabled={currentPage >= totalPages}
                onClick={() =>
                  onPageChange(Math.min(totalPages, currentPage + 1))
                }
              >
                <span className="hidden sm:inline">Suivant</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
