export default function testSimple(app) {
    console.log('✅✅✅ SIMPLE TEST - MÓDULO CARGADO ✅✅✅');
    
    app.get('/api/simple-test', (req, res) => {
        res.json({ 
            message: 'Test funciona!',
            timestamp: new Date().toISOString()
        });
    });
}