import { Router } from 'express';
import etlController from '../controllers/etlController';

const router = Router();

// ETL job management routes
router.post('/job/trigger', etlController.triggerJob);
router.get('/job/status', etlController.getStatus);
router.get('/properties/recent', etlController.getRecentProperties);

export default router; 