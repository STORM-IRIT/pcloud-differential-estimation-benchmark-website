const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Chemin vers la racine du projet (un niveau au-dessus du dossier scripts)
const projectRoot = path.join(__dirname, '..');

const sourceImageDirectory = path.join(projectRoot, 'public', 'images_compressed');
const compressedImageDirectory = path.join(projectRoot, 'public', 'images_compressed_bis');

function ensureDirectoryExistence(filePath) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

function compressImage(sourcePath, destinationPath) {
  ensureDirectoryExistence(destinationPath);

  return sharp(sourcePath)
    .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 75 })
    .png({ quality: 75 })
    .toFile(destinationPath)
    .then(() => {
      console.log(`Compressed: ${sourcePath} -> ${destinationPath}`);
    })
    .catch(err => console.error(`Error compressing ${sourcePath}:`, err));
}

function processDirectory(sourceDir, destDir) {
  if (!fs.existsSync(sourceDir)) {
    console.error(`Source directory does not exist: ${sourceDir}`);
    return;
  }

  const items = fs.readdirSync(sourceDir);

  for (const item of items) {
    const sourceItemPath = path.join(sourceDir, item);
    const destItemPath = path.join(destDir, item);
    const stat = fs.statSync(sourceItemPath);

    if (stat.isDirectory()) {
      processDirectory(sourceItemPath, destItemPath);
    } else if (stat.isFile()) {
      const ext = path.extname(sourceItemPath).toLowerCase();
      if (['.jpg', '.jpeg', '.png'].includes(ext)) {
        compressImage(sourceItemPath, destItemPath);
      }
    }
  }
}

console.log('Starting image compression...');
console.log(`Source directory: ${sourceImageDirectory}`);
console.log(`Destination directory: ${compressedImageDirectory}`);

if (!fs.existsSync(sourceImageDirectory)) {
  console.error(`Error: Source image directory does not exist: ${sourceImageDirectory}`);
  process.exit(1);
}

processDirectory(sourceImageDirectory, compressedImageDirectory);
console.log('Image compression complete. Compressed images are in the "images_compressed" folder.');