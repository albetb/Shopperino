import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App';
import store from './store/store';

// SSR-safe default body classes so the first paint matches the saved theme/accent
// without a flash. App.jsx replaces these on mount with the persisted values.
if (typeof document !== 'undefined' && document.body) {
  const initial = document.body.className.split(/\s+/).filter(c => c && !c.startsWith('theme-') && !c.startsWith('accent-'));
  initial.push('theme-dark', 'accent-crimson');
  document.body.className = initial.join(' ');
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);
