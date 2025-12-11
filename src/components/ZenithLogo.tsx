import { cn } from "@/lib/utils";

interface ZenithLogoProps {
    variant?: "horizontal" | "icon" | "full";
    className?: string;
    size?: "sm" | "md" | "lg" | "xl";
    polished?: boolean;
}

const sizeMap = {
    sm: "h-6",
    md: "h-10",
    lg: "h-16",
    xl: "h-24",
};

const containerSizeMap = {
    sm: "w-6 h-6 p-0.5",
    md: "w-10 h-10 p-1.5",
    lg: "w-16 h-16 p-2",
    xl: "w-24 h-24 p-3",
};

export const ZenithLogo = ({
    variant = "horizontal",
    className,
    size = "md",
    polished = true,
}: ZenithLogoProps) => {
    const logoSrc = variant === "icon" ? "/zenith-icon.png" : "/zenith-horizontal.png";

    // Polished circular wrapper for icon variant
    if (variant === "icon") {
        return (
            <div
                className={cn(
                    "inline-flex items-center justify-center rounded-full overflow-hidden",
                    containerSizeMap[size],
                    polished
                        ? "bg-gradient-to-br from-primary/6 to-secondary/6 shadow-lg ring-1 ring-primary/10 backdrop-blur-sm"
                        : "bg-transparent",
                    className
                )}
                aria-hidden={false}
            >
                <img src={logoSrc} alt="Zenith Logo" className="w-full h-full object-contain" />
            </div>
        );
    }

    // Horizontal or full variants remain simple images (no circular wrapper)
    return (
        <img
            src={logoSrc}
            alt="Zenith Logo"
            className={cn("object-contain", sizeMap[size], className)}
        />
    );
};
