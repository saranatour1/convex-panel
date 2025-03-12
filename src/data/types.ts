import { ConvexReactClient } from 'convex/react';
import { ConvexClient } from 'convex/browser';
import { ThemeClasses } from '../types';
import { ConvexPanelSettings } from '../settings/SettingsModal';

export interface TableField {
  fieldName: string;
  optional: boolean;
  shape: {
    type: string;
    fields?: TableField[];
    tableName?: string;
    float64Range?: {
      hasSpecialValues: boolean;
    };
    shape?: {
      type: string;
      tableName?: string;
    };
  };
}

export interface TableSchema {
  type: string;
  fields: TableField[];
}

export interface TableDefinition {
  [key: string]: TableSchema;
}

export interface TableDocument {
  _id: string;
  [key: string]: any;
}

export interface PageArgs {
  paginationOpts: PaginationOptions;
  table: string;
  filters: string | null;
  componentId?: string | null;
}

export interface PaginationOptions {
  cursor: string | null;
  numItems: number;
  id?: number;
}

export interface FilterClause {
  op: 'eq' | 'neq' | 'gte' | 'lte' | 'gt' | 'lt' | 'anyOf' | 'noneOf';
  field: string;
  value: any;
  enabled: boolean;
  theme?: any;
}

export interface FilterExpression {
  clauses: FilterClause[];
}

export interface MenuPosition {
  top: number;
  left: number;
}

export interface DataTableProps {
  convexUrl: string;
  accessToken: string;
  onError?: (error: string) => void;
  theme?: ThemeClasses;
  baseUrl: string;
  convex: ConvexReactClient;
  adminClient: ConvexClient;
  settings?: ConvexPanelSettings;
}

export interface FilterMenuProps {
  field: string;
  position: MenuPosition;
  onApply: (filter: FilterClause) => void;
  onClose: () => void;
  existingFilter?: FilterClause;
  theme?: ThemeClasses;
}

export interface FilterDebugProps {
  filters: FilterExpression;
  selectedTable: string;
}

export interface ActiveFiltersProps {
  filters: FilterExpression;
  onRemove: (field: string) => void;
  onClearAll: () => void;
  selectedTable: string;
  theme?: ThemeClasses;
  onEdit?: (e: React.MouseEvent, field: string) => void;
}

export interface DataTableSidebarProps {
  tables: TableDefinition;
  selectedTable: string;
  searchText: string;
  onSearchChange: (text: string) => void;
  onTableSelect: (tableName: string) => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  theme?: any;
}

export interface DataTableContentProps {
  documents: TableDocument[];
  columnHeaders: string[];
  isLoading: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  observerTarget: (node: HTMLDivElement) => void;
  onFilterButtonClick: (e: React.MouseEvent, header: string) => void;
  filterMenuField: string | null;
  filterMenuPosition: MenuPosition | null;
  handleFilterApply: (filter: FilterClause) => void;
  onFilterMenuClose: () => void;
  formatValue: (value: any) => string;
  activeFilters: FilterExpression;
} 