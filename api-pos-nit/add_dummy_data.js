const { db } = require('./src/util/helper');

(async () => {
    try {
        const email = 'pongchiva@gmail.com';
        const [users] = await db.query('SELECT u.id, u.business_id, u.branch_id FROM users u INNER JOIN businesses b ON u.business_id = b.id WHERE u.email = ?', [email]);

        if (users.length === 0) {
            console.log('User not found for email:', email);
            process.exit(0);
        }

        const user = users[0];
        const category_name = 'Beverages';

        let [categories] = await db.query('SELECT id FROM categories WHERE name = ? AND business_id = ?', [category_name, user.business_id]);
        let category_id;

        if (categories.length === 0) {
            const [res] = await db.query('INSERT INTO categories (business_id, name, description, status) VALUES (?, ?, ?, 1)', [user.business_id, category_name, 'Drinks']);
            category_id = res.insertId;
            console.log('Created category ID:', category_id);
        } else {
            category_id = categories[0].id;
            console.log('Found existing category ID:', category_id);
        }

        const [prodRes] = await db.query('INSERT INTO products (business_id, category_id, name, description, status) VALUES (?, ?, ?, ?, 1)', [user.business_id, category_id, 'Iced Latte', 'Cold Coffee']);
        const product_id = prodRes.insertId;
        console.log('Created product ID:', product_id);

        await db.query('INSERT INTO branch_products (branch_id, product_id, price, cost_price, stock_qty) VALUES (?, ?, ?, ?, ?)', [user.branch_id, product_id, 3.50, 1.50, 50]);
        console.log('Linked product to branch with qty 50');

        const [rmRes] = await db.query('INSERT INTO raw_material (business_id, branch_id, name, qty, min_stock, unit, price, status) VALUES (?, ?, ?, ?, ?, ?, ?, 1)', [user.business_id, user.branch_id, 'Coffee Beans', 10, 2, 'kg', 15.00]);
        console.log('Created raw material ID:', rmRes.insertId);

        console.log('✅ Successfully added dummy data for mengly!');
        process.exit(0);
    } catch (e) {
        if (e.code === 'ER_BAD_FIELD_ERROR' && e.sqlMessage.includes("Unknown column 'description'")) {
            // Handle missing description column
            try {
                const user = (await db.query('SELECT u.id, u.business_id, u.branch_id FROM users u INNER JOIN businesses b ON u.business_id = b.id WHERE u.email = "pongchiva@gmail.com"'))[0][0];

                const [res] = await db.query('INSERT INTO categories (business_id, name, status) VALUES (?, ?, 1)', [user.business_id, 'Beverages']);
                const category_id = res.insertId;

                const [prodRes] = await db.query('INSERT INTO products (business_id, category_id, name, status) VALUES (?, ?, ?, 1)', [user.business_id, category_id, 'Iced Latte']);
                const product_id = prodRes.insertId;

                await db.query('INSERT INTO branch_products (branch_id, product_id, price, cost_price, stock_qty) VALUES (?, ?, ?, ?, ?)', [user.branch_id, product_id, 3.50, 1.50, 50]);

                await db.query('INSERT INTO raw_material (business_id, branch_id, name, qty, min_stock, unit, price, status) VALUES (?, ?, ?, ?, ?, ?, ?, 1)', [user.business_id, user.branch_id, 'Coffee Beans', 10, 2, 'kg', 15.00]);
                console.log('✅ Successfully added dummy data using fallback schema for mengly!');
                process.exit(0);
            } catch (fallbackErr) {
                console.error('Fallback failed:', fallbackErr);
            }
        } else {
            console.error(e);
        }
        process.exit(1);
    }
})();
