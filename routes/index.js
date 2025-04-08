const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('index', {
    title: 'Fitness Goal Tracker',
    description: 'Track your fitness goals and monitor your progress'
  });
});

module.exports = router; 