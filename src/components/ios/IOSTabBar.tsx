import React, { useRef, useState } from "react";

interface TabItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    badge?: number | string;
}

interface IOSTabBarProps {
    tabs: TabItem[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
    className?: string;
    "data-haptic"?: "light" | "medium" | "selection";
    rightElement?: React.ReactNode;
}

/**
 * iOS App Store-style floating bottom tab bar
 *
 * @example
 * <IOSTabBar
 *   tabs={[
 *     { id: "home", label: "Home", icon: <HomeIcon /> },
 *     { id: "search", label: "Search", icon: <SearchIcon /> },
 *   ]}
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 * />
 */
export const IOSTabBar: React.FC<IOSTabBarProps> = ({
    tabs,
    activeTab,
    onTabChange,
    className = "",
    "data-haptic": haptic = "selection",
    rightElement,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
    const touchStartPos = useRef<{ x: number; y: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [hoveredTabId, setHoveredTabId] = useState<string | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartPos.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        };
        updateDragPosition(e.touches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!touchStartPos.current) return;

        const deltaX = Math.abs(e.touches[0].clientX - touchStartPos.current.x);
        const deltaY = Math.abs(e.touches[0].clientY - touchStartPos.current.y);

        // Only enter dragging mode if there's significant horizontal movement
        if (deltaX > 10 && deltaX > deltaY) {
            setIsDragging(true);
        }

        updateDragPosition(e.touches[0].clientX);
    };

    const handleTouchEnd = () => {
        // Only trigger tab change if we were actually dragging (not just tapping)
        if (isDragging && hoveredTabId && hoveredTabId !== activeTab) {
            onTabChange(hoveredTabId);
        }
        setIsDragging(false);
        setHoveredTabId(null);
        touchStartPos.current = null;
    };

    const updateDragPosition = (clientX: number) => {
        if (!containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const relativeX = clientX - containerRect.left;

        // Determine which tab is under the touch
        let foundTab: string | null = null;
        buttonRefs.current.forEach((button, tabId) => {
            const buttonRect = button.getBoundingClientRect();
            const buttonRelativeLeft = buttonRect.left - containerRect.left;
            const buttonRelativeRight = buttonRect.right - containerRect.left;

            if (relativeX >= buttonRelativeLeft && relativeX <= buttonRelativeRight) {
                foundTab = tabId;
            }
        });

        setHoveredTabId(foundTab);
    };
    return (
        <nav
            className={`ios-floating-tab-bar ${className}`}
            style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 9999,
                display: "flex",
                justifyContent: "center",
                pointerEvents: "none",
                paddingBottom: "calc(12px + var(--ios-safe-bottom, 0px))",
                paddingLeft: "16px",
                paddingRight: "16px",
            }}
        >
            {/* Floating pill container */}
            <div
                ref={containerRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                    position: "relative",
                    pointerEvents: "auto",
                    display: "flex",
                    alignItems: "center",
                    gap: "2px",
                    padding: "8px 8px",
                    borderRadius: "40px",
                    backdropFilter: "blur(40px)",
                    WebkitBackdropFilter: "blur(40px)",
                    backgroundColor: "rgba(30, 30, 30, 0.92)",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1) inset",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                }}
            >
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const isHovered = isDragging && hoveredTabId === tab.id;

                    return (
                        <button
                            key={tab.id}
                            ref={(el) => {
                                if (el) {
                                    buttonRefs.current.set(tab.id, el);
                                } else {
                                    buttonRefs.current.delete(tab.id);
                                }
                            }}
                            onClick={() => onTabChange(tab.id)}
                            data-haptic={haptic}
                            style={{
                                position: "relative",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "6px 10px",
                                minWidth: "56px",
                                borderRadius: "24px",
                                transition: isDragging ? "none" : "all 0.2s ease-out",
                                backgroundColor: isActive || isHovered ? "rgba(255, 255, 255, 0.15)" : "transparent",
                                color: isActive || isHovered ? "#3b82f6" : "rgba(255, 255, 255, 0.6)",
                                border: "none",
                                cursor: "pointer",
                                transform: isHovered && !isActive ? "scale(1.05)" : "scale(1)",
                            }}
                        >
                            {/* Icon container */}
                            <div style={{
                                position: "relative",
                                width: "34px",
                                height: "22px",
                                marginBottom: "4px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}>
                                {tab.icon}

                                {/* Badge */}
                                {tab.badge !== undefined && (
                                    <span style={{
                                        position: "absolute",
                                        top: "-4px",
                                        right: "-8px",
                                        minWidth: "28px",
                                        height: "28px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "11px",
                                        fontWeight: "bold",
                                        color: "white",
                                        borderRadius: "9999px",
                                        padding: "0 4px",
                                        backgroundColor: "#ef4444",
                                    }}>
                                        {typeof tab.badge === "number" && tab.badge > 99
                                            ? "99+"
                                            : tab.badge}
                                    </span>
                                )}
                            </div>

                            {/* Label */}
                            <span style={{
                                fontSize: "11px",
                                fontWeight: 500,
                                transition: "opacity 0.2s",
                                opacity: isActive ? 1 : 0.7,
                            }}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Right element (e.g., menu button) */}
            {rightElement && (
                <div style={{
                    marginLeft: "12px", pointerEvents: "auto"
                }}>
                    {rightElement}
                </div>
            )}
        </nav>
    );
};

export default IOSTabBar;
