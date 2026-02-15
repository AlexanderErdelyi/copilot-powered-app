CREATE TABLE IF NOT EXISTS Categories (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL,
    Description TEXT,
    Color TEXT,
    Icon TEXT,
    IsSystemCategory INTEGER NOT NULL DEFAULT 0,
    IsActive INTEGER NOT NULL DEFAULT 1,
    CreatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    SortOrder INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS IX_Categories_Name ON Categories (Name);
INSERT OR IGNORE INTO Categories (Name, Description, Color, Icon, IsSystemCategory, IsActive, SortOrder) VALUES
('Healthy', 'Healthy food items (fruits, vegetables, whole grains)', '#10b981', '', 1, 1, 1),
('Junk', 'Junk food and unhealthy items (candy, soda, chips)', '#ef4444', '', 1, 1, 2),
('Other', 'Other food items (bread, pasta, basic staples)', '#6b7280', '', 1, 1, 3),
('Unknown', 'Uncategorized items', '#9ca3af', '', 1, 1, 99);
