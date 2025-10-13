const crypto = require('crypto');
const secret = process.env.FO_WEBHOOK_SECRET || '7d82e2b8945c43959699bc3a3c1467bdd66954d25d6f41eb';
const payload = process.argv[2];
console.log(crypto.createHmac('sha256', secret).update(payload).digest('hex'));