const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/stats/summary', (req, res) => {
  try {
    const total = db.prepare("SELECT COUNT(*) as count FROM jobs WHERE user_id = ?").get(req.user.id);
    const applied = db.prepare("SELECT COUNT(*) as count FROM jobs WHERE user_id = ? AND status = 'Applied'").get(req.user.id);
    const interview = db.prepare("SELECT COUNT(*) as count FROM jobs WHERE user_id = ? AND status = 'Interview'").get(req.user.id);
    const offer = db.prepare("SELECT COUNT(*) as count FROM jobs WHERE user_id = ? AND status = 'Offer'").get(req.user.id);
    const rejected = db.prepare("SELECT COUNT(*) as count FROM jobs WHERE user_id = ? AND status = 'Rejected'").get(req.user.id);
    res.json({ total: total.count, applied: applied.count, interview: interview.count, offer: offer.count, rejected: rejected.count });
  } catch (error) {
    console.error('STATS ERROR:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/', (req, res) => {
  try {
    const jobs = db.prepare("SELECT * FROM jobs WHERE user_id = ? ORDER BY created_at DESC").all(req.user.id);
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const job = db.prepare("SELECT * FROM jobs WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
    if (!job) return res.status(404).json({ error: 'Job not found.' });
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

router.post('/', (req, res) => {
  try {
    const { company, position, status, location, salary, notes, apply_date, deadline } = req.body;
    if (!company || !position) return res.status(400).json({ error: 'Company and position are required.' });
    const result = db.prepare("INSERT INTO jobs (user_id, company, position, status, location, salary, notes, apply_date, deadline) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(req.user.id, company, position, status || 'Applied', location || null, salary || null, notes || null, apply_date || new Date().toISOString().split('T')[0], deadline || null);
    const newJob = db.prepare("SELECT * FROM jobs WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json({ message: 'Job added successfully.', job: newJob });
  } catch (error) {
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { company, position, status, location, salary, notes, apply_date, deadline } = req.body;
    const job = db.prepare("SELECT * FROM jobs WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
    if (!job) return res.status(404).json({ error: 'Job not found.' });
    db.prepare("UPDATE jobs SET company = ?, position = ?, status = ?, location = ?, salary = ?, notes = ?, apply_date = ?, deadline = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?").run(company || job.company, position || job.position, status || job.status, location || job.location, salary || job.salary, notes || job.notes, apply_date || job.apply_date, deadline || job.deadline, req.params.id, req.user.id);
    const updatedJob = db.prepare("SELECT * FROM jobs WHERE id = ?").get(req.params.id);
    res.json({ message: 'Job updated successfully.', job: updatedJob });
  } catch (error) {
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const job = db.prepare("SELECT * FROM jobs WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
    if (!job) return res.status(404).json({ error: 'Job not found.' });
    db.prepare("DELETE FROM jobs WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
    res.json({ message: 'Job deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

module.exports = router;
