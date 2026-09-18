import { createContext, useContext, useMemo, useState } from "react";

type AgentShellState = {
  activeWorkspace: "personal";
  connection: "not_configured";
  setActiveWorkspace: (workspace: "personal") => void;
};

const AgentStateContext = createContext<AgentShellState | null>(null);

export function AgentStateProvider({ children }: { children: React.ReactNode }) {
  const [activeWorkspace, setActiveWorkspace] = useState<"personal">("personal");
  const value = useMemo(
    () => ({ activeWorkspace, connection: "not_configured" as const, setActiveWorkspace }),
    [activeWorkspace],
  );

  return <AgentStateContext.Provider value={value}>{children}</AgentStateContext.Provider>;
}

export function useAgentState() {
  const context = useContext(AgentStateContext);
  if (!context) throw new Error("useAgentState must be used within AgentStateProvider");
  return context;
}
