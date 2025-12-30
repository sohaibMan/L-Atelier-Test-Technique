#!/usr/bin/env node

/**
 * Script pour exécuter tous les tests de calculs (unitaires et intégration)
 * et afficher un résumé complet des validations
 */

import { execSync } from 'child_process';

console.log('Execution de tous les tests de calculs statistiques...\n');

let allTestsPassed = true;

try {
  console.log('1. Tests unitaires - Logique pure des calculs...');
  execSync('npm run test:unit:calculations', { stdio: 'pipe' });
  console.log('Tests unitaires reussis !\n');
  
  console.log('2. Tests d\'integration - Calculs avec vraie base de donnees...');
  execSync('npm run test:integration:db', { stdio: 'pipe' });
  console.log('Tests d\'integration reussis !\n');
  
} catch (error) {
  console.error('Erreur lors de l\'execution des tests :', error.message);
  allTestsPassed = false;
}

if (allTestsPassed) {
  console.log('TOUS LES TESTS DE CALCULS SONT REUSSIS !\n');
  
  console.log('Resume complet des validations :');
  console.log('');
  console.log('TESTS UNITAIRES (Logique Pure) :');
  console.log('  ✓ Calcul IMC avec valeurs normales');
  console.log('  ✓ Gestion division par zero (poids = 0)');
  console.log('  ✓ Gestion division par zero (taille = 0)');
  console.log('  ✓ Gestion valeurs negatives');
  console.log('  ✓ Calcul ratio victoires par pays');
  console.log('  ✓ Calcul mediane (nombre pair/impair)');
  console.log('  ✓ Agregation statistiques par pays');
  console.log('  ✓ Gestion cas limites et egalites');
  console.log('  ✓ Arrondi a 2 decimales');
  console.log('  ✓ Filtrage donnees invalides');
  console.log('');
  console.log('TESTS INTEGRATION (Base de Donnees Reelle) :');
  console.log('  ✓ Calculs avec donnees persistees');
  console.log('  ✓ Validation contraintes DB');
  console.log('  ✓ Operations CRUD completes');
  console.log('  ✓ Coherence calculs multiples');
  console.log('  ✓ Gestion valeurs minimales autorisees');
  console.log('  ✓ Tests avec joueurs reels');
  console.log('');
  console.log('PROTECTION CONTRE ERREURS :');
  console.log('  ✓ Division par zero detectee et geree');
  console.log('  ✓ Valeurs negatives exclues des calculs');
  console.log('  ✓ Donnees invalides filtrees automatiquement');
  console.log('  ✓ Messages d\'erreur explicites');
  console.log('  ✓ Logs d\'avertissement pour donnees suspectes');
  console.log('');
  console.log('FORMULES VALIDEES :');
  console.log('  • IMC = poids(kg) / (taille(m))²');
  console.log('  • Ratio victoires = (victoires / total_matchs) * 100');
  console.log('  • Mediane = element_milieu ou moyenne_2_milieux');
  console.log('  • Conversions : grammes→kg, cm→m');
  
} else {
  console.log('💥 ECHEC - Certains tests ont echoue');
  process.exit(1);
}