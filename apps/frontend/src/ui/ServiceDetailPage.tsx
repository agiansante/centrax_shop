import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';

export function ServiceDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const service = useQuery({ queryKey: ['service', id], queryFn: () => api.service(id!), enabled: Boolean(id) });
  const reanalyze = useMutation({
    mutationFn: () => api.reanalyze(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['service', id] })
  });

  if (!service.data) {
    return <section className="page">Caricamento...</section>;
  }

  return (
    <section className="page">
      <header className="pageHeader">
        <div>
          <Link to="/" className="mutedLink">Campagne</Link>
          <h1>{service.data.name}</h1>
          <p>{service.data.description}</p>
        </div>
        <button className="primaryButton" onClick={() => reanalyze.mutate()} disabled={reanalyze.isPending}>
          <RefreshCw size={16} />
          Rianalizza
        </button>
      </header>

      <div className="detailLayout">
        <section>
          <h2>Profilo</h2>
          <dl className="definitionList">
            <dt>Compatibilità Shopify</dt>
            <dd>{service.data.shopifyEvidence ?? 'Non rilevata'}</dd>
            <dt>Costi</dt>
            <dd>{service.data.pricingSummary ?? 'Non rilevati'}</dd>
            <dt>Documentazione</dt>
            <dd>{service.data.docsUrl ? <a href={service.data.docsUrl}>{service.data.docsUrl}</a> : 'Non rilevata'}</dd>
            <dt>Confidence</dt>
            <dd>{Math.round(service.data.confidenceScore * 100)}%</dd>
          </dl>
        </section>
        <section>
          <h2>Evidenze</h2>
          <div className="evidenceList">
            {service.data.evidenceItems?.map((item) => (
              <article key={item.id}>
                <span>{item.type}</span>
                <p>{item.snippet}</p>
                <a href={item.url} target="_blank" rel="noreferrer">{item.url}</a>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
