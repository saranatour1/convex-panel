import { CodeBracketIcon } from '../components/icons';
import { File } from '../types';
import { useFunctionsState } from './FunctionsProvider';

interface FileItemProps {
  file: File;
  nestingLevel: number;
}

export function FileItem({ file, nestingLevel }: FileItemProps) {
  const { selectedFunction, setSelectedFunction } = useFunctionsState();

  return (
    <div>
      {file.functions.map((fn) => (
        <div
          key={fn.identifier}
          className={`convex-panel-tree-item ${selectedFunction?.identifier === fn.identifier ? 'active' : ''}`}
          style={{ paddingLeft: `${nestingLevel * 8}px` }}
          onClick={() => setSelectedFunction(fn)}
        >
          <CodeBracketIcon className="convex-panel-tree-icon" />
          <span>{fn.name}</span>
          <span>{fn.udfType}</span>
        </div>
      ))}
    </div>
  );
} 