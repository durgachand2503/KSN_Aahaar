import mongoose, { Schema } from 'mongoose';

/**
 * Atomic counter for generating sequential, collision-safe IDs.
 * Uses MongoDB's $inc with findOneAndUpdate for atomicity.
 *
 * The document _id is a string (e.g. "orderId"), so we avoid the standard
 * IDocument interface and use a plain interface instead.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const counterSchema = new Schema<any>(
  {
    _id: { type: Schema.Types.Mixed, required: true },
    seq: { type: Number, default: 0 },
  },
  { _id: false } // Disable mongoose auto-ObjectId, we manage _id ourselves
);

const Counter = mongoose.model('Counter', counterSchema);

/**
 * Atomically increment and return the next sequence number for the given counter name.
 * Safe to call from concurrent requests — each call will get a unique number.
 */
export async function getNextSequence(counterName: string): Promise<number> {
  const result = await Counter.findOneAndUpdate(
    { _id: counterName },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  if (!result) throw new Error(`Failed to get next sequence for counter: ${counterName}`);
  return result.seq as number;
}

export default Counter;
