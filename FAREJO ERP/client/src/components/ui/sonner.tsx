import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "font-[Rajdhani,sans-serif] text-sm font-semibold tracking-wide",
          success: "border-l-[3px] border-l-[#C9A227]",
          error: "border-l-[3px] border-l-red-500",
          warning: "border-l-[3px] border-l-amber-500",
          info: "border-l-[3px] border-l-blue-500",
        },
      }}
      style={
        {
          "--normal-bg": "oklch(0.12 0 0)",
          "--normal-text": "oklch(0.95 0 0)",
          "--normal-border": "oklch(0.22 0 0)",
          "--success-bg": "oklch(0.12 0 0)",
          "--success-text": "oklch(0.95 0 0)",
          "--success-border": "oklch(0.22 0 0)",
          "--error-bg": "oklch(0.12 0 0)",
          "--error-text": "oklch(0.95 0 0)",
          "--error-border": "oklch(0.22 0 0)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
