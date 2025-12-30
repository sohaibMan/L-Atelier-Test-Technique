#!/usr/bin/env node

/**
 * Script pour exécuter les tests d'intégration avec une vraie base de données
 * et afficher un résumé des calculs testés
 */

import { execSync } from 'child_process';

console.log('Execution des tests d\'integration PlayerService avec vraie base de donnees...\n');

try {
  // Exécuter les tests d'intégration
  const result = execSync('npm run test:integration -- --testNamePattern="Real Database Calculations" --verbose', {
    encoding: 'utf8',
    stdio: 'pipe'
  });

  console.log('Tests d\'integration reussis !\n');
  
  console.log('Resume des calculs testes avec une vraie base de donnees MongoDB :');
  console.log('');
  console.log('1. Calcul du meilleur ratio de victoires par pays');
  console.log('   - Test avec données réelles de joueurs de tennis');
  console.log('   - Vérification des calculs de pourcentage de victoires');
  console.log('   - Gestion des égalités entre pays');
  console.log('');
  console.log('2. 📏 Calcul de l\'IMC moyen des joueurs');
  console.log('   - Conversion poids (grammes → kg) et taille (cm → m)');
  console.log('   - Formule : poids(kg) / (taille(m))²');
  console.log('   - Precision a 2 decimales');
  console.log('');
  console.log('3. 📐 Calcul de la médiane des tailles');
  console.log('   - Tri des tailles par ordre croissant');
  console.log('   - Gestion nombre pair/impair d\'elements');
  console.log('   - Test avec differents jeux de donnees');
  console.log('');
  console.log('4. 🔄 Tests de coherence et d\'integrite');
  console.log('   - Calculs multiples avec résultats identiques');
  console.log('   - Gestion des cas limites (1 joueur, egalites)');
  console.log('   - Validation des contraintes de base de données');
  console.log('');
  console.log('5. Tests de validation des donnees');
  console.log('   - Contraintes d\'unicite (ID, shortname)');
  console.log('   - Formats requis (shortname, codes pays)');
  console.log('   - Opérations CRUD complètes');

} catch (error) {
  console.error('Erreur lors de l\'execution des tests :', error.message);
  process.exit(1);
}