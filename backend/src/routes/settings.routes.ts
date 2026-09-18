import { Router, Request, Response } from 'express';
import { config } from '../config';

const router = Router();

/**
 * GET /api/settings/public
 * Return public-facing business settings (read from config/env)
 */
router.get('/public', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      brandName: 'KSN AAHAAR',
      tagline: 'Authentic Cloud Kitchen',
      phone: process.env.BRAND_PHONE || '+91 79938 77507',
      email: process.env.BRAND_EMAIL || 'order@ksnaahaar.com',
      location: process.env.BRAND_LOCATION || 'Miyapur, Hyderabad, Telangana',
      deliveryCharge: config.business.deliveryCharge,
      freeDeliveryThreshold: config.business.freeDeliveryThreshold,
      minOrderAmount: config.business.minOrderAmount,
      estimatedDeliveryTime: config.business.defaultEstimatedTime,
      workingHours: {
        monday:    '11:00 AM – 10:00 PM',
        tuesday:   '11:00 AM – 10:00 PM',
        wednesday: '11:00 AM – 10:00 PM',
        thursday:  '11:00 AM – 10:00 PM',
        friday:    '11:00 AM – 11:00 PM',
        saturday:  '11:00 AM – 11:00 PM',
        sunday:    '11:00 AM – 10:00 PM',
      },
      socialLinks: {
        instagram: process.env.SOCIAL_INSTAGRAM || 'https://instagram.com/ksnaahaar',
        facebook:  process.env.SOCIAL_FACEBOOK  || 'https://facebook.com/ksnaahaar',
        whatsapp:  config.whatsapp.ownerPhone
          ? `https://wa.me/${config.whatsapp.ownerPhone.replace(/[^0-9]/g, '')}`
          : '',
      },
      razorpayKey: config.razorpay.keyId,
    },
  });
});

export default router;
