import React from "react";

interface Props {
  className?: string;
}
const CloseOutline: React.FC<Props> = ({ className }) => {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 12C4 8.22876 4 6.34315 5.17157 5.17157C6.34315 4 8.22876 4 12 4C15.7712 4 17.6569 4 18.8284 5.17157C20 6.34315 20 8.22876 20 12C20 15.7712 20 17.6569 18.8284 18.8284C17.6569 20 15.7712 20 12 20C8.22876 20 6.34315 20 5.17157 18.8284C4 17.6569 4 15.7712 4 12Z"
        stroke="#525252"
        strokeWidth="1.2"
      />
      <path
        d="M14 10L10 14M9.99998 10L14 14"
        stroke="#525252"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default CloseOutline;
