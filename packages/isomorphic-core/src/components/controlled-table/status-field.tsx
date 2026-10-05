"use client";

import SelectFixed, {
  type SelectProps,
} from "@core/components/ui/select-fixed";
import cn from "@core/utils/class-names";

export default function StatusField({
  placeholder = "Select status",
  dropdownClassName,
  ...props
}: SelectProps) {
  return (
    <SelectFixed
      placeholder={placeholder}
      selectClassName="h-9 min-w-[150px]"
      dropdownClassName={cn("p-1.5 !z-0", dropdownClassName)}
      optionClassName="h-9"
      {...props}
    />
  );
}
