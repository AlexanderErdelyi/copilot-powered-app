import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Receipts from './pages/Receipts';
import ShoppingLists from './pages/ShoppingLists';
import MealPlanner from './pages/MealPlanner';
import Insights from './pages/Insights';
import Achievements from './pages/Achievements';
import VoiceAssistant from './pages/VoiceAssistant';
import Categories from './pages/Categories';
import WakeWordListener from './components/WakeWordListener';

function App() {
  return (
    <Router>
      <WakeWordListener />
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/receipts" element={<Receipts />} />
          <Route path="/shopping-lists" element={<ShoppingLists />} />
          <Route path="/meal-planner" element={<MealPlanner />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/voice-assistant" element={<VoiceAssistant />} />
          <Route path="/categories" element={<Categories />} />
        </Routes>
      </Layout>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
          },
        }}
      />
    </Router>
  );
}

export default App;
