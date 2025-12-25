-- Add multilingual support to news table
ALTER TABLE news
ADD COLUMN title_en VARCHAR(255),
ADD COLUMN title_si VARCHAR(255),
ADD COLUMN title_ta VARCHAR(255),
ADD COLUMN excerpt_en TEXT,
ADD COLUMN excerpt_si TEXT,
ADD COLUMN excerpt_ta TEXT,
ADD COLUMN content_en LONGTEXT,
ADD COLUMN content_si LONGTEXT,
ADD COLUMN content_ta LONGTEXT;
