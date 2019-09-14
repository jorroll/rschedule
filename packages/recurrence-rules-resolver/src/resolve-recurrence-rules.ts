import { IRecurrenceRuleModule } from '@rschedule/core';
import { TopologicalSort } from './topological-sort';

export function resolveRecurrenceRules<T extends ReadonlyArray<IRecurrenceRuleModule<any, any>>>(
  ruleModules: T,
): T {
  const processed = new Set<string>();
  const nodes = new Map<string, IRecurrenceRuleModule<any, any>>();
  const edges = new Map<string, Set<string>>();

  processDependencies(ruleModules, processed, nodes, edges);

  const ruleSorter = new TopologicalSort(nodes);

  for (const [key, set] of edges) {
    for (const value of set) {
      ruleSorter.addEdge(key, value);
    }
  }

  return (Array.from(ruleSorter.sort().values()).map(({ node }) => node) as any) as T;
}

function processDependencies(
  ruleModules: ReadonlyArray<IRecurrenceRuleModule<any, any>>,
  processed: Set<string>,
  nodes: Map<string, IRecurrenceRuleModule<any, any>>,
  edges: Map<string, Set<string>>,
) {
  for (const ruleModule of ruleModules) {
    processed.add(ruleModule.name);
    const deps = ruleModule.deps();
    const selfIndex = deps.findIndex(mod => mod === ruleModule);

    for (let i = 0; i < deps.length; i++) {
      const mod = deps[i];

      nodes.set(mod.name, mod);

      if (selfIndex < i) {
        const set = edges.get(ruleModule.name) || new Set<string>();
        edges.set(ruleModule.name, set.add(mod.name));
      } else if (selfIndex > i) {
        const set = edges.get(mod.name) || new Set<string>();
        edges.set(mod.name, set.add(ruleModule.name));
      }

      if (!processed.has(mod.name)) {
        processDependencies(mod.deps(), processed, nodes, edges);
      }
    }
  }
}
