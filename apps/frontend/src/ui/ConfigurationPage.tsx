import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

/**
 * Mostra provider ricerca, provider AI e tool agentici disponibili.
 *
 * Usata da:
 * - apps/frontend/src/main.tsx
 *
 * Permette di capire se il cervello ricerca sta usando provider reali o modalita demo.
 */
export function ConfigurationPage() {
  const configuration = useQuery({
    queryKey: ['research-configuration'],
    queryFn: api.researchConfiguration
  });

  if (configuration.isLoading) {
    return <section className="page">Caricamento configurazione...</section>;
  }

  if (configuration.error || !configuration.data) {
    return <section className="page error">Configurazione non disponibile.</section>;
  }

  const data = configuration.data;

  return (
    <section className="page">
      <header className="pageHeader">
        <div>
          <h1>Configurazione</h1>
          <p>Provider, modelli e tool disponibili per il cervello ricerca Centrax.</p>
        </div>
      </header>

      <div className="configGrid">
        <section>
          <h2>Ricerca</h2>
          <dl className="definitionList">
            <dt>Provider selezionato</dt>
            <dd>{data.search.selectedProvider}</dd>
            <dt>Modalita demo</dt>
            <dd>{data.search.isMockMode ? 'Si, provider mock attivo' : 'No, provider reale selezionato'}</dd>
          </dl>
          <div className="providerList">
            {Object.entries(data.search.configuredProviders).map(([name, configured]) => (
              <span className={configured ? 'providerBadge connected' : 'providerBadge'} key={name}>
                {name}: {configured ? 'connesso' : 'non configurato'}
              </span>
            ))}
          </div>
        </section>

        <section>
          <h2>AI</h2>
          <dl className="definitionList">
            <dt>Provider selezionato</dt>
            <dd>{data.ai.selectedProvider}</dd>
            <dt>Modello</dt>
            <dd>{data.ai.selectedModel}</dd>
            <dt>Fallback</dt>
            <dd>{data.ai.fallbackMode ? 'Attivo: manca API key OpenAI' : 'Disattivo'}</dd>
          </dl>
          <div className="providerList">
            {Object.entries(data.ai.configuredProviders).map(([name, configured]) => (
              <span className={configured ? 'providerBadge connected' : 'providerBadge'} key={name}>
                {name}: {configured ? 'connesso' : 'non configurato'}
              </span>
            ))}
          </div>
        </section>
      </div>

      <section className="toolList">
        <h2>Tool registry</h2>
        {data.tools.map((tool) => (
          <article key={tool.name}>
            <div>
              <h3>{tool.name}</h3>
              <p>{tool.description}</p>
            </div>
            <span className={tool.configured ? 'providerBadge connected' : 'providerBadge'}>
              {tool.configured ? 'disponibile' : 'predisposto'}
            </span>
          </article>
        ))}
      </section>
    </section>
  );
}
