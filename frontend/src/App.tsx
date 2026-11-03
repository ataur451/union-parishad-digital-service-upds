import { createElement } from 'react';
import { AppLayout } from './layouts/AppLayout';
import { ServicesPage } from './pages/ServicesPage';
// @ts-ignore CSS files are loaded by the bundler, not TypeScript.
import './App.css';

function App() {
  return createElement(AppLayout, null, createElement(ServicesPage));
}

export default App;