"use client";

import React from "react";
import { Popover, Title, Text, Button } from "rizzui";

interface ConfirmPopoverProps {
  trigger?: React.ReactNode;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
  confirmButtonClassName?: string;
  cancelButtonClassName?: string;
}

const ConfirmPopover: React.FC<ConfirmPopoverProps> = ({
  trigger,
  title = "Are you sure?",
  message = "Please confirm this action.",
  confirmText = "Yes",
  cancelText = "No",
  onConfirm,
  isLoading = false,
  confirmButtonClassName = "",
  cancelButtonClassName = "",
}) => {
  return (
    <Popover placement="top">
      <Popover.Trigger>
        {trigger ?? (
          <Button variant="outline" 
          color="primary">
            Confirm
          </Button>
        )}
      </Popover.Trigger>
      <Popover.Content>
        {({ setOpen }) => (
          <div className="w-64 space-y-3">
            <Title as="h6">{title}</Title>
            <Text className="text-sm">{message}</Text>
            <div className="flex justify-end gap-3 mb-1">
              <Button
                size="sm"
                variant="outline"
                className={cancelButtonClassName}
                onClick={() => setOpen(false)}>
                {cancelText}
              </Button>
              <Button
                size="sm"
                className={confirmButtonClassName}
                isLoading={isLoading}
                onClick={async () => {
                  await onConfirm();
                  setOpen(false);
                }}>
                {confirmText}
              </Button>
            </div>
          </div>
        )}
      </Popover.Content>
    </Popover>
  );
};

export default ConfirmPopover;
