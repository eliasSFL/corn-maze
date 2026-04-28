import React from "react";
import classNames from "classnames";

export const Modal: React.FC<{
  show: boolean;
  children: React.ReactNode;
  className?: string;
  onHide?: () => void;
}> = ({ show, children, className, onHide }) => {
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
      onClick={(e) => {
        if (e.target === e.currentTarget && onHide) onHide();
      }}
    >
      {children}
    </div>
  );
};
