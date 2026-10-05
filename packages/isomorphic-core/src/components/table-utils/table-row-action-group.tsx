"use client";

import EyeIcon from "@core/components/icons/eye";
import PencilIcon from "@core/components/icons/pencil";
import UserIcon from "@core/components/icons/user-settings";
import { ActionIcon, Flex, Tooltip } from "rizzui";
import Link from "next/link";
import cn from "@core/utils/class-names";
import DeletePopover from "../delete-popover";
import { Plus } from "lucide-react";

export default function TableRowActionGroup({
  onDelete,
  onAdd,
  onEdit,
  onView,
  editUrl = "#",
  viewUrl = "#",
  deletePopoverTitle = "Delete the appointment",
  deletePopoverDescription = "Are you sure you want to delete this item?",
  className,
}: {
  onDelete?: () => void;
  onAdd?: () => void;
  onEdit?: () => void;
  onView?: () => void;
  editUrl?: string;
  viewUrl?: string;
  deletePopoverTitle?: string;
  deletePopoverDescription?: string;
  className?: string;
}) {
  return (
    <Flex
      align="center"
      justify="end"
      gap="3"
      className={cn("pe-3", className)}>
      <Tooltip size="sm" content="Add Node" placement="top" color="invert">
        <ActionIcon
          as="span"
          size="sm"
          variant="outline"
          aria-label="Add Node"
          onClick={onAdd}>
          <Plus className="size-4" />
        </ActionIcon>
      </Tooltip>
      <Tooltip size="sm" content="Add User" placement="top" color="invert">
        <ActionIcon
          as="span"
          size="sm"
          variant="outline"
          aria-label="Add User"
          onClick={onEdit}>
          <UserIcon className="size-4" />
        </ActionIcon>
      </Tooltip>
      <Tooltip size="sm" content="Edit Item" placement="top" color="invert">
        <ActionIcon
          as="span"
          size="sm"
          variant="outline"
          aria-label="Edit item"
          onClick={onView}>
          <PencilIcon className="size-4" />
        </ActionIcon>
      </Tooltip>
      <DeletePopover
        title={deletePopoverTitle}
        description={deletePopoverDescription}
        onDelete={onDelete}
      />
    </Flex>
  );
}
