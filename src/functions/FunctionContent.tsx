import { useEffect, useState } from 'react';
import { PlayIcon, ClipboardIcon } from '../components/icons';
import { ModuleFunction } from '../types';
import { PerformanceGraphs } from './PerformanceGraphs';
import { useFunctionsState } from './FunctionsProvider';
import { MonacoEditor } from '../components/MonacoEditor';
import { fetchSourceCode } from '../utils/api';
import { functionTypeLabel } from '../utils/functionTypeLabel';
import { ThemeClasses } from '../types';
import { findLineNumbers } from '../utils/findLineNumbers';

type FunctionTab = 'insights' | 'code';

interface FunctionContentProps {
  function: ModuleFunction;
  authToken: string;
  baseUrl: string;
  theme: ThemeClasses;
}

export function FunctionContent({ function: fn, authToken, baseUrl, theme }: FunctionContentProps) {
  const { executeFunction } = useFunctionsState();
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [sourceCode, setSourceCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FunctionTab>('insights');
  const [copied, setCopied] = useState(false);
  const [showCopyButton, setShowCopyButton] = useState(false);
  const [functionLineNumber, setFunctionLineNumber] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const functionPath = fn.file.path.split(':')[0]
        const code = await fetchSourceCode(baseUrl, authToken, functionPath);
        let cleanCode = code;
        
        if (typeof code === 'string' && code.startsWith('"') && code.endsWith('"')) {
          try {
            cleanCode = JSON.parse(code);
          } catch (e) {
            console.error('Error parsing code string:', e);
          }
        }
        setSourceCode(cleanCode);

        // Find the line number for this function
        const lineNumbers = findLineNumbers(cleanCode, [fn.name]);
        const lineNumber = lineNumbers.get(fn.name);
        setFunctionLineNumber(lineNumber ?? null);
      } catch (err) {
        console.error('Error fetching source code:', err);
        setError('Failed to fetch source code');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fn.identifier, baseUrl, authToken]);

  const handleRun = async () => {
    setIsRunning(true);
    setResult(null);
    setError(null);

    try {
      const result = await executeFunction(fn);
      setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fn.file.path);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy path:', err);
    }
  };

  if (loading) {
    return (
      <div className="convex-panel-loading-container">
        <div className="convex-panel-loading-spinner" />
        <span>Loading function details...</span>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden overflow-auto" style={{ padding: '1rem', width: "100%" }}>
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4px' }}>
                    <span className="font-mono text-lg hover:text-gray-300" onClick={handleCopy} style={{ fontWeight: "bold" }}>
                    {fn.file.path}
                    </span>
                    <div className="px-2 py-0.5 text-xs font-medium text-gray-200" style={{ border: '1px solid #444', borderRadius: '4px' }}>
                        {functionTypeLabel(fn.udfType)}
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "4px" }}
                    onMouseEnter={() => setShowCopyButton(true)}
                    onMouseLeave={() => setShowCopyButton(false)}
                >
                    <div 
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #444", backgroundColor: "#1a1a1a", borderRadius: "4px", position: "relative", padding: "0px 4px" }}
                    >
                        {fn.file.path}:{fn.name}
                    </div>
                    {showCopyButton && (
                        <button 
                        className="ml-2 text-gray-400 hover:text-gray-200" 
                        onClick={handleCopy}
                        >
                        <ClipboardIcon className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
            </div>

          {["query", "mutation", "action"].includes(fn.udfType.toLowerCase()) && (
            <button
              className={`convex-panel-live-button ${theme.input}`}
              onClick={handleRun}
              disabled={isRunning}
            >
              <PlayIcon className="h-4 w-4" />
              Run Function
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b" style={{ borderColor: '#444' }}>
        <div role="tablist" className="flex">
          <button
            role="tab"
            aria-selected={activeTab === 'insights'}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'insights'
                ? 'text-cp-accent border-cp-accent'
                : 'text-gray-400 border-transparent hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('insights')}
          >
            Insights
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'code'}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'code'
                ? 'text-cp-accent border-cp-accent'
                : 'text-gray-400 border-transparent hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('code')}
          >
            Code
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded bg-red-900/20 p-4 text-sm text-red-500">
          {error}
        </div>
      )}

      {result !== null && (
        <div className="mt-4 rounded bg-gray-800 p-4">
          <h4 className="mb-2 text-sm font-medium text-gray-200">Result</h4>
          <pre className="text-sm text-gray-300">
            {typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)}
          </pre>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'insights' && (
        <PerformanceGraphs
          functionId={fn.identifier}
          functionPath={fn.file.path}
          udfType={fn.udfType}
          authToken={authToken}
          baseUrl={baseUrl}
        />
      )}

      {activeTab === 'code' && sourceCode && (
        <div className="flex-1 overflow-hidden border-none">
          <MonacoEditor
            value={sourceCode}
            readOnly={true}
            language="typescript"
            theme='clouds-midnight'
            highlightLines={functionLineNumber ? {
              startLine: functionLineNumber,
              endLine: functionLineNumber
            } : null}
            options={{
              minimap: {
                enabled: false
              },
              wordWrap: 'on',
              fontSize: 14,
              fontWeight: 'normal',
              fontFamily: 'monospace',
            }}
          />
        </div>
      )}
    </div>
  );
} 