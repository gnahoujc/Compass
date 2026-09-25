import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { takeAuthError } from './lib/auth';
import { createSupabase, supabaseConfig } from './lib/supabase';
import './styles.css';

// Read a failed sign-in link's error before the client starts processing the URL.
const initialAuthError = takeAuthError();
const config = supabaseConfig();
const client = config ? createSupabase(config) : null;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App client={client} initialAuthError={initialAuthError} />
  </StrictMode>,
);
