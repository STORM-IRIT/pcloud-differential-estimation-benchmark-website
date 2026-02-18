import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputDir = path.join(__dirname, '../public/models');
const outputDir = path.join(__dirname, '../public/data');

// Fonction récursive pour traiter les répertoires
function processDirectory(currentInputDir, currentOutputDir) {
  if (!fs.existsSync(currentOutputDir)) {
    fs.mkdirSync(currentOutputDir, { recursive: true });
  }

  fs.readdirSync(currentInputDir, { withFileTypes: true }).forEach(dirent => {
    const inputPath = path.join(currentInputDir, dirent.name);
    const outputPath = path.join(currentOutputDir, dirent.name);

    if (dirent.isDirectory()) {
      // Si c'est un répertoire, on appelle récursivement la fonction
      processDirectory(inputPath, outputPath);
    } else {
      // Si c'est un fichier, on le traite
      if (path.extname(dirent.name) === '.pts' || path.extname(dirent.name) === '.obj') {
        const content = fs.readFileSync(inputPath, 'utf8');
        const points = content.split('\n')
          .filter(line => line.trim() !== '') // Supprime les lignes vides
          .map(line => line.split(' ').map(Number)) // Convertit chaque ligne en tableau de nombres
          .map(values => {
            // Applique la racine carrée à la colonne JetFitting (index 12) si elle existe
            if (inputPath.includes(`${path.sep}errors${path.sep}`) && values[12] !== undefined) {
              values[12] = Math.sqrt(values[12]); 
            }
            return values;
          })
          .filter(values => {
            // Supprime les lignes où toutes les valeurs au-delà de la 4ème colonne sont égales à 0
            const beyondFourthColumn = values.slice(4);
            return !beyondFourthColumn.every(value => value === 0); // Garde les lignes où au moins une valeur est différente de 0
          });

        // Remplace "selle" par "saddle" dans le nom du fichier de sortie JSON
        const jsonBaseName = path.basename(dirent.name, path.extname(dirent.name)).replace(/selle/g, 'saddle');
        const jsonOutputPath = path.join(
          path.dirname(outputPath),
          `${jsonBaseName}.json`
        );
        let outputContent = JSON.stringify(points);
        if (content.includes('selle')) {
          outputContent = outputContent.replace(/selle/g, 'saddle');
        }
        fs.writeFileSync(jsonOutputPath, outputContent);
        console.log(`Converti ${dirent.name} en JSON`);
      }
    }
  });
}

// Démarrer le traitement à partir du répertoire racine
processDirectory(inputDir, outputDir);