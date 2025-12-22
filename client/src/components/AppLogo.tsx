import { Link } from "wouter";
import { Activity } from "lucide-react";

interface AppLogoProps {
  /** Where the logo should navigate to */
  href?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Show text label */
  showText?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * Clickable app logo that navigates to dashboard
 * Used across all pages for consistent navigation
 */
export function AppLogo({ 
  href = "/dashboard", 
  size = "md", 
  showText = true,
  className = "" 
}: AppLogoProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10"
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl"
  };

  return (
    <Link href={href}>
      <a className={`flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer ${className}`}>
        <div className="relative">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg blur-sm opacity-75"></div>
          
          {/* Icon */}
          <div className="relative bg-gradient-to-br from-teal-600 to-cyan-700 rounded-lg p-1.5 shadow-lg">
            <Activity className={`${sizeClasses[size]} text-white`} />
          </div>
        </div>
        
        {showText && (
          <span className={`font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent ${textSizeClasses[size]}`}>
            MediTriage AI
          </span>
        )}
      </a>
    </Link>
  );
}
