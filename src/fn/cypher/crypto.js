

import crypto from 'crypto';

export function sha(raw) {
  return crypto.createHash('sha256')
    .update(raw, 'utf8')
    .digest('hex');
}
