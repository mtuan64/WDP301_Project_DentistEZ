const dns = require("dns").promises;

async function isEmailDomainValid(email) {
  const domain = email.split("@")[1];
  try {
    const records = await dns.resolveMx(domain);
    return records && records.length > 0;
  } catch (err) {
    return false;
  }
}

module.exports = isEmailDomainValid;
