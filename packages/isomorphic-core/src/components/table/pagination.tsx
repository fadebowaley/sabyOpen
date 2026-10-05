"use client";

import { type Table as ReactTableType } from "@tanstack/react-table";
import { useState, useRef, useEffect } from "react";

import { ActionIcon, Box, Flex, Grid, Text } from "rizzui";
import {
  PiCaretLeftBold,
  PiCaretRightBold,
  PiCaretDoubleLeftBold,
  PiCaretDoubleRightBold,
  PiCaretDownBold,
} from "react-icons/pi";
import cn from "@core/utils/class-names";

const DEFAULT_PAGE_SIZE_OPTIONS = [100, 200, 300, 400, 500];

// Custom Select component to avoid Headless UI Fragment issues
function CustomSelect({
  options,
  value,
  onChange,
  className,
}: {
  options: Array<{ value: number; label: string }>;
  value: number;
  onChange: (value: { value: number; label: string }) => void;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption =
    options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={selectRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-7 w-12 items-center justify-between rounded-md border border-gray-200 bg-white px-2 text-xs font-semibold shadow-sm ring-0 focus:outline-none focus:ring-2 focus:ring-black/5">
        <span>{selectedOption.label}</span>
        <PiCaretDownBold className="h-3 w-3 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 w-12 rounded-md border border-gray-200 bg-white shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className={cn(
                "block w-full px-2 py-1 text-xs font-medium text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none",
                option.value === value
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-700"
              )}>
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TablePagination<TData extends Record<string, any>>({
  table,
  showSelectedCount = false,
  className,
  totalPages = 0,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}: {
  table: ReactTableType<TData>;
  showSelectedCount?: boolean;
  className?: string;
  totalPages?: number;
  pageSizeOptions?: number[];
}) {
  const currentPage = table.getState().pagination.pageIndex + 1;
  const canGoNext = currentPage < totalPages;
  const canGoPrevious = currentPage > 1;
  const effectiveOptions =
    pageSizeOptions && pageSizeOptions.length > 0
      ? pageSizeOptions
      : DEFAULT_PAGE_SIZE_OPTIONS;
  const baseOptions = effectiveOptions.map((optionValue) => ({
    value: optionValue,
    label: optionValue.toString(),
  }));
  const pageSize = table.getState().pagination.pageSize;
  const optionsWithCurrent = baseOptions.some((opt) => opt.value === pageSize)
    ? baseOptions
    : [...baseOptions, { value: pageSize, label: pageSize.toString() }].sort(
        (a, b) => a.value - b.value,
      );

  return (
    <Flex
      gap="6"
      align="center"
      justify="between"
      className={cn("@container", className)}>
      <Flex align="center" className="w-auto shrink-0">
        <Text className="hidden font-normal text-gray-600 @md:block">
          Rows per page
        </Text>
        <CustomSelect
          options={optionsWithCurrent}
          value={pageSize}
          onChange={(v: { value: number; label: string }) => {
            table.setPageSize(Number(v.value));
          }}
          className="w-20"
        />
      </Flex>

      {showSelectedCount && (
        <Box className="hidden @2xl:block w-full">
          <Text>
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </Text>
        </Box>
      )}

      <Flex justify="end" align="center">
        <Text className="hidden font-normal text-gray-600 @3xl:block">
          Page {currentPage} of {Math.max(1, totalPages).toLocaleString()}
        </Text>

        <Grid gap="2" columns="4">
          <ActionIcon
            size="sm"
            rounded="lg"
            variant="outline"
            aria-label="Go to first page"
            onClick={() => table.firstPage()}
            disabled={!canGoPrevious}
            className="text-gray-900 shadow-sm disabled:text-gray-400 disabled:shadow-none">
            <PiCaretDoubleLeftBold className="size-3.5" />
          </ActionIcon>
          <ActionIcon
            size="sm"
            rounded="lg"
            variant="outline"
            aria-label="Go to previous page"
            onClick={() => table.previousPage()}
            disabled={!canGoPrevious}
            className="text-gray-900 shadow-sm disabled:text-gray-400 disabled:shadow-none">
            <PiCaretLeftBold className="size-3.5" />
          </ActionIcon>
          <ActionIcon
            size="sm"
            rounded="lg"
            variant="outline"
            aria-label="Go to next page"
            onClick={() => table.nextPage()}
            disabled={!canGoNext}
            className="text-gray-900 shadow-sm disabled:text-gray-400 disabled:shadow-none">
            <PiCaretRightBold className="size-3.5" />
          </ActionIcon>
          <ActionIcon
            size="sm"
            rounded="lg"
            variant="outline"
            aria-label="Go to last page"
            onClick={() => table.lastPage()}
            disabled={!canGoNext}
            className="text-gray-900 shadow-sm disabled:text-gray-400 disabled:shadow-none">
            <PiCaretDoubleRightBold className="size-3.5" />
          </ActionIcon>
        </Grid>
      </Flex>
    </Flex>
  );
}