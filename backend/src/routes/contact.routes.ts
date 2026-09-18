import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { sendContactEmail } from '../services/email';
import { notifyContactForm } from '../services/whatsapp';

const router = Router();

const contactSchema = z.object({
  name:    z.string().min(2, 'Name must be at least 2 characters').max(80),
  email:   z.string().email('Invalid email address'),
  phone:   z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
});

// Stricter rate-limit for contact form (5 per 15 min per IP)
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: 'Too many messages sent. Please try again later.' },
});

/**
 * POST /api/contact
 * Validates fields, sends email to owner & WhatsApp notification.
 */
router.post('/', contactLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = contactSchema.safeParse(req.body);
    if (!result.success) {
      const firstError = result.error.errors[0]?.message || 'Validation error';
      res.status(400).json({ success: false, error: firstError });
      return;
    }

    const data = result.data;

    // Send email (non-blocking, fire-and-forget style but we still await for UX)
    const emailSent = await sendContactEmail(data);

    // WhatsApp notification (non-blocking)
    try {
      notifyContactForm(data);
    } catch (e) {
      console.error('[Contact] WhatsApp notification failed:', e);
    }

    res.json({
      success: true,
      message: emailSent
        ? 'Your message has been sent! We will get back to you within 24 hours.'
        : 'Your message was received! We will get back to you within 24 hours.',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
