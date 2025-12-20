import React, { useEffect, useRef } from "react";

interface IOSSheetProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    detent?: "full" | "large" | "medium" | "small";
    showDragIndicator?: boolean;
    showCloseButton?: boolean;
    className?: string;
    "data-haptic"?: "light" | "medium" | "heavy";
}

/**
 * iOS-style modal sheet with drag indicator and spring animations
 * 
 * @example
 * <IOSSheet
 *   isOpen={isSheetOpen}
 *   onClose={() => setIsSheetOpen(false)}
 *   title="Options"
 *   detent="medium"
 * >
 *   <p>Sheet content</p>
 * </IOSSheet>
 */
export const IOSSheet: React.FC<IOSSheetProps> = ({
    isOpen,
    onClose,
    children,
    title,
    detent = "medium",
    showDragIndicator = true,
    showCloseButton = true,
    className = "",
    "data-haptic": haptic = "light",
}) => {
    const sheetRef = useRef<HTMLDivElement>(null);
    const startY = useRef<number>(0);
    const currentY = useRef<number>(0);

    const detentHeights = {
        full: "100%",
        large: "92%",
        medium: "50%",
        small: "25%",
    };

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };

        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    // Prevent body scroll when sheet is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    // Touch handlers for drag-to-dismiss
    const handleTouchStart = (e: React.TouchEvent) => {
        startY.current = e.touches[0].clientY;
        currentY.current = 0;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        const deltaY = e.touches[0].clientY - startY.current;
        currentY.current = Math.max(0, deltaY); // Only allow dragging down

        if (sheetRef.current) {
            sheetRef.current.style.transform = `translateY(${currentY.current}px)`;
        }
    };

    const handleTouchEnd = () => {
        if (sheetRef.current) {
            if (currentY.current > 100) {
                // If dragged more than 100px, close the sheet
                onClose();
            } else {
                // Snap back to original position
                sheetRef.current.style.transform = "translateY(0)";
            }
        }
        currentY.current = 0;
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className={`
          fixed
          inset-0
          z-[100]
          transition-opacity
          duration-[var(--ios-duration-normal)]
          ease-[var(--ios-spring)]
          ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
        `.replace(/\s+/g, " ").trim()}
                style={{
                    backgroundColor: "rgba(0, 0, 0, 0.4)",
                }}
                onClick={onClose}
            />

            {/* Sheet */}
            <div
                ref={sheetRef}
                data-haptic={haptic}
                className={`
          fixed
          left-0
          right-0
          bottom-0
          z-[101]
          font-[var(--ios-font-family)]
          rounded-t-[var(--ios-radius-2xl)]
          shadow-[var(--ios-shadow-xl)]
          transition-transform
          duration-[var(--ios-duration-slow)]
          ease-[var(--ios-spring)]
          overflow-hidden
          ${isOpen ? "translate-y-0" : "translate-y-full"}
          ${className}
        `.replace(/\s+/g, " ").trim()}
                style={{
                    backgroundColor: "var(--ios-sheet-bg)",
                    backdropFilter: "blur(40px)",
                    WebkitBackdropFilter: "blur(40px)",
                    maxHeight: detentHeights[detent],
                    paddingBottom: "var(--ios-safe-bottom)",
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Drag indicator */}
                {showDragIndicator && (
                    <div className="flex justify-center pt-2 pb-1">
                        <div
                            className="w-9 h-[5px] rounded-full"
                            style={{
                                backgroundColor: "var(--ios-gray-3)",
                            }}
                        />
                    </div>
                )}

                {/* Header */}
                {(title || showCloseButton) && (
                    <div
                        className="
              flex
              items-center
              justify-between
              px-4
              py-3
              border-b
            "
                        style={{
                            borderColor: "var(--ios-separator)",
                        }}
                    >
                        {/* Empty space for centering */}
                        <div className="w-16" />

                        {/* Title */}
                        {title && (
                            <h2
                                className="
                  text-[17px]
                  font-semibold
                  flex-1
                  text-center
                "
                                style={{
                                    color: "var(--ios-label)",
                                }}
                            >
                                {title}
                            </h2>
                        )}

                        {/* Close button */}
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                data-haptic="light"
                                className="
                  w-8
                  h-8
                  flex
                  items-center
                  justify-center
                  rounded-full
                  transition-all
                  duration-[var(--ios-duration-fast)]
                  active:scale-90
                  active:opacity-70
                "
                                style={{
                                    backgroundColor: "var(--ios-fill-secondary)",
                                }}
                            >
                                <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 12 12"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M1 1L11 11M1 11L11 1"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        style={{ color: "var(--ios-gray-1)" }}
                                    />
                                </svg>
                            </button>
                        )}

                        {!showCloseButton && <div className="w-16" />}
                    </div>
                )}

                {/* Content */}
                <div
                    className="
            overflow-y-auto
            overscroll-contain
          "
                    style={{
                        maxHeight: `calc(${detentHeights[detent]} - 60px)`,
                    }}
                >
                    {children}
                </div>
            </div>
        </>
    );
};

export default IOSSheet;
