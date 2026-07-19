const express = require("express");
const { body, validationResult, query } = require("express-validator");
const { pool } = require("../db");
const auth = require("../middleware/auth");

const router = express.Router();

// ============================================================
// GET /api/leads – Filtered, sorted, paginated
// ============================================================
router.get("/", auth, async (req, res, next) => {
  try {
    const {
      status,
      search,
      sortBy = "created_at",
      sortOrder = "DESC",
      page = 1,
      limit = 20,
    } = req.query;

    // Build WHERE clause
    const conditions = [];
    const params = [];

    if (status && status !== "all") {
      conditions.push("status = ?");
      params.push(status);
    }

    if (search) {
      conditions.push(
        "(name LIKE ? OR email LIKE ? OR phone LIKE ? OR id LIKE ?)",
      );
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    // Valid sort columns
    const validSortColumns = [
      "created_at",
      "move_date",
      "name",
      "status",
      "updated_at",
    ];
    const sortColumn = validSortColumns.includes(sortBy)
      ? sortBy
      : "created_at";
    const order = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

    // Count total
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM leads ${whereClause}`,
      params,
    );
    const total = countResult[0].total;

    // Get paginated results
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const [rows] = await pool.query(
      `SELECT 
        id, date, name, email, phone, from_location, to_location,
        current_floor, destination_floor, current_size, destination_size,
        move_date, move_type, message, quoteNumber,
        status, status_updated_at, created_at, notes, admin_notes,
        viewed_at, last_updated_by
       FROM leads 
       ${whereClause}
       ORDER BY ${sortColumn} ${order}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset],
    );

    // Get status counts
    const [statusCounts] = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM leads 
      GROUP BY status
    `);

    const counts = {
      all: total,
      new: 0,
      pending: 0,
      approved: 0,
      booked: 0,
      cancelled: 0,
    };

    statusCounts.forEach((row) => {
      counts[row.status] = row.count;
    });

    res.json({
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
      counts,
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// GET /api/leads/:id – Full lead details with history
// ============================================================
router.get("/:id", auth, async (req, res, next) => {
  try {
    const [rows] = await pool.query(`SELECT * FROM leads WHERE id = ?`, [
      req.params.id,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Lead not found" });
    }

    // Get activities
    const [activities] = await pool.query(
      `SELECT * FROM lead_activities WHERE lead_id = ? ORDER BY created_at DESC LIMIT 50`,
      [req.params.id],
    );

    // Get notes
    const [notes] = await pool.query(
      `SELECT * FROM lead_notes WHERE lead_id = ? ORDER BY created_at DESC`,
      [req.params.id],
    );

    // Mark as viewed
    await pool.query(
      `UPDATE leads SET viewed_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [req.params.id],
    );

    res.json({
      ...rows[0],
      activities,
      notes,
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// PATCH /api/leads/:id/status – Update status
// ============================================================
router.patch("/:id/status", auth, async (req, res, next) => {
  const { status } = req.body;
  const validStatuses = ["new", "pending", "approved", "booked", "cancelled"];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    const [result] = await pool.query(
      `UPDATE leads 
       SET status = ?, status_updated_at = CURRENT_TIMESTAMP, last_updated_by = ?
       WHERE id = ?`,
      [status, req.admin?.username || "admin", req.params.id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Lead not found" });
    }

    // Log activity
    await pool.query(
      `INSERT INTO lead_activities (id, lead_id, activity_type, description, data, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        `act_${Date.now()}`,
        req.params.id,
        "status_change",
        `Status changed to ${status}`,
        JSON.stringify({ from: "previous", to: status }),
        req.admin?.username || "admin",
      ],
    );

    res.json({ message: "Status updated", status });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// POST /api/leads/:id/notes – Add note
// ============================================================
router.post(
  "/:id/notes",
  auth,
  [
    body("content").notEmpty().trim(),
    body("isInternal").optional().isBoolean(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const noteId = `note_${Date.now()}`;
      await pool.query(
        `INSERT INTO lead_notes (id, lead_id, content, is_internal, created_by)
       VALUES (?, ?, ?, ?, ?)`,
        [
          noteId,
          req.params.id,
          req.body.content,
          req.body.isInternal || false,
          req.admin?.username || "admin",
        ],
      );

      res.status(201).json({ id: noteId, message: "Note added" });
    } catch (err) {
      next(err);
    }
  },
);

// ============================================================
// POST /api/leads – Create lead (public)
// ============================================================
router.post(
  "/",
  [
    body("name").notEmpty().trim(),
    body("email").isEmail(),
    body("phone").notEmpty(),
    body("from_location").notEmpty(),
    body("to_location").notEmpty(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const id = req.body.id || `lead_${Date.now()}`;
    const date = new Date().toLocaleString();

    const {
      name,
      email,
      phone,
      from_location,
      to_location,
      current_floor,
      destination_floor,
      current_size,
      destination_size,
      move_date,
      move_type,
      message,
      quoteNumber,
      // New fields
      notes,
    } = req.body;

    try {
      await pool.query(
        `INSERT INTO leads 
       (id, date, name, email, phone, from_location, to_location, 
        current_floor, destination_floor, current_size, destination_size, 
        move_date, move_type, message, quoteNumber, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          date,
          name,
          email,
          phone,
          from_location,
          to_location,
          current_floor,
          destination_floor,
          current_size,
          destination_size,
          move_date,
          move_type,
          message,
          quoteNumber,
          notes || "",
          "new",
        ],
      );

      // Log activity
      await pool.query(
        `INSERT INTO lead_activities (id, lead_id, activity_type, description, data)
       VALUES (?, ?, ?, ?, ?)`,
        [
          `act_${Date.now()}`,
          id,
          "created",
          "Lead created from website",
          JSON.stringify({ source: "website" }),
        ],
      );

      res.status(201).json({ id, ...req.body });
    } catch (err) {
      console.error("Error creating lead:", err);
      next(err);
    }
  },
);

// ============================================================
// PATCH /api/leads/:id – Update lead (admin)
// ============================================================
router.patch("/:id", auth, async (req, res, next) => {
  const { notes, admin_notes, ...rest } = req.body;

  try {
    const updates = [];
    const values = [];

    // Build dynamic update query
    const allowedFields = ["notes", "admin_notes", "status"];
    Object.entries(req.body).forEach(([key, value]) => {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    values.push(req.params.id);
    await pool.query(
      `UPDATE leads SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );

    // Log activity for status changes
    if (req.body.status) {
      await pool.query(
        `INSERT INTO lead_activities (id, lead_id, activity_type, description, data, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          `act_${Date.now()}`,
          req.params.id,
          "status_change",
          `Status updated`,
          JSON.stringify({ new_status: req.body.status }),
          req.admin?.username || "admin",
        ],
      );
    }

    res.json({ message: "Lead updated" });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// DELETE /api/leads/:id – Soft delete (archive)
// ============================================================
router.delete("/:id", auth, async (req, res, next) => {
  try {
    // Soft delete: mark as cancelled and archive
    await pool.query(`UPDATE leads SET status = 'cancelled' WHERE id = ?`, [
      req.params.id,
    ]);

    await pool.query(
      `INSERT INTO lead_activities (id, lead_id, activity_type, description, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [
        `act_${Date.now()}`,
        req.params.id,
        "archived",
        "Lead archived",
        req.admin?.username || "admin",
      ],
    );

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
