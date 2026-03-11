// test-environments.js
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function runTests() {
  console.log('='.repeat(50));
  console.log('🧪 INICIANDO TESTS EN AMBOS ENTORNOS');
  console.log('='.repeat(50));
  
  // Tests en LOCAL
  console.log('\n📌 ENTORNO LOCAL');
  console.log('-'.repeat(30));
  try {
    const { stdout, stderr } = await execPromise('newman run postman/cheaters-stats.postman_collection.json -e postman/environments/local.postman_environment.json');
    console.log(stdout);
    if (stderr) console.error(stderr);
    console.log('✅ Tests locales completados');
  } catch (error) {
    console.error('❌ Error en tests locales:', error.message);
  }
  
  // Tests en RENDER
  console.log('\n📌 ENTORNO RENDER');
  console.log('-'.repeat(30));
  try {
    const { stdout, stderr } = await execPromise('newman run postman/cheaters-stats.postman_collection.json -e postman/environments/render.postman_environment.json');
    console.log(stdout);
    if (stderr) console.error(stderr);
    console.log('✅ Tests en Render completados');
  } catch (error) {
    console.error('❌ Error en tests de Render:', error.message);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 TESTS FINALIZADOS');
  console.log('='.repeat(50));
}

runTests();