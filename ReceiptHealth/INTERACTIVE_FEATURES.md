# Interactive Features Documentation

This document describes the interactive and gamification features implemented in ReceiptHealth.

## Phase 3: Interactive Category Chart

### Overview
The category breakdown pie chart on the dashboard is now fully interactive, allowing users to click on segments to view detailed information about items in each category.

### Features

#### Click-to-Drill-Down
- **User Action**: Click on any segment of the category pie chart (Healthy, Junk, Other, or Unknown)
- **Result**: A modal opens displaying all items in that category with detailed information

#### Category Detail Modal
The modal displays:
- **Header**: Category name with emoji indicator (🥗 Healthy, 🍟 Junk, 🥛 Other, ❓ Unknown)
- **Summary Cards**:
  - Total Items: Count of items in the category
  - Total Spend: Sum of all spending in the category
  - Average Price: Average cost per item
- **Items Table**: Detailed list showing:
  - Item description
  - Vendor/store name
  - Purchase date
  - Quantity
  - Total price (quantity × unit price)

#### Animations
- **Modal Entry**: Smooth fade-in with slide-up animation (0.3s)
- **Chart Interaction**: AnimateScale and animateRotate enabled for smooth transitions
- **Modal Exit**: Click outside modal or click X button to close

### Technical Implementation

#### API Endpoint
```
GET /api/analytics/category-items/{category}
```

**Parameters**:
- `category` (string): One of "Healthy", "Junk", "Other", or "Unknown" (case-insensitive)

**Response**:
```json
[
  {
    "id": 1,
    "description": "Organic Spinach",
    "price": 3.99,
    "quantity": 1,
    "category": "Healthy",
    "receiptDate": "2024-01-15T00:00:00Z",
    "vendor": "Whole Foods"
  },
  ...
]
```

**Performance**: Limited to 100 most recent items per category

#### Chart.js Integration
The chart uses the `onClick` callback in the Chart.js options:
```javascript
onClick: (event, activeElements) => {
    if (activeElements.length > 0) {
        const index = activeElements[0].index;
        const category = ['Healthy', 'Junk', 'Other', 'Unknown'][index];
        showCategoryDetails(category);
    }
}
```

## Phase 4: Enhanced Gamification

### Overview
Advanced gamification features that use AI to personalize challenges and provide engaging feedback when achievements are unlocked.

### Features

#### 1. Next Available Achievements

**Location**: Achievements page (`/achievements.html`)

**Description**: Displays up to 6 achievements that are unlockable but not yet achieved, maintaining progression order within each achievement type.

**Achievement Types**:
- **Streaks**: 3, 7, 14, 30 healthy shopping trips
- **Health Scores**: 50+, 70+, 85+, 95+ average scores
- **Category Spending**: 60%, 80% healthy spending
- **Receipt Counts**: 10, 25, 50, 100 receipts uploaded
- **Feature Usage**:
  - Voice Assistant: 5, 25 uses
  - Meal Planner: 3, 10 meal plans created
  - Shopping Lists: 5, 20 lists created

**API Endpoint**:
```
GET /api/achievements/next
```

**Response**: Array of Achievement objects with `isUnlocked: false`

#### 2. AI-Powered Challenge Generation

**Location**: Achievements page, "AI-Generated Challenges" section

**How It Works**:
1. User clicks "✨ Generate New Challenges" button
2. System analyzes recent shopping data:
   - Average health score (last 30 receipts)
   - Healthy vs. junk spending patterns
   - Shopping frequency
3. GitHub Copilot SDK generates 3 personalized SMART challenges
4. Challenges are displayed as selectable cards
5. User selects preferred challenge and clicks "Accept Selected Challenge"
6. Challenge is saved and tracked in active challenges section

**Challenge Types**:
- `health_score`: Target average health score
- `healthy_spending`: Target dollar amount on healthy items
- `reduce_junk`: Target percentage reduction in junk spending
- `receipt_streak`: Target number of consecutive healthy receipts

**API Endpoints**:
```
GET /api/challenges/generate?count=3
```

**Response**: Array of challenge strings in format:
```
"Challenge Name|Description|Type|Target Value|Duration Days"
```

Example:
```
"Improve Health Score to 78|Beat your average health score|health_score|78|14"
```

#### 3. Feature Usage Tracking

**Purpose**: Automatically track when users engage with different features and unlock achievements based on usage milestones.

**Tracked Features**:
- `voice_assistant`: Using the voice assistant feature
- `meal_planner`: Creating meal plans
- `shopping_list`: Creating shopping lists

**Integration**: Features should call the tracking endpoint when used:

```javascript
// Example: Track meal planner usage
await fetch('/api/features/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        featureName: 'meal_planner',
        details: 'Created weekly meal plan'
    })
});
```

**API Endpoint**:
```
POST /api/features/track
```

**Request Body**:
```json
{
    "featureName": "voice_assistant",
    "details": "Asked about health score"
}
```

**Automatic Achievement Checking**: When usage count reaches milestones (5, 10, 20, 25, etc.), corresponding achievements are automatically unlocked.

#### 4. Celebration Effects

**Trigger**: When achievements are unlocked (checked via `/api/achievements/check`)

**Visual Effects**:
1. **Confetti Animation**:
   - 50 colored particles falling from top to bottom
   - Random colors (yellow, magenta, cyan, red, green)
   - 3-second duration
   - Particles have random delays for natural effect

2. **Achievement Popup**:
   - Centered modal with scale-up animation
   - Large emoji icon with bounce animation
   - Achievement name and description
   - "Awesome!" button to dismiss
   - Auto-hides overlay after 3 seconds

**API Endpoint**:
```
GET /api/achievements/celebration
```

**Response**:
```json
{
    "celebrate": true
}
```

Returns `true` if any achievements were unlocked in the last minute.

#### 5. Periodic Challenge Regeneration

**Automatic Regeneration**: The AI can generate new challenges at any time based on current user data

**Manual Regeneration**: Users can click "Generate New Challenges" button to get fresh suggestions

**Smart Recommendations**: The AI considers:
- Current performance vs. historical trends
- Realistic improvement targets (not too easy, not impossible)
- Time-bound goals (7-30 days)
- Variety in challenge types

### Database Schema

#### FeatureUsage Table
```sql
CREATE TABLE FeatureUsages (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    FeatureName TEXT NOT NULL,
    UsedAt DATETIME NOT NULL,
    Details TEXT
);

CREATE INDEX IX_FeatureUsages_FeatureName ON FeatureUsages(FeatureName);
CREATE INDEX IX_FeatureUsages_UsedAt ON FeatureUsages(UsedAt);
```

### User Experience Flow

1. **User uploads receipts** → System analyzes and categorizes
2. **User clicks pie chart segment** → Views category details in modal
3. **User visits achievements page** → Sees:
   - Unlocked achievements (with dates)
   - Next available achievements (motivation to continue)
   - Active challenges (progress bars)
4. **User clicks "Generate Challenges"** → AI creates personalized options
5. **User selects and accepts challenge** → Challenge becomes active
6. **User continues shopping** → Progress updates automatically
7. **Challenge completed** → Celebration effects trigger
8. **New achievement unlocked** → Confetti and popup appear

### Best Practices

#### For Developers

1. **Feature Integration**: When adding new features, integrate with feature tracking:
   ```csharp
   await _gamificationService.TrackFeatureUsageAsync("new_feature_name");
   ```

2. **Achievement Design**: Follow SMART criteria:
   - Specific: Clear goal definition
   - Measurable: Numeric targets
   - Achievable: Realistic thresholds
   - Relevant: Aligned with health goals
   - Time-bound: Clear duration (for challenges)

3. **UI Consistency**: Use established patterns:
   - Emojis for visual identity
   - Card-based layouts for grouping
   - Progress bars for tracking
   - Smooth animations for transitions

4. **Performance**: Category items endpoint limits to 100 items to ensure fast response times

#### For Users

1. **Maximize Engagement**: Check achievements page regularly to see progress
2. **Accept Challenges**: Use AI-generated challenges for personalized goals
3. **Explore Categories**: Click on pie chart segments to understand spending patterns
4. **Track Features**: Try different features to unlock usage-based achievements
5. **Celebrate Success**: Enjoy the confetti when you unlock achievements!

### Future Enhancements

Potential additions:
- Social sharing of achievements
- Leaderboards comparing with friends
- Seasonal/holiday special challenges
- Streak freeze tokens for maintaining progress
- Achievement rarity tiers (common, rare, epic, legendary)
- Challenge difficulty levels
- Reward points system
- Weekly summary emails with progress
