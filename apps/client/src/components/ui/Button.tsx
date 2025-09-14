import React from "react";
import { Link } from "react-router-dom";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export type ButtonProps = {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  as?: "button" | "a" | "link"; // default: button
  to?: string;                  // for as="link"
  href?: string;                // for as="a"
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement> &
  React.AnchorHTMLAttributes<HTMLAnchorElement>;

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  as = "button",
  to,
  href,
  className,
  children,
  ...rest
}: ButtonProps) {
  const cls = cx(
    "btn",
    `btn--${variant}`,
    `btn--${size}`,
    loading && "btn--loading",
    className
  );

  const content = (
    <>
      {loading && <span aria-hidden className="btn__spinner" />}
      {!loading && leftIcon && <span className="btn__icon">{leftIcon}</span>}
      <span className="btn__label">{children}</span>
      {!loading && rightIcon && <span className="btn__icon">{rightIcon}</span>}
    </>
  );

  if (as === "a") {
    return (
      <a href={href} className={cls} {...(rest as any)}>
        {content}
      </a>
    );
  }

  if (as === "link") {
    return (
      <Link to={to || "#"} className={cls} {...(rest as any)}>
        {content}
      </Link>
    );
  }

  return (
    <button className={cls} {...(rest as any)}>
      {content}
    </button>
  );
}
