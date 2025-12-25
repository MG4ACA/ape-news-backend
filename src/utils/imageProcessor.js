const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

// Process and resize image
exports.processImage = async (filePath, options = {}) => {
  try {
    const {
      width = 1200,
      height = null,
      quality = 85,
      format = 'jpeg'
    } = options;

    const outputDir = path.dirname(filePath);
    const filename = path.basename(filePath, path.extname(filePath));
    const outputPath = path.join(outputDir, `${filename}-processed.${format}`);

    // Process image
    let pipeline = sharp(filePath);

    if (height) {
      pipeline = pipeline.resize(width, height, { fit: 'cover' });
    } else {
      pipeline = pipeline.resize(width, null, { fit: 'inside' });
    }

    if (format === 'jpeg') {
      pipeline = pipeline.jpeg({ quality, progressive: true });
    } else if (format === 'png') {
      pipeline = pipeline.png({ quality, progressive: true });
    } else if (format === 'webp') {
      pipeline = pipeline.webp({ quality });
    }

    await pipeline.toFile(outputPath);

    // Delete original file
    await fs.unlink(filePath);

    return {
      path: outputPath,
      filename: path.basename(outputPath)
    };
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
};

// Create multiple sizes (thumbnail, medium, large)
exports.createImageVariants = async (filePath) => {
  try {
    const outputDir = path.dirname(filePath);
    const filename = path.basename(filePath, path.extname(filePath));

    const variants = {
      thumbnail: { width: 300, height: 200 },
      medium: { width: 800, height: null },
      large: { width: 1200, height: null }
    };

    const results = {};

    for (const [size, dimensions] of Object.entries(variants)) {
      const outputPath = path.join(outputDir, `${filename}-${size}.jpeg`);
      
      let pipeline = sharp(filePath);
      
      if (dimensions.height) {
        pipeline = pipeline.resize(dimensions.width, dimensions.height, { fit: 'cover' });
      } else {
        pipeline = pipeline.resize(dimensions.width, null, { fit: 'inside' });
      }

      await pipeline.jpeg({ quality: 85, progressive: true }).toFile(outputPath);

      results[size] = {
        path: outputPath,
        filename: path.basename(outputPath)
      };
    }

    // Delete original file
    await fs.unlink(filePath);

    return results;
  } catch (error) {
    console.error('Error creating image variants:', error);
    throw error;
  }
};

// Delete image and its variants
exports.deleteImage = async (filename) => {
  try {
    const uploadDir = path.join(__dirname, '../../uploads/images');
    const baseName = filename.replace(/-processed|-thumbnail|-medium|-large/, '').replace(/\.[^/.]+$/, '');
    
    // Delete all variants
    const variants = ['', '-processed', '-thumbnail', '-medium', '-large'];
    const extensions = ['.jpg', '.jpeg', '.png', '.webp'];

    for (const variant of variants) {
      for (const ext of extensions) {
        const filePath = path.join(uploadDir, `${baseName}${variant}${ext}`);
        try {
          await fs.unlink(filePath);
        } catch (err) {
          // File might not exist, ignore error
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};
