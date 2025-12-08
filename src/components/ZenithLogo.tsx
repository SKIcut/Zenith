import { cn } from "@/lib/utils";

interface ZenithLogoProps {
    variant?: "horizontal" | "icon" | "full";
    className?: string;
    size?: "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
    sm: "h-6",
    md: "h-10",
    lg: "h-16",
    xl: "h-24",
};

export const ZenithLogo = ({
    variant = "horizontal",
    className,
    size = "md"
}: ZenithLogoProps) => {
    const logoSrc = variant === "icon" ? "/zenith-icon.png" : "/zenith-horizontal.png";

    return (
        <img
            src={logoSrc}
            alt="Zenith Logo"
            className={cn(
                "object-contain",
                sizeMap[size],
                className
            )}
        />
    );
};
