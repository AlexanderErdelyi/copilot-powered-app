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
import Activities from './pages/Activities';
import Settings from './pages/Settings';
import WakeWordListener from './components/WakeWordListener';
import { InsightsProvider } from './contexts/InsightsContext';

function App() {
  return (
    <Router>
      <InsightsProvider>
        <WakeWordListener />
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/receipts" element={<Receipts />} />
            <Route path="/receipts/:id" element={<Receipts />} />
            <Route path="/receipts/categories" element={<Categories />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/shopping-lists" element={<ShoppingLists />} />
            <Route path="/meal-planner" element={<MealPlanner />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/voice-assistant" element={<VoiceAssistant />} />
            <Route path="/settings" element={<Settings />} />
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
      </InsightsProvider>
    </Router>
  );
}

export default App;
