import { Router } from 'express';
import {
  addSavedAddress,
  deleteSavedAddress,
  getSavedAddresses,
  setDefaultAddress,
  updateSavedAddress
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);

router.get('/addresses', getSavedAddresses);
router.post('/addresses', addSavedAddress);
router.put('/addresses/:addressId', updateSavedAddress);
router.delete('/addresses/:addressId', deleteSavedAddress);
router.patch('/addresses/:addressId/default', setDefaultAddress);

export default router;
