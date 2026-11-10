import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRY } from '../../config/index.js';

type SessionUser = {
  id: string;
  nama: string;
  email: string;
  peran: string;
  agencyId?: string | null;
  agency?: { nama: string } | null;
};

export function createSession(user: SessionUser) {
  const agencyId = user.agencyId ?? null;
  return {
    token: jwt.sign({ id: user.id, peran: user.peran, agencyId }, JWT_SECRET, { expiresIn: JWT_EXPIRY }),
    user: {
      id: user.id, nama: user.nama, email: user.email, peran: user.peran,
      agencyId, agencyNama: user.agency?.nama ?? null,
    },
  };
}
