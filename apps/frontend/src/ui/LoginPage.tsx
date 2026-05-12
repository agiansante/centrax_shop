import { useMutation } from '@tanstack/react-query';
import { ChangeEvent, FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

/**
 * Mostra la pagina di login e registrazione dell'applicazione.
 *
 * Usata da:
 * - apps/frontend/src/main.tsx
 *
 * Gestisce email, password, scelta login/registrazione e salvataggio token.
 */
export function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('change-me-please');

  const mutation = useMutation({
    mutationFn: submitAuthenticationRequest,
    onSuccess: handleAuthenticationSuccess
  });

  /**
   * Invia al backend la richiesta corretta in base alla modalita selezionata.
   *
   * Usata da:
   * - useMutation dentro LoginPage.
   *
   * Legge email/password dallo stato React e restituisce la sessione backend.
   */
  function submitAuthenticationRequest() {
    if (mode === 'login') {
      return api.login(email, password);
    }

    return api.register(email, password);
  }

  /**
   * Salva il token JWT e porta l'utente alla dashboard.
   *
   * Usata da:
   * - useMutation dentro LoginPage.
   *
   * Riceve la risposta di login/registrazione dal backend.
   */
  function handleAuthenticationSuccess(data: { accessToken: string }) {
    localStorage.setItem('accessToken', data.accessToken);
    navigate('/');
  }

  /**
   * Intercetta il submit del form ed esegue la mutation di autenticazione.
   *
   * Usata da:
   * - form principale della pagina.
   */
  function submit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  /**
   * Imposta il form in modalita login.
   *
   * Usata da:
   * - pulsante Login nel selettore modalita.
   */
  function selectLoginMode() {
    setMode('login');
  }

  /**
   * Imposta il form in modalita registrazione.
   *
   * Usata da:
   * - pulsante Registrati nel selettore modalita.
   */
  function selectRegisterMode() {
    setMode('register');
  }

  /**
   * Aggiorna lo stato email leggendo il valore dall'input.
   *
   * Usata da:
   * - campo email del form.
   */
  function updateEmailFromInput(event: ChangeEvent<HTMLInputElement>) {
    setEmail(event.target.value);
  }

  /**
   * Aggiorna lo stato password leggendo il valore dall'input.
   *
   * Usata da:
   * - campo password del form.
   */
  function updatePasswordFromInput(event: ChangeEvent<HTMLInputElement>) {
    setPassword(event.target.value);
  }

  return (
    <div className="loginPage">
      <form className="authPanel" onSubmit={submit}>
        <h1>Dropship Intel</h1>
        <div className="segmented">
          <button type="button" className={mode === 'login' ? 'selected' : ''} onClick={selectLoginMode}>
            Login
          </button>
          <button type="button" className={mode === 'register' ? 'selected' : ''} onClick={selectRegisterMode}>
            Registrati
          </button>
        </div>
        <label>
          Email
          <input value={email} onChange={updateEmailFromInput} type="email" />
        </label>
        <label>
          Password
          <input value={password} onChange={updatePasswordFromInput} type="password" />
        </label>
        {mutation.error ? <p className="error">{mutation.error.message}</p> : null}
        <button className="primaryButton" disabled={mutation.isPending}>
          {mutation.isPending ? 'Attendere...' : mode === 'login' ? 'Entra' : 'Crea account'}
        </button>
      </form>
    </div>
  );
}
