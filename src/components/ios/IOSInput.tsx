import React, { forwardRef } from "react";

interface IOSInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
    label?: string;
    helperText?: string;
    error?: string;
    darkMode?: boolean;
    size?: "sm" | "md" | "lg";
    variant?: "default" | "filled" | "plain";
    leadingIcon?: React.ReactNode;
    trailingIcon?: React.ReactNode;
    fullWidth?: boolean;
}

/**
 * iOS-styled input wrapper with proper touch targets and focus states
 * 
 * @example
 * <IOSInput
 *   label="Email"
 *   placeholder="you@example.com"
 *   type="email"
 *   darkMode={darkMode}
 * />
 */
export const IOSInput = forwardRef<HTMLInputElement, IOSInputProps>(
    (
        {
            label,
            helperText,
            error,
            darkMode = false,
            size = "md",
            variant = "default",
            leadingIcon,
            trailingIcon,
            fullWidth = true,
            className = "",
            disabled,
            ...props
        },
        ref
    ) => {
        const sizeStyles = {
            sm: {
                input: "px-3 py-2 text-sm min-h-[36px]",
                label: "text-xs mb-1",
                helper: "text-xs mt-1",
                icon: "w-4 h-4",
            },
            md: {
                input: "px-4 py-3 text-base min-h-[44px]",
                label: "text-sm mb-1.5",
                helper: "text-xs mt-1.5",
                icon: "w-5 h-5",
            },
            lg: {
                input: "px-4 py-4 text-lg min-h-[52px]",
                label: "text-base mb-2",
                helper: "text-sm mt-2",
                icon: "w-6 h-6",
            },
        };

        const styles = sizeStyles[size];

        const variantStyles = {
            default: darkMode
                ? "border"
                : "bg-white border border-[var(--ios-gray-4)]",
            filled: darkMode
                ? "border-transparent"
                : "bg-[var(--ios-gray-6)] border-transparent",
            plain: "bg-transparent border-transparent",
        };

        // Inline styles for custom colors
        const getInlineStyles = () => {
            if (darkMode) {
                if (variant === "filled") {
                    return {
                        backgroundColor: "rgb(14, 23, 42)",
                        borderColor: "transparent",
                        color: "#ffffff",
                    };
                }
                // default variant
                return {
                    backgroundColor: "rgb(14, 23, 42)",
                    borderColor: "rgb(51, 65, 85)",
                    color: "#ffffff",
                };
            } else {
                // Light mode
                if (variant === "filled") {
                    return {
                        backgroundColor: "#f2f2f7",
                        borderColor: "transparent",
                        color: "#000000",
                    };
                }
                // default variant
                return {
                    backgroundColor: "#ffffff",
                    borderColor: "#d1d1d6",
                    color: "#000000",
                };
            }
        };

        const focusStyles = error
            ? "focus:ring-2 focus:ring-[var(--ios-red)] focus:border-[var(--ios-red)]"
            : "focus:ring-2 focus:ring-[var(--ios-blue)] focus:border-[var(--ios-blue)]";

        return (
            <div className={`font-[var(--ios-font-family)] ${fullWidth ? "w-full" : ""}`}>
                {/* Label */}
                {label && (
                    <label
                        className={`
              block
              font-medium
              ${styles.label}
            `.replace(/\s+/g, " ").trim()}
                        style={{
                            color: error
                                ? "var(--ios-red)"
                                : (darkMode ? "#ffffff" : "var(--ios-gray-1)"),
                        }}
                    >
                        {label}
                    </label>
                )}

                {/* Input wrapper */}
                <div className="relative">
                    {/* Leading icon */}
                    {leadingIcon && (
                        <div
                            className={`
                absolute
                left-3
                top-1/2
                -translate-y-1/2
                ${styles.icon}
                flex
                items-center
                justify-center
              `.replace(/\s+/g, " ").trim()}
                            style={{
                                color: darkMode ? "var(--ios-gray-1)" : "var(--ios-gray-2)",
                            }}
                        >
                            {leadingIcon}
                        </div>
                    )}

                    {/* Input */}
                    <input
                        ref={ref}
                        disabled={disabled}
                        className={`
              w-full
              rounded-xl
              outline-none
              transition-all
              duration-[var(--ios-duration-fast)]
              ${styles.input}
              ${variantStyles[variant]}
              ${focusStyles}
              ${leadingIcon ? "pl-10" : ""}
              ${trailingIcon ? "pr-10" : ""}
              ${disabled ? "opacity-50 cursor-not-allowed" : ""}
              ${className}
            `.replace(/\s+/g, " ").trim()}
                        style={{
                            ...getInlineStyles(),
                            transitionTimingFunction: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                        }}
                        {...props}
                    />

                    {/* Trailing icon */}
                    {trailingIcon && (
                        <div
                            className={`
                absolute
                right-3
                top-1/2
                -translate-y-1/2
                ${styles.icon}
                flex
                items-center
                justify-center
              `.replace(/\s+/g, " ").trim()}
                            style={{
                                color: darkMode ? "var(--ios-gray-1)" : "var(--ios-gray-2)",
                            }}
                        >
                            {trailingIcon}
                        </div>
                    )}
                </div>

                {/* Helper text or error */}
                {(helperText || error) && (
                    <p
                        className={`${styles.helper}`}
                        style={{
                            color: error
                                ? "var(--ios-red)"
                                : (darkMode ? "var(--ios-label-tertiary)" : "var(--ios-gray-1)"),
                        }}
                    >
                        {error || helperText}
                    </p>
                )}
            </div>
        );
    }
);

IOSInput.displayName = "IOSInput";

export default IOSInput;
