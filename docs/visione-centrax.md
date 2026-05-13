# Visione Centrax

Questo documento descrive la visione di base del sistema Centrax.

Non e un documento definitivo. Deve crescere nel tempo insieme al progetto e agli altri progetti dello stesso ecosistema.

## Idea centrale

Centrax vuole essere un sistema multi cervello.

Il sistema non deve diventare un unico blocco enorme che fa tutto, ma un insieme di componenti indipendenti che collaborano tra loro.

Ogni componente ha una responsabilita chiara:

- un cervello ricerca, scopre e acquisisce informazioni;
- un cervello elabora, organizza, immagazzina e gestisce conoscenza;
- un cervello applica, attua, automatizza o produce risultati operativi.

Questi cervelli devono poter lavorare in modo indipendente, ma devono anche potersi scambiare informazioni attraverso un modulo centrale.

## Modulo centrale

Centrax e il modulo centrale che riceve, interpreta e smista le richieste.

Il suo compito non e fare tutto direttamente. Il suo compito e:

- ricevere messaggi e richieste di attivita;
- ricevere richieste generate dai singoli cervelli quando un componente ha bisogno del lavoro di un altro componente;
- capire quale componente e piu adatto a gestirle;
- decidere a quale cervello assegnare un compito;
- mediare tra componenti diversi;
- pesare le scelte quando ci sono piu possibilita;
- conservare lo stato utile per prendere decisioni migliori;
- rendere visibile perche una richiesta e stata instradata in un certo modo.

Il modulo centrale deve quindi essere il punto di coordinamento, non un collo di bottiglia confuso.

## Cervelli del sistema

### Cervello di ricerca e acquisizione

Questo componente cerca informazioni nel mondo esterno.

Esempi:

- ricerca web;
- scraping controllato;
- acquisizione dati da API;
- lettura documenti;
- analisi di siti o fonti esterne;
- raccolta segnali di mercato, trend e opportunita.

Deve produrre dati grezzi o semi-strutturati, sempre accompagnati da contesto, fonte, data e livello di affidabilita.

### Cervello di elaborazione e memoria

Questo componente trasforma le informazioni in conoscenza utilizzabile.

Esempi:

- normalizzazione dati;
- deduplica;
- classificazione;
- arricchimento;
- collegamento tra entita;
- salvataggio in database;
- creazione di memoria storica;
- calcolo di punteggi e priorita.

Deve rendere i dati confrontabili, interrogabili e riutilizzabili dagli altri componenti.

### Cervello operativo

Questo componente applica le decisioni e produce azioni.

Esempi:

- generazione report;
- esportazioni;
- automazioni;
- creazione di task;
- avvio di job;
- generazione di documenti tecnici;
- proposta di integrazioni o connettori;
- esecuzione di workflow controllati.

Deve ricevere input gia pesati dal modulo centrale e restituire esiti chiari.

## Regole di sviluppo

Ogni nuovo componente deve rispettare queste regole:

- responsabilita singola e nome chiaro;
- input e output documentati;
- nessun componente deve conoscere dettagli interni inutili degli altri componenti;
- lo scambio di informazioni deve passare da contratti espliciti;
- ogni decisione importante deve lasciare una traccia leggibile;
- ogni componente deve poter essere testato o diagnosticato da solo;
- le funzioni critiche devono avere healthcheck, diagnostica o test mirati;
- il sistema deve poter crescere per moduli, senza riscrivere tutto.

## Messaggi e richieste

Centrax smista messaggi di richiesta attivita.

Le richieste possono arrivare da un utente, da un processo automatico o da uno dei cervelli del sistema.

Un cervello non deve chiamare direttamente un altro cervello quando la scelta richiede valutazione, priorita o tracciamento. Deve invece inviare una richiesta a Centrax, che decide a chi assegnare il compito e registra il motivo della scelta.

Una richiesta dovrebbe contenere almeno:

- obiettivo;
- contesto;
- dati disponibili;
- priorita;
- vincoli;
- componente suggerito, se gia noto;
- risultato atteso;
- stato della richiesta.

Nel tempo questi messaggi potranno diventare una struttura dati formale.

Per ora il principio guida e semplice: ogni richiesta deve essere comprensibile da una persona e da un modulo software.

## Peso delle scelte

Quando piu componenti possono gestire una richiesta, Centrax deve pesare la scelta.

Esempi di fattori:

- affidabilita del componente;
- costo computazionale;
- tempo previsto;
- freschezza dei dati;
- rischio di errore;
- impatto sull'utente;
- necessita di conferma umana;
- storico delle decisioni precedenti.

La scelta non deve essere nascosta. Quando possibile, il sistema deve spiegare perche ha scelto una strada.

## Applicazione a questo progetto

Questo progetto di analisi dropshipping e Shopify e uno dei primi casi pratici della visione Centrax.

In questa applicazione:

- la ricerca campagne e discovery rappresentano il cervello di acquisizione;
- analisi, regole, deduplica, catalogo e database rappresentano il cervello di elaborazione e memoria;
- dashboard, report, export, notifiche e futuri connettori Shopify rappresentano il cervello operativo;
- il backend coordina job, stati, risultati e decisioni, avvicinandosi al ruolo di modulo centrale.

Le future feature devono essere progettate tenendo presente questa separazione.

## Direzione futura

Questa visione andra sviluppata meglio nel tempo.

Prossimi punti da chiarire:

- formato standard dei messaggi tra componenti;
- regole per assegnare una richiesta a un cervello;
- modello dati per tracciare decisioni e punteggi;
- confini tra modulo centrale e moduli specialistici;
- come riusare Centrax in altri progetti dello stesso ecosistema;
- quali parti devono essere automatiche e quali devono richiedere conferma umana.

La regola pratica e: ogni nuova feature deve rafforzare la capacita del sistema di osservare, decidere, ricordare e agire in modo modulare.
