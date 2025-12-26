-- Add multilingual fields to categories table
ALTER TABLE categories
  ADD COLUMN name_si VARCHAR(100) AFTER name,
  ADD COLUMN name_en VARCHAR(100) AFTER name_si,
  ADD COLUMN name_ta VARCHAR(100) AFTER name_en,
  ADD COLUMN description_si TEXT AFTER description,
  ADD COLUMN description_en TEXT AFTER description_si,
  ADD COLUMN description_ta TEXT AFTER description_en;
