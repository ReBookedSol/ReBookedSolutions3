import React from "react";

interface XIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

const XIcon: React.FC<XIconProps> = ({ className, ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M6.5 5.5L17.5 18.5" />
      <path d="M17.5 5.5L6.5 18.5" />
    </svg>
  );
};

export default XIcon;
