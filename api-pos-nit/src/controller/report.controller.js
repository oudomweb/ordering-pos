const { db, logError } = require("../util/helper");

exports.report_Sale_Summary = async (req, res) => {
  try {
    const { business_id, branch_id } = req;
    let { from_date, to_date, category_id, branch_id: query_branch_id } = req.query;
    const target_branch_id = query_branch_id || branch_id;

    let sql = `
        SELECT 
          DATE_FORMAT(o.created_at, '%d/%m/%Y') AS order_date, 
          SUM(od.total_qty) AS total_qty, 
          SUM(od.total_amount) AS total_amount
        FROM orders o
        INNER JOIN (
            SELECT 
                odl.order_id,
                SUM(odl.qty) AS total_qty,
                SUM(odl.qty * odl.price) AS total_amount
            FROM order_details odl
            INNER JOIN products p ON odl.product_id = p.id
            WHERE (? IS NULL OR p.category_id = ?)
            GROUP BY odl.order_id
        ) od ON o.id = od.order_id
        WHERE o.business_id = ?
        AND DATE(o.created_at) BETWEEN ? AND ?
        ${target_branch_id ? 'AND o.branch_id = ?' : ''}
        GROUP BY DATE_FORMAT(o.created_at, '%d/%m/%Y')
        ORDER BY o.created_at DESC
    `;

    const params = [category_id, category_id, business_id, from_date, to_date];
    if (target_branch_id) params.push(target_branch_id);

    const [list] = await db.query(sql, params);

    res.json({ list });
  } catch (error) {
    logError("report.report_Sale_Summary", error, res);
  }
};

exports.report_Expense_Summary = async (req, res) => {
  try {
    const { business_id, branch_id } = req;
    let { from_date, to_date, expense_type_id, branch_id: query_branch_id } = req.query;
    const target_branch_id = query_branch_id || branch_id;

    let sql = `
        SELECT 
          DATE_FORMAT(e.expense_date, '%d-%m-%Y') AS title,
          SUM(e.amount) AS total_amount
        FROM expense e
        WHERE e.business_id = ?
        AND DATE(e.expense_date) BETWEEN ? AND ?
        AND (? IS NULL OR e.expense_type_id = ?)
        ${target_branch_id ? 'AND e.branch_id = ?' : ''}
        GROUP BY e.expense_date
        ORDER BY e.expense_date DESC
    `;

    const params = [business_id, from_date, to_date, expense_type_id, expense_type_id];
    if (target_branch_id) params.push(target_branch_id);

    const [list] = await db.query(sql, params);

    res.json({ list });
  } catch (error) {
    logError("report.report_expense_Summary", error, res);
  }
};

exports.report_Customer = async (req, res) => {
  try {
    const { business_id } = req;
    let { from_date, to_date } = req.query;

    let sql = `
        SELECT 
          DATE_FORMAT(cu.created_at, '%d-%m-%Y') AS title,
          COUNT(cu.id) AS total_amount
        FROM customers cu
        WHERE cu.business_id = ?
        AND cu.created_at BETWEEN ? AND ?
        GROUP BY DATE(cu.created_at)
        ORDER BY cu.created_at ASC
    `;

    const [list] = await db.query(sql, [business_id, from_date, to_date]);

    res.json({ list });
  } catch (error) {
    logError("report.Customer", error, res);
  }
};

exports.report_Purchase_Summary = async (req, res) => {
  try {
    const { business_id, branch_id } = req;
    let { from_date, to_date, supplier_id, branch_id: query_branch_id } = req.query;
    const target_branch_id = query_branch_id || branch_id;

    let sql = `
        SELECT 
          DATE_FORMAT(pu.created_at, '%d-%m-%Y') AS title,
          SUM(pu.paid_amount) AS total_amount
        FROM purchase pu
        WHERE pu.business_id = ?
        AND DATE(pu.created_at) BETWEEN ? AND ?
        AND (? IS NULL OR pu.supplier_id = ?)
        ${target_branch_id ? 'AND pu.branch_id = ?' : ''}
        GROUP BY pu.created_at
        ORDER BY pu.created_at DESC
    `;

    const params = [business_id, from_date, to_date, supplier_id, supplier_id];
    if (target_branch_id) params.push(target_branch_id);

    const [list] = await db.query(sql, params);

    res.json({ list });
  } catch (error) {
    logError("report.report_Purchase_Summary", error, res);
  }
};

exports.top_sale = async (req, res) => {
  try {
    const { business_id, branch_id } = req;
    let { from_date, to_date, branch_id: query_branch_id } = req.query;
    const target_branch_id = query_branch_id || branch_id;

    if (!from_date || !to_date) {
      const currentDate = new Date();
      to_date = currentDate.toISOString().split('T')[0];
      from_date = `${currentDate.getFullYear()}-01-01`;
    }

    let sql = `
        SELECT 
          p.id AS product_id,
          p.name AS product_name,
          c.name AS category_name,
          SUM(od.qty * od.price) AS total_sale_amount,
          SUM(od.qty) AS total_quantity,
          COUNT(DISTINCT o.id) AS order_count
        FROM products p
        JOIN order_details od ON p.id = od.product_id
        JOIN orders o ON od.order_id = o.id
        JOIN categories c ON p.category_id = c.id
        WHERE o.business_id = ? 
        AND o.status != 'cancelled'
        AND DATE(o.created_at) BETWEEN ? AND ?
        ${target_branch_id ? 'AND o.branch_id = ?' : ''}
        GROUP BY p.id, p.name, c.name
        ORDER BY total_sale_amount DESC
        LIMIT 10
    `;

    const params = [business_id, from_date, to_date];
    if (target_branch_id) params.push(target_branch_id);

    const [list] = await db.query(sql, params);

    res.json({
      list,
      date_range: { from_date, to_date },
      success: true
    });
  } catch (error) {
    logError("top_sale.getlist", error, res);
  }
};