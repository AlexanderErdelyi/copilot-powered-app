import { Trophy, Star, Award, Target, Sparkles, RefreshCw, X, Check, Medal } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

function Achievements() {
  const [achievements, setAchievements] = useState([]);
  const [nextAchievements, setNextAchievements] = useState([]);
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [generatedChallenges, setGeneratedChallenges] = useState([]);
  const [selectedChallenges, setSelectedChallenges] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebratingAchievement, setCelebratingAchievement] = useState(null);
  const [stats, setStats] = useState({ totalUnlocked: 0, activeChallenges: 0, completedChallenges: 0 });
  const [clickedAchievements, setClickedAchievements] = useState(new Set());
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [viewMode, setViewMode] = useState('achievements'); // 'achievements' or 'leaderboard'

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchAchievements(),
        fetchNextAchievements(),
        fetchActiveChallenges(),
        fetchLeaderboard()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAchievements = async () => {
    try {
      const response = await axios.get('/api/achievements');
      const data = response.data || [];
      
      // Map achievements to UI format
      const mapped = data.map(ach => ({
        id: ach.id,
        name: ach.name,
        description: ach.description,
        icon: getIcon(ach.category),
        earned: ach.isUnlocked,
        unlockedDate: ach.unlockedDate,
        color: getColor(ach.category),
        category: ach.category
      }));
      
      setAchievements(mapped);
      
      // Calculate stats
      const unlocked = mapped.filter(a => a.earned).length;
      setStats(prev => ({ ...prev, totalUnlocked: unlocked }));
    } catch (error) {
      console.error('Error fetching achievements:', error);
      setAchievements([]);
    }
  };

  const fetchNextAchievements = async () => {
    try {
      const response = await axios.get('/api/achievements/next');
      setNextAchievements(response.data || []);
    } catch (error) {
      console.error('Error fetching next achievements:', error);
      setNextAchievements([]);
    }
  };

  const fetchActiveChallenges = async () => {
    try {
      const response = await axios.get('/api/challenges');
      const challenges = response.data || [];
      setActiveChallenges(challenges);
      
      // Update stats
      const active = challenges.filter(c => c.status === 'active').length;
      const completed = challenges.filter(c => c.status === 'completed').length;
      setStats(prev => ({ ...prev, activeChallenges: active, completedChallenges: completed }));
    } catch (error) {
      console.error('Error fetching challenges:', error);
      setActiveChallenges([]);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get('/api/leaderboard');
      setLeaderboard(response.data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLeaderboard([]);
    }
  };

  const checkForNewAchievements = async () => {
    setChecking(true);
    try {
      await axios.post('/api/achievements/check');
      toast.success('Achievements checked!');
      
      // Check if there are new achievements to celebrate
      const celebrationRes = await axios.get('/api/achievements/celebration');
      if (celebrationRes.data.hasNew) {
        // Show celebration for the first new achievement
        const newAch = celebrationRes.data.newAchievements[0];
        setCelebratingAchievement(newAch);
        setShowCelebration(true);
        createConfetti();
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
          setShowCelebration(false);
        }, 3000);
      }
      
      await fetchAllData();
    } catch (error) {
      console.error('Error checking achievements:', error);
      toast.error('Failed to check achievements');
    } finally {
      setChecking(false);
    }
  };

  const generateChallenges = async () => {
    setGenerating(true);
    try {
      const response = await axios.get('/api/challenges/generate?count=5');
      const challenges = response.data || [];
      
      // Parse the challenge strings (format: "Name|Description|Type|TargetValue|DurationDays")
      const parsed = challenges.map(c => {
        if (typeof c === 'string' && c.includes('|')) {
          const parts = c.split('|');
          if (parts.length === 5) {
            return {
              name: parts[0],
              description: parts[1],
              type: parts[2],
              targetValue: parseFloat(parts[3]),
              durationDays: parseInt(parts[4])
            };
          }
        }
        return null;
      }).filter(c => c !== null);
      
      if (parsed.length === 0) {
        toast.error('No valid challenges generated');
        return;
      }
      
      setGeneratedChallenges(parsed);
      setSelectedChallenges([]);
      setShowChallengeModal(true);
    } catch (error) {
      console.error('Error generating challenges:', error);
      toast.error('Failed to generate challenges');
    } finally {
      setGenerating(false);
    }
  };

  const acceptSelectedChallenges = async () => {
    if (selectedChallenges.length === 0) {
      toast.error('Please select at least one challenge');
      return;
    }

    try {
      // Accept all selected challenges
      for (const challenge of selectedChallenges) {
        await axios.post('/api/challenges', {
          name: challenge.name,
          description: challenge.description,
          type: challenge.type || 'custom',
          targetValue: challenge.targetValue || 100,
          durationDays: challenge.durationDays || 30
        });
      }
      
      toast.success(`${selectedChallenges.length} challenge(s) accepted!`);
      setShowChallengeModal(false);
      setSelectedChallenges([]);
      setGeneratedChallenges([]);
      await fetchActiveChallenges();
    } catch (error) {
      console.error('Error accepting challenges:', error);
      toast.error('Failed to accept challenges');
    }
  };

  const toggleChallengeSelection = (challenge) => {
    setSelectedChallenges(prev => {
      const isSelected = prev.some(c => c === challenge);
      if (isSelected) {
        return prev.filter(c => c !== challenge);
      } else {
        return [...prev, challenge];
      }
    });
  };

  const handleAchievementClick = (achievement) => {
    if (achievement.earned && !clickedAchievements.has(achievement.id)) {
      // Mark as clicked
      setClickedAchievements(prev => new Set([...prev, achievement.id]));
      
      // Show celebration animation
      setCelebratingAchievement(achievement);
      setShowCelebration(true);
      createConfetti();
      
      setTimeout(() => {
        setShowCelebration(false);
      }, 3000);
    }
  };

  const handleGoalClick = (nextAchievement) => {
    setSelectedGoal(nextAchievement);
    // Show celebration for setting a goal
    setCelebratingAchievement({
      name: 'Goal Set!',
      description: `You've set "${nextAchievement.name}" as your goal`
    });
    setShowCelebration(true);
    createConfetti();
    
    setTimeout(() => {
      setShowCelebration(false);
    }, 3000);
  };

  const createConfetti = () => {
    const colors = ['#FFD700', '#FF1493', '#00FFFF', '#FF0000', '#00FF00', '#FF00FF'];
    const confettiCount = 50;
    const container = document.body;

    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      confetti.style.position = 'fixed';
      confetti.style.width = '10px';
      confetti.style.height = '10px';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.left = Math.random() * window.innerWidth + 'px';
      confetti.style.top = '-10px';
      confetti.style.opacity = '1';
      confetti.style.pointerEvents = 'none';
      confetti.style.zIndex = '9999';
      confetti.style.borderRadius = '50%';
      confetti.style.animation = `confetti-fall ${2 + Math.random() * 3}s linear forwards`;
      
      container.appendChild(confetti);
      
      setTimeout(() => {
        confetti.remove();
      }, 5000);
    }
  };

  const getIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'first': return Trophy;
      case 'health': return Star;
      case 'streak': return Star;
      case 'budget': return Award;
      case 'meal': return Target;
      case 'feature': return Sparkles;
      default: return Trophy;
    }
  };

  const getColor = (category) => {
    switch (category?.toLowerCase()) {
      case 'first': return 'text-yellow-500';
      case 'health': return 'text-green-500';
      case 'streak': return 'text-orange-500';
      case 'budget': return 'text-blue-500';
      case 'meal': return 'text-purple-500';
      case 'feature': return 'text-pink-500';
      default: return 'text-gray-500';
    }
  };

  const getChallengeProgress = (challenge) => {
    if (!challenge.currentValue || !challenge.targetValue) return 0;
    return Math.min(100, (challenge.currentValue / challenge.targetValue) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add confetti animation CSS */}
      <style>{`
        @keyframes confetti-fall {
          to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 40px rgba(255, 215, 0, 0.8);
            transform: scale(1.05);
          }
        }
        .achievement-earned {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        .achievement-flip {
          animation: flip 0.6s ease-in-out;
        }
        @keyframes flip {
          0% { transform: perspective(400px) rotateY(0); }
          100% { transform: perspective(400px) rotateY(360deg); }
        }
      `}</style>

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {viewMode === 'achievements' ? 'Achievements' : 'Leaderboard'}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
            {viewMode === 'achievements' 
              ? 'Track your progress and unlock badges' 
              : 'See how you rank against other users'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          {viewMode === 'achievements' && (
            <>
              <button
                onClick={checkForNewAchievements}
                disabled={checking}
                className="btn-secondary flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${checking ? 'animate-spin' : ''}`} />
                <span>Check for New</span>
              </button>
              <button
                onClick={generateChallenges}
                disabled={generating}
                className="btn-primary flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{generating ? 'Generating...' : 'Generate Challenges'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 p-1 bg-white dark:bg-gray-800">
          <button
            onClick={() => setViewMode('achievements')}
            className={`px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-medium transition-all duration-200 ${
              viewMode === 'achievements'
                ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-lg'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Achievements</span>
            </div>
          </button>
          <button
            onClick={() => setViewMode('leaderboard')}
            className={`px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-medium transition-all duration-200 ${
              viewMode === 'leaderboard'
                ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-lg'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Medal className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Leaderboard</span>
            </div>
          </button>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'leaderboard' ? (
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
            Top Players
          </h2>
          <div className="space-y-3">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.id}
                className={`card transition-all duration-300 ${
                  entry.isCurrentUser
                    ? 'border-2 border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Rank Badge */}
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${
                        entry.rank === 1
                          ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white'
                          : entry.rank === 2
                          ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white'
                          : entry.rank === 3
                          ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                    </div>
                    {/* User Info */}
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">
                        {entry.userName}
                        {entry.isCurrentUser && (
                          <span className="ml-2 text-xs text-purple-600 dark:text-purple-400">(You)</span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {entry.points} points • {entry.totalReceipts} receipts
                      </p>
                    </div>
                  </div>
                  {/* Stats */}
                  <div className="hidden sm:flex items-center space-x-6 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-gray-900 dark:text-white">{entry.totalAchievements}</div>
                      <div className="text-xs text-gray-500">Achievements</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-gray-900 dark:text-white">{entry.avgHealthScore.toFixed(0)}</div>
                      <div className="text-xs text-gray-500">Avg Score</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-gray-900 dark:text-white">{entry.currentStreak}</div>
                      <div className="text-xs text-gray-500">Streak</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="card bg-gradient-to-br from-purple-500 to-blue-600 text-white">
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold mb-2">{stats.totalUnlocked}</div>
            <div className="text-xs sm:text-sm opacity-90">Achievements Unlocked</div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-green-500 to-teal-600 text-white">
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold mb-2">{stats.activeChallenges}</div>
            <div className="text-xs sm:text-sm opacity-90">Active Challenges</div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-orange-500 to-red-600 text-white">
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold mb-2">{stats.completedChallenges}</div>
            <div className="text-xs sm:text-sm opacity-90">Challenges Completed</div>
          </div>
        </div>
      </div>

      {/* Next Available Achievements */}
      {nextAchievements.length > 0 && (
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
            Next Available Achievements - Set Your Goals
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {nextAchievements.map((achievement, idx) => {
              const isSelected = selectedGoal?.name === achievement.name;
              return (
                <div 
                  key={idx} 
                  onClick={() => handleGoalClick(achievement)}
                  className={`card border-2 border-dashed cursor-pointer transition-all duration-300 hover:scale-102 hover:shadow-2xl ${
                    isSelected 
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 achievement-earned' 
                      : 'border-primary-500 hover:border-primary-600'
                  }`}
                  style={{ boxShadow: isSelected ? '0 0 20px 2px rgba(34, 197, 94, 0.4)' : undefined }}
                  onMouseEnter={(e) => !isSelected && (e.currentTarget.style.boxShadow = '0 0 20px 2px rgba(99, 102, 241, 0.3)')}
                  onMouseLeave={(e) => !isSelected && (e.currentTarget.style.boxShadow = '')}
                >
                  <div className="flex items-start space-x-2 sm:space-x-4">
                    <div className={`p-2 sm:p-3 rounded-lg flex-shrink-0 ${
                      isSelected 
                        ? 'bg-green-500' 
                        : 'bg-primary-100 dark:bg-primary-900'
                    }`}>
                      <Target className={`w-5 h-5 sm:w-6 sm:h-6 ${
                        isSelected ? 'text-white' : 'text-primary-500'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mb-1 break-words">
                        {achievement.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        {achievement.description}
                      </p>
                      {achievement.targetValue && (
                        <p className="text-xs text-primary-500 mt-2 font-semibold">
                          Target: {achievement.targetValue}
                        </p>
                      )}
                      {isSelected && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-2 font-semibold">
                          ✓ Goal Set!
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Challenges */}
      {activeChallenges.length > 0 && (
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
            Active Challenges
          </h2>
          <div className="space-y-3 sm:space-y-4">
            {activeChallenges.map((challenge) => {
              const progress = getChallengeProgress(challenge);
              const isCompleted = challenge.status === 'completed';
              
              return (
                <div
                  key={challenge.id}
                  className={`card ${isCompleted ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500' : ''}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1 break-words">
                        {challenge.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        {challenge.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>Started: {new Date(challenge.startDate).toLocaleDateString()}</span>
                        {challenge.endDate && (
                          <span>Ends: {new Date(challenge.endDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                      isCompleted 
                        ? 'bg-green-500 text-white' 
                        : 'bg-blue-500 text-white'
                    }`}>
                      {isCompleted ? 'Completed ✓' : 'In Progress'}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Progress</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {challenge.currentValue || 0} / {challenge.targetValue || 0}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                      {progress.toFixed(0)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Your Achievements */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
          Your Achievements
        </h2>
        {achievements.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No achievements yet. Start using ReceiptHealth to unlock badges!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {achievements.map(achievement => {
              const Icon = achievement.icon;
              const hasBeenClicked = clickedAchievements.has(achievement.id);
              return (
                <div
                  key={achievement.id}
                  onClick={() => handleAchievementClick(achievement)}
                  className={`card transition-all duration-300 cursor-pointer hover:scale-105 ${
                    achievement.earned 
                      ? (hasBeenClicked 
                          ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-400'
                          : 'achievement-earned bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-400')
                      : 'opacity-60 bg-gray-100 dark:bg-gray-800'
                  }`}
                >
                  <div className="flex items-start space-x-2 sm:space-x-4">
                    <div className={`p-3 sm:p-4 rounded-lg flex-shrink-0 ${
                      achievement.earned 
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500' 
                        : 'bg-gray-300 dark:bg-gray-700'
                    }`}>
                      <Icon className={`w-6 h-6 sm:w-8 sm:h-8 ${achievement.earned ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1 break-words">
                        {achievement.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        {achievement.description}
                      </p>
                      {achievement.earned ? (
                        <div className="mt-2">
                          <span className="inline-block text-xs font-semibold text-green-600 dark:text-green-400">
                            ✓ Unlocked
                          </span>
                          {achievement.unlockedDate && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                              {new Date(achievement.unlockedDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-block mt-2 text-xs font-semibold text-gray-500">
                          🔒 Locked
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
        </>
      )}

      {/* Challenge Generation Modal */}
      {showChallengeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6 flex justify-between items-center gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  AI-Generated Challenges
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Get personalized challenge suggestions based on your shopping habits!
                </p>
              </div>
              <button
                onClick={() => {
                  setShowChallengeModal(false);
                  setSelectedChallenges([]);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex-shrink-0"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              {generatedChallenges.map((challenge, idx) => {
                const isSelected = selectedChallenges.some(c => c === challenge);
                return (
                  <div
                    key={idx}
                    onClick={() => toggleChallengeSelection(challenge)}
                    className={`p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <div className="flex-shrink-0 mt-1">
                        <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded border-2 flex items-center justify-center ${
                          isSelected
                            ? 'bg-purple-500 border-purple-500'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-2 break-words">
                          {challenge.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {challenge.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>🎯 Target: {challenge.targetValue}</span>
                          <span>⏰ Duration: {challenge.durationDays} days</span>
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                            📊 Type: {challenge.type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
                <button
                  onClick={acceptSelectedChallenges}
                  disabled={selectedChallenges.length === 0}
                  className="btn-primary flex-1 text-sm sm:text-base"
                >
                  Accept Selected Challenge{selectedChallenges.length !== 1 ? 's' : ''}
                  {selectedChallenges.length > 0 && ` (${selectedChallenges.length})`}
                </button>
                <button
                  onClick={() => {
                    setShowChallengeModal(false);
                    setSelectedChallenges([]);
                  }}
                  className="btn-secondary flex-1 text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Celebration Modal */}
      {showCelebration && celebratingAchievement && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-2 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 sm:p-8 max-w-md text-center achievement-flip">
            <div className="mb-4 sm:mb-6">
              <div className="inline-block p-4 sm:p-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-bounce">
                <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Achievement Unlocked!
            </h2>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 break-words">
              {celebratingAchievement.name}
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
              {celebratingAchievement.description}
            </p>
            <button
              onClick={() => setShowCelebration(false)}
              className="btn-primary text-sm sm:text-base"
            >
              Awesome!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Achievements;
