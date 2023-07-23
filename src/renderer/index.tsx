import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

import { appPreferences } from '../../package.json';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);

const { isInDevelopment } = window.api.properties;
const { removeReactStrictMode } = appPreferences;
root.render(
  // $ Enabling React.StrictMode throws an error in the CurrentQueuePage when using react-beautiful-dnd for drag and drop. To prevent that error, we remove the use of StrictMode when in development.
  isInDevelopment && removeReactStrictMode ? (
    <App />
  ) : (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  ),
);
