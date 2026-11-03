import React from 'react';
import './App.css';
import { AppLayout } from './layouts/AppLayout';
import { ServicesPage } from './pages/ServicesPage';

function App() {
  return (
    <AppLayout>
      <ServicesPage />
    </AppLayout>
  );
}

export default App;