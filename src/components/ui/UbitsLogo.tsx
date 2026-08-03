import * as React from "react";
import { cn } from "@/lib/utils";

interface UbitsLogoProps {
  className?: string;
  size?: number;
  color?: string;
}

export const UbitsLogo: React.FC<UbitsLogoProps> = ({ 
  className, 
  size = 24, 
  color = "white" 
}) => {
  return (
    <div className={cn("flex items-center justify-center transition-all duration-300 hover:scale-110", className)}>
      <svg 
        width={size} 
        height={(size * 25) / 24} 
        viewBox="0 0 24 25" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M12.0042 7.67725V17.5612C12.0042 20.2653 13.3633 21.8609 16.1197 21.8609C18.8284 21.8609 20.1821 20.2653 20.1821 17.9489V8.08158H23.9999V18.0484C23.9999 22.1849 21.4774 24.9999 16.1169 24.9999C10.7008 24.9999 8.17822 22.1594 8.17822 18.0727V11.2653C8.17822 10.3137 8.58103 9.40103 9.29803 8.72815C10.015 8.05527 10.9875 7.67725 12.0015 7.67725" 
          fill={color}
        />
        <path 
          d="M12.0051 4.05078C9.96636 4.05078 8.01107 4.81086 6.56942 6.1638C5.12778 7.51674 4.31787 9.35172 4.31787 11.2651H6.52647C6.52647 9.90132 7.10364 8.5934 8.13105 7.62897C9.15847 6.66453 10.552 6.12255 12.0051 6.12221V4.05078Z" 
          fill={color}
        />
        <path 
          d="M12.0044 2.42347V0C8.82076 0 5.76752 1.18688 3.51635 3.29953C1.26518 5.41218 0.000488281 8.27756 0.000488281 11.2653H2.58285C2.58285 8.9203 3.57547 6.67135 5.34235 5.01318C7.10923 3.35501 9.50564 2.42347 12.0044 2.42347" 
          fill={color}
        />
      </svg>
    </div>
  );
};
