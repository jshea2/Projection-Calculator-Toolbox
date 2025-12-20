import React from "react";

interface IOSCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "inset" | "grouped";
  blur?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  safeArea?: boolean;
  onClick?: () => void;
  darkMode?: boolean;
  "data-haptic"?: "light" | "medium" | "heavy" | "selection" | "success" | "warning" | "error";
}

/**
 * iOS-style card with blur effects and safe area support
 * 
 * @example
 * <IOSCard variant="default" blur>
 *   <h2>Card Title</h2>
 *   <p>Card content</p>
 * </IOSCard>
 */
export const IOSCard: React.FC<IOSCardProps> = ({
  children,
  className = "",
  variant = "default",
  blur = true,
  padding = "md",
  safeArea = false,
  onClick,
  darkMode = false,
  "data-haptic": haptic,
}) => {
  const baseStyles = `
    font-[var(--ios-font-family)]
    transition-all
    duration-[var(--ios-duration-normal)]
    ease-[var(--ios-spring)]
  `;

  const variantStyles = {
    default: darkMode
      ? `
      rounded-xl
      shadow-lg
      border
    `
      : `
      bg-white
      border border-slate-200
      rounded-xl
      shadow-sm
    `,
    inset: darkMode
      ? `
      rounded-lg
    `
      : `
      bg-slate-50
      rounded-lg
    `,
    grouped: darkMode
      ? `
      border-y
      first:rounded-t-lg
      last:rounded-b-lg
      first:border-t last:border-b
    `
      : `
      bg-white
      border-y border-slate-200
      first:rounded-t-lg
      last:rounded-b-lg
      first:border-t last:border-b
    `,
  };

  // Inline styles for colors that need oklch
  const inlineStyles = darkMode
    ? variant === "default"
      ? {
          backgroundColor: "rgb(29, 41, 61)",
          borderColor: "rgb(51, 65, 85)",
        }
      : variant === "inset"
      ? {
          backgroundColor: "rgb(22, 30, 46)",
        }
      : {
          backgroundColor: "rgb(29, 41, 61)",
          borderColor: "rgb(51, 65, 85)",
        }
    : {};

  const paddingStyles = {
    none: "",
    sm: "p-2",
    md: "p-4",
    lg: "p-6",
  };

  const blurStyles = blur ? "backdrop-blur-2xl" : "";

  const safeAreaStyles = safeArea
    ? `
      pl-[max(1rem,var(--ios-safe-left))]
      pr-[max(1rem,var(--ios-safe-right))]
    `
    : "";

  const interactiveStyles = onClick
    ? `
      cursor-pointer
      active:scale-[0.98]
      active:opacity-80
      hover:bg-[var(--ios-fill-secondary)]
    `
    : "";

  return (
    <div
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        ${blurStyles}
        ${safeAreaStyles}
        ${interactiveStyles}
        ${className}
      `.replace(/\s+/g, " ").trim()}
      style={inlineStyles}
      onClick={onClick}
      data-haptic={haptic}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
};

export default IOSCard;
