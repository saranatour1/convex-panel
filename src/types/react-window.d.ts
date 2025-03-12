declare module 'react-window' {
  import * as React from 'react';

  export interface ListChildComponentProps {
    index: number;
    style: React.CSSProperties;
    data: any;
  }

  export interface FixedSizeListProps {
    children: React.ComponentType<ListChildComponentProps>;
    className?: string;
    height: number;
    itemCount: number;
    itemSize: number;
    width: number | string;
    itemData?: any;
    style?: React.CSSProperties;
    useIsScrolling?: boolean;
    direction?: 'ltr' | 'rtl';
    layout?: 'horizontal' | 'vertical';
    overscanCount?: number;
  }

  export class FixedSizeList extends React.Component<FixedSizeListProps> {}
} 