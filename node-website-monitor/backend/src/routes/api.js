const express = require('express');
const router = express.Router();
const {
  triggerAudit,
  getDashboardStats,
  getWordPressDetails,
  getAlerts,
  resolveAlert,
  getMonitoredTargets
} = require('../controllers/monitorController');
const {
  getSettings,
  saveSettings,
  testEmail
} = require('../controllers/settingsController');

// Immediate Site Audit Trigger
router.post('/audit', triggerAudit);

// Full-website deep crawl (page + image discovery across entire site)
router.post('/crawl', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing target URL in request body.' });
  try {
    const { crawlWebsite } = require('../services/pageAnalysisService');
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    const result = await crawlWebsite(normalizedUrl, '');
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: `Crawl failed: ${err.message}` });
  }
});

// Dashboard stats & historical graphs payload
router.get('/stats', getDashboardStats);

// Unique monitored target domains list
router.get('/targets', getMonitoredTargets);

// Wordpress details
router.get('/wordpress', getWordPressDetails);

// SRE alerts logs
router.get('/alerts', getAlerts);

// Resolve active alerts
router.post('/alerts/resolve', resolveAlert);

// SRE Settings & Alert configurations
router.get('/settings', getSettings);
router.post('/settings', saveSettings);

// SMTP Test email connection
router.post('/send-test-email', testEmail);
router.post('/send-test-email/', testEmail);

module.exports = router;
