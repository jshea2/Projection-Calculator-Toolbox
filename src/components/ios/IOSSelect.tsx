import React, { forwardRef } from "react";

interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

interface IOSSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
    options: SelectOption[] | string[];
    label?: string;
    helperText?: string;
    error?: string;
    darkMode?: boolean;
    size?: "sm" | "md" | "lg";
    variant?: "default" | "filled" | "plain";
    fullWidth?: boolean;
    placeholder?: string;
}

export const IOSSelect = forwardRef<HTMLSelectElement, IOSSelectProps>(
    (
        {
            options,
            label,
            helperText,
            error,
            darkMode = false,
            size = "md",
            variant = "default",
            fullWidth = true,
            placeholder,
            className = "",
            disabled,
            ...props
        },
        ref
    ) => {
        // Size configurations
        const sizeConfig = {
            sm: {
                padding: "px-3 py-2.5 pr-10",
                fontSize: "text-sm",
                minHeight: "min-h-[44px]",
                labelSize: "text-sm mb-1",
                helperSize: "text-xs mt-1",
                iconSize: "w-4 h-4",
                iconRight: "right-3",
            },
            md: {
                padding: "px-4 py-3 pr-11",
                fontSize: "text-base",
                minHeight: "min-h-[48px]",
                labelSize: "text-base mb-1.5",
                helperSize: "text-sm mt-1.5",
                iconSize: "w-5 h-5",
                iconRight: "right-3",
            },
            lg: {
                padding: "px-5 py-4 pr-12",
                fontSize: "text-lg",
                minHeight: "min-h-[56px]",
                labelSize: "text-lg mb-2",
                helperSize: "text-base mt-2",
                iconSize: "w-6 h-6",
                iconRight: "right-4",
            },
        };

        const config = sizeConfig[size];

        // Variant styles
        const getVariantStyles = () => {
            if (variant === "filled") {
                return darkMode
                    ? "border-slate-700"
                    : "bg-slate-100 border-slate-100";
            }
            if (variant === "plain") {
                return "bg-transparent border-transparent";
            }
            // default
            return darkMode
                ? "border-slate-600"
                : "bg-white border-slate-300";
        };

        // Inline styles for custom colors
        const getInlineStyles = () => {
            if (darkMode) {
                if (variant === "filled") {
                    return {
                        backgroundColor: "rgb(14, 23, 42)",
                        borderColor: "rgb(14, 23, 42)",
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
                        borderColor: "#f2f2f7",
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

        // Focus styles
        const getFocusStyles = () => {
            if (error) {
                return "focus:ring-2 focus:ring-red-500 focus:border-red-500";
            }
            return "focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
        };

        // Text color
        const getTextColor = () => {
            return darkMode ? "text-white" : "text-slate-900";
        };

        // Label color
        const getLabelColor = () => {
            if (error) return "text-red-500";
            return darkMode ? "text-slate-300" : "text-slate-700";
        };

        // Helper/error color
        const getHelperColor = () => {
            if (error) return "text-red-500";
            return darkMode ? "text-slate-400" : "text-slate-600";
        };

        // Icon color
        const getIconColor = () => {
            return darkMode ? "#9ca3af" : "#64748b";
        };

        // Normalize options to SelectOption format
        const normalizedOptions: SelectOption[] = options.map((opt): SelectOption =>
            typeof opt === "string" ? { value: opt, label: opt } : opt
        );

        return (
            <div className={`${fullWidth ? "w-full" : "inline-block"}`}>
                {/* Label */}
                {label && (
                    <label
                        className={`block font-medium ${config.labelSize} ${getLabelColor()}`}
                    >
                        {label}
                    </label>
                )}

                {/* Select Container */}
                <div className="relative">
                    {/* Select Element */}
                    <select
                        ref={ref}
                        disabled={disabled}
                        className={`
                            w-full
                            appearance-none
                            rounded-xl
                            border
                            outline-none
                            transition-all
                            duration-200
                            cursor-pointer
                            ${config.padding}
                            ${config.fontSize}
                            ${config.minHeight}
                            ${getVariantStyles()}
                            ${getFocusStyles()}
                            ${getTextColor()}
                            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                            ${className}
                        `.replace(/\s+/g, " ").trim()}
                        style={getInlineStyles()}
                        {...props}
                    >
                        {placeholder && (
                            <option value="" disabled>
                                {placeholder}
                            </option>
                        )}
                        {normalizedOptions.map((option) => (
                            <option
                                key={option.value}
                                value={option.value}
                                disabled={option.disabled}
                            >
                                {option.label}
                            </option>
                        ))}
                    </select>

                    {/* Chevron Icon */}
                    <div
                        className={`absolute pointer-events-none ${config.iconRight} ${config.iconSize}`}
                        style={{
                            color: getIconColor(),
                            top: '50%',
                            transform: 'translateY(-50%)'
                        }}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-full h-full"
                            aria-hidden="true"
                        >
                            <path
                                fillRule="evenodd"
                                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                </div>

                {/* Helper Text or Error */}
                {(helperText || error) && (
                    <p className={`${config.helperSize} ${getHelperColor()}`}>
                        {error || helperText}
                    </p>
                )}
            </div>
        );
    }
);

IOSSelect.displayName = "IOSSelect";

export default IOSSelect;
