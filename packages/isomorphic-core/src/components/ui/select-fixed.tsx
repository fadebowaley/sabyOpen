"use client";

import React, { ReactNode } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { PiCaretUpDownBold, PiCheckBold } from "react-icons/pi";
import cn from "@core/utils/class-names";

export interface SelectOption {
  label: string;
  value: string;
  [key: string]: any;
}

export interface SelectProps {
  options?: SelectOption[];
  value?: any;
  onChange?: (value: any) => void;
  placeholder?: string;
  className?: string;
  selectClassName?: string;
  dropdownClassName?: string;
  optionClassName?: string;
  getOptionValue?: (option: SelectOption) => any;
  getOptionDisplayValue?: (option: SelectOption) => ReactNode;
  displayValue?: (selected: any) => ReactNode;
  disabled?: boolean;
}

/**
 * Custom Select Component using Headless UI Listbox
 *
 * This component properly uses <div> elements instead of React.Fragment
 * to avoid the data-headlessui-state prop warning that occurs with RizzUI.
 */
export default function SelectFixed({
  options = [],
  value,
  onChange,
  placeholder = "Select option",
  className,
  selectClassName,
  dropdownClassName,
  optionClassName,
  getOptionValue = (option: SelectOption) => option.value,
  getOptionDisplayValue = (option: SelectOption) => option.label,
  displayValue,
  disabled = false,
}: SelectProps) {
  const selectedOption = options.find(
    (opt: SelectOption) => getOptionValue(opt) === value
  );

  const handleChange = (option: SelectOption) => {
    if (onChange) {
      onChange(getOptionValue(option));
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Listbox
        value={selectedOption}
        onChange={handleChange}
        disabled={disabled}>
        <div>
          <Listbox.Button
            className={cn(
              "relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm",
              disabled && "opacity-50 cursor-not-allowed",
              selectClassName
            )}>
            <span className="block truncate">
              {selectedOption
                ? displayValue
                  ? displayValue(value)
                  : getOptionDisplayValue(selectedOption)
                : placeholder}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <PiCaretUpDownBold
                className="h-4 w-4 text-gray-400"
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>

          <Transition
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0">
            <Listbox.Options
              className={cn(
                "absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm",
                dropdownClassName
              )}>
              {options.length === 0 ? (
                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                  No options available
                </div>
              ) : (
                options.map((option: SelectOption, index: number) => (
                  <Listbox.Option
                    key={index}
                    className={({ active }: { active: boolean }) =>
                      cn(
                        "relative cursor-default select-none py-2 pl-10 pr-4",
                        active ? "bg-primary/10 text-primary" : "text-gray-900",
                        optionClassName
                      )
                    }
                    value={option}>
                    {({ selected }: { selected: boolean }) => (
                      <div>
                        <span
                          className={cn(
                            "block truncate",
                            selected ? "font-medium" : "font-normal"
                          )}>
                          {getOptionDisplayValue(option)}
                        </span>
                        {selected && (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                            <PiCheckBold
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                          </span>
                        )}
                      </div>
                    )}
                  </Listbox.Option>
                ))
              )}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}

export type { SelectOption as SelectFixedOption };
