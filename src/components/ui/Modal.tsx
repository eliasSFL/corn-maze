import React from "react";
import classNames from "classnames";

export const Modal: React.FC<{
  show: boolean;
  children: React.ReactNode;
  className?: string;
}> = ({ show, children, className }) => {
  if (!show) {
    return null;
  }
  return (
    <div
      className={classNames(
        "fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-2",
        className,
      )}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>
  );
};
