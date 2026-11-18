import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from '@/components/MainLayout';
import ChatPage from '@/pages/ChatPage';
import KnowledgePage from '@/pages/KnowledgePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<ChatPage />} />
          <Route path="knowledge" element={<KnowledgePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
