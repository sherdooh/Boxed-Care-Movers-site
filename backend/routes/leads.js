const express = require("express");
const { body, validationResult } = require("express-validator");
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

    const conditions = [];
    const params = [];

    if (status && status !== "all") {
      conditions.push("status = $" + (params.length + 1));
      params.push(status);
    }

    if (search) {
      conditions.push(
        `(name ILIKE $${params.length + 1} OR email ILIKE $${params.length + 2} OR phone ILIKE $${params.length + 3} OR id ILIKE $${params.length + 4})`,
      );
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const validSortColumns = ["created_at", "move_date", "name", "status"];
    const sortColumn = validSortColumns.includes(sortBy)
      ? sortBy
      : "created_at";
    const order = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

    // Count total
    const countQuery = `SELECT COUNT(*) as total FROM leads ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated results
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const dataParams = [...params, parseInt(limit), offset];
    const dataQuery = `
      SELECT 
        id, date, name, email, phone, from_location, to_location,
        current_floor, destination_floor, current_size, destination_size,
        move_date, move_type, message, quoteNumber,
        status, status_updated_at, created_at, notes, admin_notes,
        viewed_at, last_updated_by
      FROM leads
      ${whereClause}
      ORDER BY ${sortColumn} ${order}
      LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}
    `;
    const dataResult = await pool.query(dataQuery, dataParams);
    const rows = dataResult.rows;

    // Get status counts
    const countsQuery = `
      SELECT status, COUNT(*) as count 
      FROM leads 
      GROUP BY status
    `;
    const countsResult = await pool.query(countsQuery);
    const counts = {
      all: total,
      new: 0,
      pending: 0,
      approved: 0,
      booked: 0,
      cancelled: 0,
    };
    countsResult.rows.forEach((row) => {
      counts[row.status] = parseInt(row.count);
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
    const result = await pool.query(`SELECT * FROM leads WHERE id = $1`, [
      req.params.id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Lead not found" });
    }

    // Get activities
    const activitiesResult = await pool.query(
      `SELECT * FROM lead_activities WHERE lead_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.params.id],
    );

    // Get notes
    const notesResult = await pool.query(
      `SELECT * FROM lead_notes WHERE lead_id = $1 ORDER BY created_at DESC`,
      [req.params.id],
    );

    // Mark as viewed
    await pool.query(
      `UPDATE leads SET viewed_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [req.params.id],
    );

    res.json({
      ...result.rows[0],
      activities: activitiesResult.rows,
      notes: notesResult.rows,
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
    const result = await pool.query(
      `UPDATE leads 
       SET status = $1, status_updated_at = CURRENT_TIMESTAMP, last_updated_by = $2
       WHERE id = $3`,
      [status, req.admin?.username || "admin", req.params.id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Lead not found" });
    }

    // Log activity
    await pool.query(
      `INSERT INTO lead_activities (id, lead_id, activity_type, description, data, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
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
         VALUES ($1, $2, $3, $4, $5)`,
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
      notes,
    } = req.body;

    try {
      const result = await pool.query(
        `INSERT INTO leads 
         (id, date, name, email, phone, from_location, to_location, 
          current_floor, destination_floor, current_size, destination_size, 
          move_date, move_type, message, quoteNumber, notes, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
         RETURNING *`,
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
         VALUES ($1, $2, $3, $4, $5)`,
        [
          `act_${Date.now()}`,
          id,
          "created",
          "Lead created from website",
          JSON.stringify({ source: "website" }),
        ],
      );

      res.status(201).json(result.rows[0]);
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
  const { notes, admin_notes, status } = req.body;

  try {
    const updates = [];
    const values = [];

    if (notes !== undefined) {
      updates.push(`notes = $${values.length + 1}`);
      values.push(notes);
    }
    if (admin_notes !== undefined) {
      updates.push(`admin_notes = $${values.length + 1}`);
      values.push(admin_notes);
    }
    if (status !== undefined) {
      updates.push(`status = $${values.length + 1}`);
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    values.push(req.params.id);
    const query = `UPDATE leads SET ${updates.join(", ")} WHERE id = $${values.length}`;
    await pool.query(query, values);

    // Log activity for status changes
    if (status) {
      await pool.query(
        `INSERT INTO lead_activities (id, lead_id, activity_type, description, data, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          `act_${Date.now()}`,
          req.params.id,
          "status_change",
          `Status updated`,
          JSON.stringify({ new_status: status }),
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
// DELETE /api/leads/:id – Hard delete (permanently remove)
// ============================================================
router.delete("/:id", auth, async (req, res, next) => {
  try {
    // Delete related activities and notes first (foreign key constraints)
    await pool.query(`DELETE FROM lead_activities WHERE lead_id = $1`, [
      req.params.id,
    ]);
    await pool.query(`DELETE FROM lead_notes WHERE lead_id = $1`, [
      req.params.id,
    ]);
    // Then delete the lead
    const result = await pool.query(`DELETE FROM leads WHERE id = $1`, [
      req.params.id,
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Lead not found" });
    }

    // og the deletion
    res.status(204).send(); // No content – successful deletion
  } catch (err) {
    next(err);
  }
});

module.exports = router;
