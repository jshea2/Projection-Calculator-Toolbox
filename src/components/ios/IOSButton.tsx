import React from "react";

interface IOSButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: "filled" | "tinted" | "gray" | "plain" | "destructive";
    size?: "sm" | "md" | "lg";
    color?: "blue" | "green" | "red" | "orange" | "purple" | "pink" | "indigo";
    disabled?: boolean;
    fullWidth?: boolean;
    icon?: React.ReactNode;
    iconPosition?: "left" | "right";
    className?: string;
    type?: "button" | "submit" | "reset";
    darkMode?: boolean;
    "data-haptic"?: "light" | "medium" | "heavy" | "selection" | "success" | "warning" | "error";
}

/**
 * iOS-style button with filled, tinted, gray, and plain variants
 * 
 * @example
 * <IOSButton variant="filled" color="blue">
 *   Submit
 * </IOSButton>
 * 
 * <IOSButton variant="tinted" icon={<Icon />}>
 *   With Icon
 * </IOSButton>
 */
export const IOSButton: React.FC<IOSButtonProps> = ({
    children,
    onClick,
    variant = "filled",
    size = "md",
    color = "blue",
    disabled = false,
    fullWidth = false,
    icon,
    iconPosition = "left",
    className = "",
    type = "button",
    darkMode = false,
    "data-haptic": haptic = "light",
}) => {
    const colorMap = {
        blue: {
            bg: "var(--ios-blue)",
            tint: "rgba(0, 122, 255, 0.15)",
            text: "var(--ios-blue)"
        },
        green: {
            bg: "var(--ios-green)",
            tint: "rgba(52, 199, 89, 0.15)",
            text: "var(--ios-green)"
        },
        red: {
            bg: "var(--ios-red)",
            tint: "rgba(255, 59, 48, 0.15)",
            text: "var(--ios-red)"
        },
        orange: {
            bg: "var(--ios-orange)",
            tint: "rgba(255, 149, 0, 0.15)",
            text: "var(--ios-orange)"
        },
        purple: {
            bg: "var(--ios-purple)",
            tint: "rgba(175, 82, 222, 0.15)",
            text: "var(--ios-purple)"
        },
        pink: {
            bg: "var(--ios-pink)",
            tint: "rgba(255, 45, 85, 0.15)",
            text: "var(--ios-pink)"
        },
        indigo: {
            bg: "var(--ios-indigo)",
            tint: "rgba(88, 86, 214, 0.15)",
            text: "var(--ios-indigo)"
        },
    };

    const sizeStyles = {
        sm: "px-3 py-1.5 text-sm min-h-[32px]",
        md: "px-4 py-2 text-base min-h-[44px]",
        lg: "px-6 py-3 text-lg min-h-[50px]",
    };

    const baseStyles = `
    font-[var(--ios-font-family)]
    font-semibold
    rounded-xl
    transition-all
    duration-[var(--ios-duration-fast)]
    ease-[var(--ios-spring)]
    flex
    items-center
    justify-center
    gap-2
    select-none
    active:scale-[0.97]
    disabled:opacity-40
    disabled:cursor-not-allowed
    disabled:active:scale-100
  `;

    const getVariantStyles = () => {
        const colors = colorMap[color];

        switch (variant) {
            case "filled":
                return `
          bg-[${colors.bg}]
          text-white
          hover:opacity-90
          active:opacity-80
        `;
            case "tinted":
                return `
          bg-[${colors.tint}]
          text-[${colors.text}]
          hover:bg-opacity-20
          active:bg-opacity-30
        `;
            case "gray":
                return `
          bg-[var(--ios-fill-secondary)]
          text-[var(--ios-label)]
          hover:bg-[var(--ios-fill)]
          active:bg-[var(--ios-fill-tertiary)]
        `;
            case "plain":
                return `
          bg-transparent
          text-[${colors.text}]
          hover:bg-[${colors.tint}]
          active:opacity-70
        `;
            case "destructive":
                return `
          bg-[var(--ios-red)]
          text-white
          hover:opacity-90
          active:opacity-80
        `;
            default:
                return "";
        }
    };

    const widthStyles = fullWidth ? "w-full" : "";

    // Build inline styles for CSS variables
    const colors = colorMap[color];
    const inlineStyles: React.CSSProperties = {};

    if (variant === "filled") {
        // Subtle green for dark mode
        if (darkMode && color === "green") {
            inlineStyles.backgroundColor = "rgb(34, 139, 34)"; // Forest green
            inlineStyles.color = "#ffffff";
        } else {
            inlineStyles.backgroundColor = colors.bg;
        }
    } else if (variant === "tinted") {
        inlineStyles.backgroundColor = colors.tint;
        inlineStyles.color = colors.text;
    } else if (variant === "plain") {
        inlineStyles.color = colors.text;
    } else if (variant === "destructive") {
        inlineStyles.backgroundColor = "var(--ios-red)";
    } else if (variant === "gray" && darkMode) {
        inlineStyles.backgroundColor = "rgb(14, 23, 42)";
        inlineStyles.color = "#ffffff";
    }

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            data-haptic={haptic}
            className={`
        ${baseStyles}
        ${sizeStyles[size]}
        ${widthStyles}
        ${className}
      `.replace(/\s+/g, " ").trim()}
            style={inlineStyles}
        >
            {icon && iconPosition === "left" && (
                <span className="flex-shrink-0">{icon}</span>
            )}
            {children}
            {icon && iconPosition === "right" && (
                <span className="flex-shrink-0">{icon}</span>
            )}
        </button>
    );
};

export default IOSButton;
