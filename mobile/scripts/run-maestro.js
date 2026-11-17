#!/usr/bin/env node

/**
 * Pre-flight check & execution wrapper for Maestro E2E tests.
 * Prevents 37s timeout errors by verifying that an iOS simulator or Android device
 * is booted and reachable before launching Maestro.
 */

const { execSync, spawn } = require('child_process');
const net = require('net');

function checkPort(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      resolve(false);
    });
    socket.connect(port, '127.0.0.1');
  });
}

function checkIosSimulator() {
  try {
    const stdout = execSync('xcrun simctl list devices', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
    const bootedMatches = stdout.match(/\(Booted\)/g);
    return Boolean(bootedMatches && bootedMatches.length > 0);
  } catch {
    return false;
  }
}

function checkAndroidDevice() {
  try {
    const stdout = execSync('adb devices', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
    const lines = stdout.trim().split('\n').slice(1);
    const active = lines.filter((l) => l.includes('\tdevice'));
    return active.length > 0;
  } catch {
    return false;
  }
}

async function main() {
  console.log('\n🔍 [Maestro Pre-Flight] Vérification de l\'environnement de test...\n');

  const isIosBooted = checkIosSimulator();
  const isAndroidConnected = checkAndroidDevice();

  if (!isIosBooted && !isAndroidConnected) {
    console.error('❌ ERREUR : Aucun simulateur iOS ni appareil Android n\'est actuellement démarré.\n');
    console.error('💡 Pourquoi Maestro a besoin d\'un simulateur déjà ouvert :');
    console.error('   Sans appareil actif, Maestro tente de booter un simulateur à froid,');
    console.error('   ce qui dépasse le délai d\'attente (timeout) et provoque une erreur.\n');
    console.error('👉 Pour démarrer le simulateur et l\'application :');
    console.error('   1. Dans votre premier terminal : cd mobile && npx expo start -i');
    console.error('   2. Attendez que l\'application soit visible sur le simulateur');
    console.error('   3. Relancez : npm run maestro:test\n');
    process.exit(1);
  }

  if (isIosBooted) {
    console.log('✅ Simulateur iOS détecté et opérationnel.');
  } else if (isAndroidConnected) {
    console.log('✅ Appareil Android détecté et opérationnel.');
  }

  const isMetroRunning = await checkPort(8081);
  if (!isMetroRunning) {
    console.log('⚠️  Avertissement : Le serveur Metro (port 8081) ne semble pas actif.');
    console.log('   Si l\'application nécessite de charger le bundle JS, lancez "npx expo start".\n');
  } else {
    console.log('✅ Serveur Metro actif (port 8081).\n');
  }

  console.log('🚀 Lancement de Maestro E2E...\n');

  const args = [
    'test',
    '--format', 'junit',
    '--output', 'test-report.xml',
    '.maestro/citizen-flow.yaml',
  ];

  const maestroProcess = spawn('maestro', args, {
    stdio: 'inherit',
    shell: true,
  });

  maestroProcess.on('close', (code) => {
    process.exit(code ?? 0);
  });
}

main().catch((err) => {
  console.error('Erreur inattendue lors de la vérification :', err);
  process.exit(1);
});
