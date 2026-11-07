# Security Policy

The FactoryFlow ERP team takes industrial data protection, financial record integrity, and application security seriously.

---

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

---

## Security Architecture

FactoryFlow ERP incorporates multiple defense-in-depth security layers:

1. **Authentication & Password Hashing**:
   - Industry-standard bcrypt password hashing (10 salt rounds).
   - Signed JSON Web Tokens (JWT) for stateless session authentication.
2. **Role-Based Access Control (RBAC)**:
   - 11 enterprise manufacturing roles with strict endpoint-level permission enforcement via Express middleware (`requireRoles`).
   - Separation of duty: Only authorized roles can approve purchase orders, post invoices, or adjust warehouse balances.
3. **Data Integrity & Non-Negative Inventory**:
   - Critical manufacturing, financial, and inventory operations run inside ACID database transactions.
   - Negative inventory is strictly prevented at the database service layer.
4. **Audit Logging**:
   - Sensitive business operations (order confirmation, invoice posting, stock adjustments, role changes) are recorded in an immutable `AuditLog` table with user identity, timestamp, IP address, and operation details.
5. **AI Safety & Privacy**:
   - The AI Manufacturing Copilot executes strictly through permission-controlled backend tools.
   - The AI operates in read-only analysis mode for questions and requires explicit human confirmation for sensitive operations.
   - External OpenAI API keys remain protected server-side and are never exposed to browser state.

---

## Reporting a Vulnerability

If you discover a security vulnerability in FactoryFlow ERP:

1. **Do NOT open a public GitHub issue.**
2. Send an email with vulnerability details, reproduction steps, and potential impact to the maintainers or security team:
   - Email: `security@factoryflow.eg`
3. We will acknowledge receipt within 48 hours and provide an estimated timeline for remediation.
4. Once a fix is verified, a patched release and security advisory will be published.
