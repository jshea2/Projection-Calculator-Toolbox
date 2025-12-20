import React, { useRef, useEffect, useState } from "react";

interface IOSSegmentedControlProps {
    options: string[];
    selected: string;
    onChange: (value: string) => void;
    darkMode?: boolean;
    size?: "sm" | "md" | "lg";
    fullWidth?: boolean;
    className?: string;
    "data-haptic"?: "light" | "medium" | "selection";
}

/**
 * iOS-style segmented control with smooth sliding indicator
 * 
 * @example
 * <IOSSegmentedControl
 *   options={["Day", "Week", "Month"]}
 *   selected={selected}
 *   onChange={setSelected}
 *   darkMode={darkMode}
 * />
 */
export const IOSSegmentedControl: React.FC<IOSSegmentedControlProps> = ({
    options,
    selected,
    onChange,
    darkMode = false,
    size = "md",
    fullWidth = false,
    className = "",
    "data-haptic": haptic = "selection",
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

    const selectedIndex = options.indexOf(selected);

    // Update indicator position when selection changes
    useEffect(() => {
        if (containerRef.current && selectedIndex >= 0) {
            const buttons = containerRef.current.querySelectorAll("button");
            const selectedButton = buttons[selectedIndex];
            if (selectedButton) {
                const containerRect = containerRef.current.getBoundingClientRect();
                const buttonRect = selectedButton.getBoundingClientRect();
                setIndicatorStyle({
                    left: buttonRect.left - containerRect.left,
                    width: buttonRect.width,
                });
            }
        }
    }, [selectedIndex, options]);

    const sizeStyles = {
        sm: {
            container: "p-0.5 rounded-lg",
            button: "px-2 py-1 text-xs min-h-[28px]",
            indicator: "rounded-md",
        },
        md: {
            container: "p-1 rounded-[10px]",
            button: "px-3 py-1.5 text-sm min-h-[32px]",
            indicator: "rounded-lg",
        },
        lg: {
            container: "p-1 rounded-xl",
            button: "px-4 py-2 text-base min-h-[44px]",
            indicator: "rounded-[10px]",
        },
    };

    const styles = sizeStyles[size];

    return (
        <div
            ref={containerRef}
            className={`
        relative
        inline-flex
        font-[var(--ios-font-family)]
        ${styles.container}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `.replace(/\s+/g, " ").trim()}
            style={{
                backgroundColor: darkMode
                    ? "var(--ios-fill-secondary)"
                    : "var(--ios-gray-5)",
            }}
        >
            {/* Sliding indicator */}
            <div
                className={`
          absolute
          top-1
          bottom-1
          ${styles.indicator}
          transition-all
          duration-200
          shadow-sm
        `.replace(/\s+/g, " ").trim()}
                style={{
                    left: indicatorStyle.left,
                    width: indicatorStyle.width,
                    backgroundColor: darkMode ? "var(--ios-gray-4)" : "#FFFFFF",
                    transitionTimingFunction: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                    boxShadow: darkMode
                        ? "0 1px 3px rgba(0, 0, 0, 0.3)"
                        : "0 1px 3px rgba(0, 0, 0, 0.1)",
                }}
            />

            {/* Buttons */}
            {options.map((option, index) => {
                const isSelected = option === selected;

                return (
                    <button
                        key={option}
                        type="button"
                        onClick={() => onChange(option)}
                        data-haptic={haptic}
                        className={`
              relative
              z-10
              flex-1
              ${styles.button}
              font-medium
              transition-colors
              duration-150
              select-none
              ${fullWidth ? "flex-1" : ""}
            `.replace(/\s+/g, " ").trim()}
                        style={{
                            color: isSelected
                                ? (darkMode ? "var(--ios-label)" : "var(--ios-label)")
                                : (darkMode ? "var(--ios-label-tertiary)" : "var(--ios-gray-1)"),
                            transitionTimingFunction: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                        }}
                    >
                        {option}
                    </button>
                );
            })}
        </div>
    );
};

export default IOSSegmentedControl;
