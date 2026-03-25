CREATE DATABASE IF NOT EXISTS coffee_saas;
USE coffee_saas;
-- 1. Businesses (The Tenants)
CREATE TABLE businesses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    owner_name VARCHAR(150),
    phone VARCHAR(20),
    email VARCHAR(150) UNIQUE,
    logo VARCHAR(255),
    address TEXT,
    website VARCHAR(255),
    tax_percent DECIMAL(10, 2) DEFAULT 0,
    service_charge DECIMAL(10, 2) DEFAULT 0,
    kh_exchange_rate INT DEFAULT 4000,
    currency_symbol VARCHAR(10) DEFAULT '$',
    telegram_link VARCHAR(255),
    facebook_link VARCHAR(255),
    plan_type ENUM('free', 'pro') DEFAULT 'free',
    status ENUM('active', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 2. Subscriptions
CREATE TABLE subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    plan_type ENUM('free', 'pro') NOT NULL,
    price DECIMAL(10, 2) DEFAULT 0.00,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
    payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'paid',
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);
-- 3. Customers
CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(150),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);
-- 4. Branches
CREATE TABLE branches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    location VARCHAR(255),
    phone VARCHAR(50),
    is_main ENUM('0', '1') DEFAULT '0',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);
-- 5. Roles & Permissions
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50),
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);
CREATE TABLE permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    route_key VARCHAR(100) NOT NULL
);
CREATE TABLE role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);
-- 6. Categories
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);
-- 7. Users (Staff & Owners)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    branch_id INT NULL,
    role_id INT,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    image VARCHAR(255),
    status ENUM('active', 'inactive') DEFAULT 'active',
    tel VARCHAR(20),
    address TEXT,
    is_super_admin TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE
    SET NULL,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE
    SET NULL
);
-- 8. Products & Inventory
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    category_id INT,
    barcode VARCHAR(50),
    name VARCHAR(150) NOT NULL,
    description TEXT,
    image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE
    SET NULL
);
CREATE TABLE branch_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    product_id INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    cost_price DECIMAL(10, 2) DEFAULT 0,
    stock_qty INT DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    UNIQUE KEY (branch_id, product_id),
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
-- 9. Raw Materials (For production)
CREATE TABLE raw_material (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    branch_id INT,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50),
    qty DECIMAL(10, 2) DEFAULT 0,
    min_stock DECIMAL(10, 2) DEFAULT 0,
    unit VARCHAR(20),
    price DECIMAL(10, 2) DEFAULT 0,
    image VARCHAR(255),
    status TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE
    SET NULL
);
-- 10. Suppliers
CREATE TABLE suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);
-- 11. Expenses
CREATE TABLE expense_type (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);
CREATE TABLE expense (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    branch_id INT,
    expense_type_id INT,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    expense_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE
    SET NULL,
        FOREIGN KEY (expense_type_id) REFERENCES expense_type(id) ON DELETE
    SET NULL
);
-- 12. Orders (Sales)
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    branch_id INT NOT NULL,
    user_id INT NOT NULL,
    customer_name VARCHAR(100),
    table_no VARCHAR(20),
    sub_total DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) DEFAULT 0,
    discount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('cash', 'card', 'qr', 'transfer') DEFAULT 'cash',
    order_type ENUM('dine_in', 'take_away') DEFAULT 'dine_in',
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE order_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    qty INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    note TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
-- 13. Purchases (Inventory Restock)
CREATE TABLE purchase (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    branch_id INT NOT NULL,
    supplier_id INT,
    ref VARCHAR(50),
    total_amount DECIMAL(10, 2) NOT NULL,
    paid_amount DECIMAL(10, 2) NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE
    SET NULL,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE
    SET NULL
);
CREATE TABLE purchase_product (
    id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_id INT NOT NULL,
    product_id INT NULL,
    raw_material_id INT NULL,
    qty INT NOT NULL,
    cost DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (purchase_id) REFERENCES purchase(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE
    SET NULL,
        FOREIGN KEY (raw_material_id) REFERENCES raw_material(id) ON DELETE
    SET NULL
);
-- 14. Employees
CREATE TABLE employee (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    branch_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    gender TINYINT(1),
    position VARCHAR(100),
    salary DECIMAL(10, 2),
    tel VARCHAR(20),
    email VARCHAR(150),
    address TEXT,
    status ENUM('active', 'resigned', 'suspended') DEFAULT 'active',
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);