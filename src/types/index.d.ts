import { LogEntry } from "../logs/types";

import { ReactNode } from "react";
import { LogType } from "../logs/types";
import { ConvexReactClient } from "convex/react";

// Theme interface
export interface ThemeClasses {
  container?: string;
  header?: string;
  toolbar?: string;
  table?: string;
  tableHeader?: string;
  tableRow?: string;
  text?: string;
  button?: string;
  input?: string;
  successText?: string;
  errorText?: string;
  warningText?: string;
}

// Button props
export type ButtonProps = {
  children?: ReactNode;
  convexUrl?: string;
  initialLimit?: number;
  initialShowSuccess?: boolean;
  initialLogType?: LogType;
  onLogFetch?: (logs: LogEntry[]) => void;
  onError?: (error: string) => void;
  onToggle?: (isOpen: boolean) => void;
  theme?: ThemeClasses | undefined;
  maxStoredLogs?: number;
  convex?: ConvexReactClient;
  deployKey?: string;
  accessToken: string; // Required
}

// Tab types
export type TabTypes = 'logs' | 'data-tables' | 'health';

// Logs container props
export interface LogsContainerProps {
  isOpen: boolean;
  toggleOpen: () => void;
  onToggle?: (isOpen: boolean) => void;
  initialLimit?: number;
  initialShowSuccess?: boolean;
  initialLogType?: LogType;
  onLogFetch?: (logs: LogEntry[]) => void;
  onError?: (error: string) => void;
  theme?: ThemeClasses;
  maxStoredLogs?: number;
  position: { x: number; y: number };
  setPosition: (position: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  containerSize: { width: number; height: number };
  setContainerSize: (size: { width: number; height: number }) => void;
  dragControls: any;
  convex: ConvexReactClient;
  adminClient: ConvexClient | null;
  initialActiveTab: TabTypes;
  accessToken: string;
  deployUrl?: string;
}