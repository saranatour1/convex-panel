import { useCallback, useContext } from "react";
import { createGlobalState, useLocalStorage } from "react-use";
import { useRouter } from "next/router";
import {
  useModuleFunctions,
  displayNameToIdentifier,
} from "../functions/FunctionsProvider";
import { ModuleFunction, UdfType } from "../types";
import { ComponentId, useNents } from "../hooks/useNents";
import { useTableMetadata } from "../hooks/useTableMetadata";
import { DeploymentInfoContext } from "../context/deploymentContext";

// Define the base interface for functions
interface BaseFunctionType {
  type: string;
  udfType?: UdfType;
  visibility?: {
    kind: 'public' | 'internal';
  };
  identifier?: string;
  componentId?: ComponentId;
}

export type CustomQuery = {
  type: "customQuery";
  table: string | null;
  componentId?: ComponentId;
};

// Extend ModuleFunction to include required properties
export type ExtendedModuleFunction = ModuleFunction & {
  type: "module";
  componentId: ComponentId;
};

export const useCurrentGloballyOpenFunction = createGlobalState<ExtendedModuleFunction | null>(null);

const useGlobalRunnerShown = createGlobalState(false);
export const useGlobalRunnerSelectedItem = createGlobalState<{
  componentId: ComponentId;
  fn: ExtendedModuleFunction | CustomQuery;
} | null>(null);

export function useIsGlobalRunnerShown() {
  const [isShown] = useGlobalRunnerShown();
  return isShown;
}

export function useShowGlobalRunner() {
  const [, setGlobalRunnerShown] = useGlobalRunnerShown();
  const [selectedItem, setGlobalRunnerSelectedItem] = useGlobalRunnerSelectedItem();
  const { selectedNent } = useNents();
  const defaultFunction = useDefaultFunction();
  const [currentlyOpenFunction] = useCurrentGloballyOpenFunction();
  const tableMetadata = useTableMetadata();

  // only for logging
  const context = useContext(DeploymentInfoContext);
  const log = context?.useLogDeploymentEvent() ?? (() => {});
  const [isGlobalRunnerVertical] = useLocalStorage("functionRunnerOrientation", false);

  return useCallback(
    (selected: ExtendedModuleFunction | CustomQuery | null, how: "click" | "keyboard" | "tutorial" | "redirect") => {
      log(`open function runner`, {
        how,
        orientation: isGlobalRunnerVertical ? "vertical" : "horizontal",
        function: selected?.type !== "customQuery" && selected !== null && {
          udfType: selected.udfType,
          visibility: selected.visibility,
          identifier: selected.identifier,
        },
        customQuery: selected?.type === "customQuery",
      });

      if (selected || !selectedItem) {
        const fn = selected ?? currentlyOpenFunction ?? defaultFunction ?? {
          type: "customQuery" as const,
          table: tableMetadata?.name ?? null,
          componentId: selectedNent?.id ?? null,
        };
        setGlobalRunnerSelectedItem({
          componentId: fn.type === "customQuery" ? (selectedNent?.id ?? null) : fn.componentId,
          fn: fn as ExtendedModuleFunction | CustomQuery,
        });
      }
      setGlobalRunnerShown(true);
    },
    [
      log,
      isGlobalRunnerVertical,
      selectedItem,
      setGlobalRunnerShown,
      currentlyOpenFunction,
      defaultFunction,
      tableMetadata?.name,
      setGlobalRunnerSelectedItem,
      selectedNent,
    ],
  );
}

export function useHideGlobalRunner() {
  const [, setGlobalRunnerShown] = useGlobalRunnerShown();
  const context = useContext(DeploymentInfoContext);
  const log = context?.useLogDeploymentEvent() ?? (() => {});
  return useCallback(
    (how: "click" | "redirect" | "keyboard") => {
      log(`close function runner`, { how });
      setGlobalRunnerShown(false);
    },
    [log, setGlobalRunnerShown],
  );
}

function useDefaultFunction() {
  const { query } = useRouter();
  const moduleFunctions = useModuleFunctions();
  const { selectedNent } = useNents();
  const defaultFunction = query.function?.toString();
  return (
    (defaultFunction !== undefined
      ? findFunction(moduleFunctions as ExtendedModuleFunction[], displayNameToIdentifier(defaultFunction), selectedNent?.id ?? null)
      : findFirstWritingFunction(moduleFunctions as ExtendedModuleFunction[], selectedNent?.id ?? null)) ?? null
  );
}

export function findFirstWritingFunction(functions: ExtendedModuleFunction[], selectedNentId: ComponentId) {
  return functions.find(
    (item) => isWritingFunction(item) && item.componentId === selectedNentId,
  );
}

function isWritingFunction(fn: ExtendedModuleFunction) {
  return fn.udfType === "mutation" || fn.udfType === "action";
}

export function findFunction(functions: ExtendedModuleFunction[], identifier: string, componentId: ComponentId) {
  return functions.find(
    (value) => value.identifier === identifier && value.componentId === componentId,
  );
} 