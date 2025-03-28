import { useEffect, useState } from 'react';
import { ClipboardIcon } from '../components/icons';
import { ModuleFunction } from '../types';
import { PerformanceGraphs } from './PerformanceGraphs';
import { useFunctionsState } from './FunctionsProvider';
import { MonacoEditor } from '../components/MonacoEditor';
import { fetchSourceCode } from '../utils/api';
import { functionTypeLabel } from '../utils/functionTypeLabel';
import { ThemeClasses } from '../types';
import { findLineNumbers } from '../utils/findLineNumbers';
import { FunctionTabTypes } from '../utils/constants';

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
  const [activeTab, setActiveTab] = useState<FunctionTabTypes>('insights');
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
    setActiveTab('function input');

    console.log('Running function:', fn);

    try {
      const functionResult = await executeFunction(fn);

      console.log('Function result:', functionResult);

      if (functionResult.success) {
        setResult(functionResult.value);
        // Display log lines if any
        if (functionResult.logLines.length > 0) {
          console.log('Log lines:', functionResult.logLines);
        }
      } else {
        setError(functionResult.errorMessage || 'An error occurred while executing the function');
        if (functionResult.errorData) {
          console.error('Error data:', functionResult.errorData);
        }
        if (functionResult.logLines.length > 0) {
          console.log('Log lines:', functionResult.logLines);
        }
      }
    } catch (err) {
      console.error('Error executing function:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      console.log('Function execution complete');
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
                    {fn.name}
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

          {/* {["query", "mutation", "action"].includes(fn.udfType.toLowerCase()) && (
            <button
              className={`convex-panel-live-button ${theme.input}`}
              onClick={handleRun}
              disabled={isRunning}
            >
              <PlayIcon className="h-4 w-4" />
              Run Function
            </button>
          )} */}
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
          <button
            role="tab"
            aria-selected={activeTab === 'function input'}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'function input'
                ? 'text-cp-accent border-cp-accent'
                : 'text-gray-400 border-transparent hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('function input')}
          >
            Function Input
          </button>
        </div>
      </div>

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
            className="readonlyEditor"
            value={sourceCode}
            readOnly={true}
            language="typescript"
            theme='clouds-midnight'
            highlightLines={functionLineNumber ? {
              startLine: functionLineNumber,
              endLine: functionLineNumber
            } : null}
            options={{
              fontSize: 14,
              fontFamily: "Menlo, Monaco, 'Courier New', monospace !important",
            }}
          />
        </div>
      )}

      {activeTab === 'function input' && (
        <div className="flex flex-col h-full bg-[#1E1E1E]">
          {/* Component and Function Selectors */}
          <div className="flex flex-col gap-2 p-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-[#2D2D2D] rounded cursor-pointer">
              <span className="text-gray-300">{fn.file.name}</span>
              <svg className="w-4 h-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-[#2D2D2D] rounded cursor-pointer">
              <span className="text-gray-300">{`${fn.file.path}:${fn.name}`}</span>
              <svg className="w-4 h-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* Arguments Section */}
          <div className="px-4">
            <h3 className="text-sm text-gray-400 mb-2">Arguments</h3>
            <div className="bg-[#1E1E1E] border border-[#2D2D2D] rounded p-4 font-mono text-sm">
              <pre className="text-yellow-500">{"{\n}"}</pre>
            </div>
          </div>

          {/* Act as user checkbox */}
          <div className="flex items-center gap-2 px-4 mt-4">
            <input type="checkbox" className="form-checkbox bg-[#2D2D2D] border-[#4D4D4D] rounded" />
            <span className="text-sm text-gray-300">Act as a user</span>
            <button className="ml-1 text-gray-400 hover:text-gray-300">
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Output Section */}
          <div className="mt-4 flex-1 overflow-auto">
            <div className="sticky top-0 z-10 flex items-center gap-4 bg-[#1E1E1E] px-4 py-2 border-y border-[#2D2D2D]">
              <h5 className="text-xs text-gray-400">Output</h5>
              <div className="flex items-center gap-1">
                <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
              </div>
              <button 
                className="ml-auto text-gray-400 hover:text-gray-300"
                onClick={() => {
                  if (result) {
                    navigator.clipboard.writeText(
                      typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)
                    );
                  }
                }}
              >
                <ClipboardIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="px-4 py-2 font-mono text-sm">
              {/* Function execution info */}
              <div className="text-gray-500 mb-2">
                {`[CONVEX ${fn.udfType.toUpperCase()[0]}(${fn.file.path}:${fn.name})]`}
              </div>

              {/* Log messages */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">[LOG]</span>
                <span className="text-gray-300">'USER ID'</span>
                <span className="text-orange-400">null</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">[LOG]</span>
                <span className="text-gray-300">'SESSION ID'</span>
                <span className="text-orange-400">null</span>
              </div>

              {/* Result value */}
              {result !== null && (
                <div className="mt-2 text-orange-400">
                  {typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)}
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="mt-2 text-red-500">
                  {error}
                </div>
              )}

              {/* Empty state */}
              {!result && !error && (
                <div className="mt-2 text-gray-400">
                  Run the function to see the response here.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 