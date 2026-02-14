-- Add MealType column to MealPlanDays table
ALTER TABLE MealPlanDays ADD COLUMN MealType INTEGER NOT NULL DEFAULT 2;
