import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const InsightsContext = createContext();

export function useInsights() {
  const context = useContext(InsightsContext);
  if (!context) {
    throw new Error('useInsights must be used within InsightsProvider');
  }
  return context;
}

export function InsightsProvider({ children }) {
  const [anomalies, setAnomalies] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [stats, setStats] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchInsightsData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      console.log(`🔄 ${isRefresh ? 'Refreshing' : 'Pre-loading'} insights data in background...`);
      const startTime = Date.now();

      // Fetch all datasets in parallel (including stats for Quick Stats section)
      const [anomaliesRes, predictionRes, recommendationsRes, statsRes, categoryRes] = await Promise.all([
        axios.get('/api/insights/anomalies').catch(err => {
          console.error('Error fetching anomalies:', err);
          return { data: [] };
        }),
        axios.get('/api/insights/budget-prediction').catch(err => {
          console.error('Error fetching prediction:', err);
          return { data: null };
        }),
        axios.get('/api/recommendations/category', {
          timeout: 35000 // 35 second timeout to allow AI processing
        }).catch(err => {
          console.error('Error fetching recommendations:', err);
          return { data: [] };
        }),
        axios.get('/api/dashboard/stats').catch(err => {
          console.error('Error fetching stats:', err);
          return { data: null };
        }),
        axios.get('/api/dashboard/category-breakdown').catch(err => {
          console.error('Error fetching categories:', err);
          return { data: [] };
        })
      ]);

      setAnomalies(anomaliesRes.data || []);
      setPrediction(predictionRes.data);
      
      // Handle both array and object response formats
      const recsData = recommendationsRes.data;
      setRecommendations(Array.isArray(recsData) ? recsData : (recsData.recommendations || []));
      
      // Set stats for Quick Stats section
      if (statsRes.data) {
        const statsData = statsRes.data;
        statsData.healthScore = statsData.healthyPercentage || 0;
        setStats(statsData);
      }
      
      setCategoryData(categoryRes.data || []);
      
      setLastFetch(new Date());
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`✅ Insights data ${isRefresh ? 'refreshed' : 'pre-loaded'} successfully in ${duration}s`);
      
      if (recommendationsRes.data?.length > 0 || recsData?.recommendations?.length > 0) {
        const count = Array.isArray(recsData) ? recsData.length : (recsData.recommendations?.length || 0);
        console.log(`   📊 Loaded ${count} recommendations`);
      }
    } catch (error) {
      console.error('Error fetching insights data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Pre-fetch data when app loads
  useEffect(() => {
    console.log('🚀 InsightsProvider mounted - starting background data fetch...');
    fetchInsightsData(false);
  }, [fetchInsightsData]);

  const refresh = useCallback(() => {
    return fetchInsightsData(true);
  }, [fetchInsightsData]);

  const value = {
    anomalies,
    prediction,
    recommendations,
    stats,
    categoryData,
    loading,
    refreshing,
    lastFetch,
    refresh
  };

  return (
    <InsightsContext.Provider value={value}>
      {children}
    </InsightsContext.Provider>
  );
}

export default InsightsContext;
