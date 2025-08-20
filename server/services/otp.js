
const memory = new Map();

const gen = () => String(Math.floor(100000 + Math.random() * 900000));

export const sendOtp = async (phone) => {
  const code = gen();
  const expires = Date.now() + 1000 * 60 * 5; 
  memory.set(phone, { code, expires });
  // TODO: integrate real SMS provider here
  console.log(`[OTP] ${phone}: ${code}`);
  return true;
};

export const verifyOtp = (phone, code) => {
  const rec = memory.get(phone);
  if (!rec) return false;
  const ok = rec.code === code && Date.now() < rec.expires;
  if (ok) memory.delete(phone);
  return ok;
};