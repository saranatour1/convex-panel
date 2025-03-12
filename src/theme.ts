import { ThemeClasses } from "./types";

// Default theme (dark)
export const defaultTheme: ThemeClasses = {
  container: "bg-[#1e1e1e] border border-[#333333]",
  header: "bg-[#1e1e1e] border-b border-[#333333]",
  toolbar: "bg-[#1e1e1e] border-b border-[#333333]",
  table: "text-white",
  tableHeader: "bg-[#2a2a2a] text-xs uppercase",
  tableRow: "border-b border-[#333333] hover:bg-[#2a2a2a]",
  text: "text-white",
  button: "bg-[#4a77e5] text-white hover:opacity-90",
  input: "bg-[#2a2a2a] text-white border border-[#333333]",
  successText: "text-green-400",
  errorText: "text-red-400",
  warningText: "text-yellow-400"
};

export const buttonVariants = {
  hover: { scale: 1.1, rotate: 5 },
  tap: { scale: 0.95 },
  rest: { scale: 1, rotate: 0 }
};

export const cardVariants = {
  hidden: { 
    opacity: 0, 
    x: 100,
    transition: { 
      type: 'spring',
      stiffness: 300,
      damping: 30
    }
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { 
      type: 'spring',
      stiffness: 300,
      damping: 25,
      delay: 0.1
    }
  },
  exit: { 
    opacity: 0, 
    x: 100,
    transition: { 
      type: 'spring',
      stiffness: 300,
      damping: 30
    }
  }
};

export const detailPanelVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } }
};