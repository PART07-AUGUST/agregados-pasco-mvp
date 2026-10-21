import { useState } from 'react';
import { MlComparisonHeader } from './MlComparisonHeader';
import { MlComparisonStatus } from './MlComparisonStatus';
import { MlComparisonTable } from './MlComparisonTable';
import { MlRouteSimulator } from './MlRouteSimulator';
import { useMlComparisonData } from '../hooks/useMlComparisonData';
import { useMlLiveSimulation, type MlSimulatorInput } from '../hooks/useMlLiveSimulation';

const DEFAULT_INPUT: MlSimulatorInput = {
  distanciaKm: '25',
  desnivelMetros: '120',
  pesoCargaTon: '18',
};

export function MlComparisonPanel() {
  const [input, setInput] = useState(DEFAULT_INPUT);
  const comparisonData = useMlComparisonData();
  const { comparison } = comparisonData;
  const candidateModels = comparison?.modelos.filter((model) => !model.es_referencia) ?? [];
  const simulation = useMlLiveSimulation(
    input,
    comparison?.version ?? '',
    candidateModels.length === 5
  );
  const trainingSources = candidateModels[0];
  const error = comparisonData.error ?? simulation.error;

  const updateInput = (field: keyof MlSimulatorInput, value: string) => {
    setInput((current) => ({ ...current, [field]: value }));
  };

  return (
    <section className="space-y-6">
      <MlComparisonHeader
        version={comparison?.version ?? null}
        lastUpdatedAt={comparisonData.lastUpdatedAt}
        refreshing={comparisonData.refreshing}
        onRefresh={comparisonData.refresh}
      />
      <MlComparisonStatus comparison={comparison} trainingSources={trainingSources} error={error} />

      <MlComparisonTable
        comparison={comparison}
        loading={comparisonData.loading}
        simulationLoading={simulation.loading}
        predictions={simulation.predictions}
      />
      <MlRouteSimulator
        input={input}
        candidateCount={candidateModels.length}
        loading={simulation.loading}
        onChange={updateInput}
      />
    </section>
  );
}
