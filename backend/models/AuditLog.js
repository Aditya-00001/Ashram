import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  adminName: { type: String, required: true },
  action: { type: String, required: true }, // e.g., 'DELETED_EVENT', 'SENT_NEWSLETTER'
  details: { type: String, required: true } // e.g., 'Deleted event: Maha Shivaratri'
}, { timestamps: true });

export default mongoose.model('AuditLog', auditLogSchema);