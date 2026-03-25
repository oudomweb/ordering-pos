const connection = require('./src/util/connection');
(async () => {
    try {
        const categories = ['Juice', 'Milk', 'Snack', 'Rice', 'Dessert'];
        for (const cat of categories) {
            await connection.query('INSERT INTO categories (business_id, name) VALUES (5, ?)', [cat]);
        }
        console.log('5 categories added successfully for Business 5');
    } catch (e) {
        console.error('Error adding categories:', e);
    } finally {
        process.exit(0);
    }
})();
