import { useState, useMemo, useCallback } from "react";

interface FilterOptions<T> {
  searchFields?: (keyof T)[];
  statusField?: keyof T;
  dateField?: keyof T;
  defaultStatus?: string;
}

interface UseFilteredDataReturn<T> {
  data: T[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  dateFilter: string;
  setDateFilter: (date: string) => void;
  filteredData: T[];
  resetFilters: () => void;
}

export const useFilteredData = <T extends Record<string, any>>(
  initialData: T[],
  options: FilterOptions<T> = {}
): UseFilteredDataReturn<T> => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(options.defaultStatus || "ALL");
  const [dateFilter, setDateFilter] = useState("");

  const filteredData = useMemo(() => {
    let result = initialData;

    // Search filter
    if (searchTerm && options.searchFields && options.searchFields.length > 0) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter((item) =>
        options.searchFields!.some((field) => {
          const value = item[field];
          if (typeof value === "string") {
            return value.toLowerCase().includes(lowerSearchTerm);
          }
          if (typeof value === "number") {
            return String(value).includes(lowerSearchTerm);
          }
          return false;
        })
      );
    }

    // Status filter
    if (statusFilter !== "ALL" && options.statusField) {
      result = result.filter((item) => item[options.statusField!] === statusFilter);
    }

    // Date filter
    if (dateFilter && options.dateField) {
      result = result.filter((item) => {
        const itemDate = new Date(item[options.dateField!] as string);
        const filterDate = new Date(dateFilter);
        return itemDate.toISOString().split("T")[0] === filterDate.toISOString().split("T")[0];
      });
    }

    return result;
  }, [initialData, searchTerm, statusFilter, dateFilter, options.searchFields, options.statusField, options.dateField]);

  const resetFilters = useCallback(() => {
    setSearchTerm("");
    setStatusFilter(options.defaultStatus || "ALL");
    setDateFilter("");
  }, [options.defaultStatus]);

  return {
    data: initialData,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    dateFilter,
    setDateFilter,
    filteredData,
    resetFilters,
  };
};
