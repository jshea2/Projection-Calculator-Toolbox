import React from "react";

interface IOSListItemProps {
    children?: React.ReactNode;
    title: string;
    subtitle?: string;
    leading?: React.ReactNode;
    trailing?: React.ReactNode;
    showChevron?: boolean;
    showDivider?: boolean;
    destructive?: boolean;
    disabled?: boolean;
    onClick?: () => void;
    className?: string;
    "data-haptic"?: "light" | "medium" | "selection";
}

/**
 * iOS-style list row with leading icon, title, subtitle, and trailing content
 * 
 * @example
 * <IOSListItem
 *   title="Settings"
 *   subtitle="Manage your preferences"
 *   leading={<SettingsIcon />}
 *   showChevron
 *   onClick={() => navigate("/settings")}
 * />
 */
export const IOSListItem: React.FC<IOSListItemProps> = ({
    children,
    title,
    subtitle,
    leading,
    trailing,
    showChevron = false,
    showDivider = true,
    destructive = false,
    disabled = false,
    onClick,
    className = "",
    "data-haptic": haptic = "selection",
}) => {
    const isInteractive = !!onClick && !disabled;

    return (
        <div
            className={`
        font-[var(--ios-font-family)]
        relative
        ${className}
      `.replace(/\s+/g, " ").trim()}
        >
            <button
                type="button"
                onClick={onClick}
                disabled={disabled}
                data-haptic={isInteractive ? haptic : undefined}
                className={`
          w-full
          flex
          items-center
          gap-3
          px-4
          py-3
          min-h-[44px]
          text-left
          transition-all
          duration-[var(--ios-duration-fast)]
          ease-[var(--ios-spring)]
          ${isInteractive ? "active:bg-[var(--ios-fill-secondary)] cursor-pointer" : "cursor-default"}
          ${disabled ? "opacity-40" : ""}
        `.replace(/\s+/g, " ").trim()}
                style={{
                    backgroundColor: "transparent",
                }}
            >
                {/* Leading icon/content */}
                {leading && (
                    <div
                        className="
              flex-shrink-0
              w-7
              h-7
              flex
              items-center
              justify-center
            "
                        style={{
                            color: destructive ? "var(--ios-red)" : "var(--ios-blue)",
                        }}
                    >
                        {leading}
                    </div>
                )}

                {/* Main content */}
                <div className="flex-1 min-w-0">
                    {/* Title */}
                    <div
                        className="
              text-[17px]
              font-normal
              truncate
            "
                        style={{
                            color: destructive ? "var(--ios-red)" : "var(--ios-label)",
                        }}
                    >
                        {title}
                    </div>

                    {/* Subtitle */}
                    {subtitle && (
                        <div
                            className="
                text-[14px]
                truncate
                mt-0.5
              "
                            style={{
                                color: "var(--ios-label-secondary)",
                            }}
                        >
                            {subtitle}
                        </div>
                    )}

                    {/* Custom children content */}
                    {children && (
                        <div className="mt-1">
                            {children}
                        </div>
                    )}
                </div>

                {/* Trailing content */}
                {trailing && (
                    <div
                        className="
              flex-shrink-0
              flex
              items-center
            "
                        style={{
                            color: "var(--ios-label-secondary)",
                        }}
                    >
                        {trailing}
                    </div>
                )}

                {/* Chevron */}
                {showChevron && isInteractive && (
                    <svg
                        width="8"
                        height="13"
                        viewBox="0 0 8 13"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="flex-shrink-0"
                    >
                        <path
                            d="M1 1L6.5 6.5L1 12"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ color: "var(--ios-gray-3)" }}
                        />
                    </svg>
                )}
            </button>

            {/* Divider */}
            {showDivider && (
                <div
                    className="
            absolute
            bottom-0
            right-0
            h-[0.5px]
          "
                    style={{
                        left: leading ? "56px" : "16px",
                        backgroundColor: "var(--ios-separator-opaque)",
                    }}
                />
            )}
        </div>
    );
};

/**
 * iOS-style list section wrapper
 */
interface IOSListSectionProps {
    children: React.ReactNode;
    header?: string;
    footer?: string;
    inset?: boolean;
    className?: string;
}

export const IOSListSection: React.FC<IOSListSectionProps> = ({
    children,
    header,
    footer,
    inset = true,
    className = "",
}) => {
    return (
        <div
            className={`
        font-[var(--ios-font-family)]
        ${className}
      `.replace(/\s+/g, " ").trim()}
        >
            {/* Section header */}
            {header && (
                <div
                    className="
            px-4
            pb-2
            pt-6
            text-[13px]
            font-normal
            uppercase
            tracking-wide
          "
                    style={{
                        color: "var(--ios-label-secondary)",
                        paddingLeft: inset ? "32px" : "16px",
                    }}
                >
                    {header}
                </div>
            )}

            {/* List items container */}
            <div
                className={`
          overflow-hidden
          ${inset ? "mx-4 rounded-[var(--ios-radius-lg)]" : ""}
        `.replace(/\s+/g, " ").trim()}
                style={{
                    backgroundColor: "var(--ios-card-bg)",
                }}
            >
                {children}
            </div>

            {/* Section footer */}
            {footer && (
                <div
                    className="
            px-4
            pt-2
            pb-4
            text-[13px]
            font-normal
          "
                    style={{
                        color: "var(--ios-label-secondary)",
                        paddingLeft: inset ? "32px" : "16px",
                    }}
                >
                    {footer}
                </div>
            )}
        </div>
    );
};

export default IOSListItem;
