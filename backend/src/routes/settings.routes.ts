import { Router, Request, Response } from 'express';

const router = Router();

/**
 * GET /api/settings/public
 * Return public-facing business settings
 */
router.get('/public', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      brandName: 'KSN AAHAAR',
      tagline: 'Authentic Cloud Kitchen',
      phone: '+91 93XX XXX XXX',
      email: 'hello@ksnaahaar.com',
      location: 'Miyapur, Hyderabad, Telangana',
      deliveryCharge: 30,
      freeDeliveryThreshold: 500,
      minOrderAmount: 199,
      estimatedDeliveryTime: '30-45 min',
      workingHours: {
        monday: '11:00 AM – 10:00 PM',
        tuesday: '11:00 AM – 10:00 PM',
        wednesday: '11:00 AM – 10:00 PM',
        thursday: '11:00 AM – 10:00 PM',
        friday: '11:00 AM – 11:00 PM',
        saturday: '11:00 AM – 11:00 PM',
        sunday: '11:00 AM – 10:00 PM',
      },
      socialLinks: {
        instagram: 'https://instagram.com/ksnaahaar',
        facebook: 'https://facebook.com/ksnaahaar',
        whatsapp: 'https://wa.me/919XXXXXXXX',
      },
      razorpayKey: process.env.RAZORPAY_KEY_ID || '',
    },
  });
});

export default router;
