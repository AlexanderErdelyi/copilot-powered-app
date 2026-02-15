# Security Policy

## 🔒 Reporting Security Vulnerabilities

We take the security of Sanitas Mind seriously. If you believe you've found a security vulnerability, please help us by reporting it responsibly.

### ⚠️ Please DO NOT:

- ❌ Open a public GitHub issue for security vulnerabilities
- ❌ Disclose the vulnerability publicly before we've had a chance to address it
- ❌ Exploit the vulnerability beyond what's necessary to demonstrate it

### ✅ Please DO:

- ✉️ **Email security reports to:** [security@sanitasmind.app](mailto:security@sanitasmind.app)
- 📝 Include detailed information about the vulnerability
- 🕐 Give us reasonable time to respond and fix the issue
- 🤝 Work with us to understand and resolve the issue

## 📧 What to Include in Your Report

Please provide as much information as possible to help us understand and reproduce the issue:

### Required Information

1. **Type of vulnerability** (e.g., XSS, SQL injection, authentication bypass, etc.)
2. **Full paths of source file(s)** related to the vulnerability
3. **Location of the affected code** (file path, line numbers)
4. **Step-by-step instructions** to reproduce the issue
5. **Proof-of-concept or exploit code** (if possible)
6. **Impact of the issue** - What can an attacker do?

### Optional but Helpful

- Screenshots or videos demonstrating the vulnerability
- Suggested fix or mitigation
- Your environment details (OS, browser, versions)
- Any special configuration required to reproduce

### Report Template

```markdown
## Vulnerability Type
[e.g., Cross-Site Scripting (XSS)]

## Affected Component
[e.g., Receipt upload form, Voice Assistant input]

## Severity
[Critical / High / Medium / Low]

## Description
[Detailed description of the vulnerability]

## Steps to Reproduce
1. Go to [page]
2. Enter [payload]
3. Observe [result]

## Impact
[What can an attacker achieve?]

## Proof of Concept
[Code, screenshots, or video]

## Suggested Fix
[If you have one]

## Environment
- OS: [e.g., Windows 11]
- Browser: [e.g., Chrome 119]
- Version: [e.g., 1.0.0]
```

## 🕐 Response Timeline

We aim to respond to security reports according to the following timeline:

| Timeframe | Action |
|-----------|--------|
| **Within 48 hours** | Initial acknowledgment of your report |
| **Within 7 days** | Initial assessment and severity classification |
| **Within 30 days** | Resolution plan or fix implementation (depending on severity) |
| **After fix** | Public disclosure coordination |

**Note:** Complex vulnerabilities may take longer to address. We'll keep you updated throughout the process.

## 🏆 Security Researcher Recognition

We value the security community's efforts in making Sanitas Mind safer:

- **Acknowledgment** - With your permission, we'll credit you in our security advisories
- **Hall of Fame** - Public recognition on our website (optional)
- **Swag** - Sanitas Mind merchandise for significant findings (when available)

**Note:** This is a community project without a formal bug bounty program at this time.

## 🛡️ Supported Versions

We provide security updates for the following versions:

| Version | Supported          | Status |
| ------- | ------------------ | ------ |
| 1.0.x   | ✅ Yes             | Current stable release |
| < 1.0   | ❌ No              | Pre-release/development versions |

**Recommendation:** Always use the latest stable version for the best security.

## 🔐 Security Best Practices for Users

### Protect Your Data

- **Use strong passwords** - If authentication is implemented
- **Keep software updated** - Always use the latest version
- **Backup regularly** - Use the export feature to backup your data
- **Be cautious with imports** - Only import data from trusted sources
- **Review permissions** - Check browser permissions (camera, microphone, etc.)

### Privacy Considerations

- **Local storage** - Most data is stored locally in your browser
- **API keys** - Keep your GitHub Copilot API keys private
- **Receipt images** - Consider removing sensitive information before uploading
- **Shared devices** - Use incognito/private browsing on public computers

### Browser Security

- **Use modern browsers** - Chrome, Firefox, Safari, or Edge (latest versions)
- **Enable security features** - Keep browser security settings enabled
- **HTTPS only** - Ensure you're using HTTPS in production
- **Extensions** - Be cautious with browser extensions that can access page data

## 🔍 Known Security Considerations

### Current Implementation

**Data Storage:**
- Data is stored locally using browser localStorage and IndexedDB
- Receipt images may contain sensitive information
- No server-side data synchronization (by design)

**API Keys:**
- GitHub Copilot API keys are required for AI features
- Keys should be stored securely (not hardcoded)
- Keys are stored in configuration files (not in version control)

**Client-Side Processing:**
- OCR and AI processing happen via API calls
- Receipt data is sent to GitHub Copilot API
- No third-party analytics or tracking

### Security Features

✅ **Implemented:**
- Client-side data storage (no server-side data collection)
- HTTPS support for production
- Content Security Policy headers
- XSS protection via React's built-in escaping
- CORS configuration
- Input validation and sanitization

⏳ **Planned:**
- End-to-end encryption for receipt images
- Optional password protection for data export
- Two-factor authentication (if user accounts are added)
- Security headers audit
- Dependency security scanning (Dependabot)

## 🚨 Past Security Issues

**None reported yet.** This section will be updated as security issues are discovered and resolved.

When issues are disclosed, they will be documented here with:
- CVE number (if assigned)
- Severity rating
- Affected versions
- Fixed version
- Mitigation steps

## 📚 Security Resources

### For Developers

- [OWASP Top 10](https://owasp.org/www-project-top-ten/) - Common web vulnerabilities
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/) - Security best practices
- [React Security Best Practices](https://react.dev/learn/security)
- [.NET Security Documentation](https://docs.microsoft.com/en-us/aspnet/core/security/)

### Security Tools

We use/recommend these tools for security:

- **npm audit** - Check for vulnerable dependencies
- **Dependabot** - Automated dependency updates
- **ESLint security plugins** - Static code analysis
- **.NET Security Code Scan** - Backend vulnerability scanning

### Running Security Checks

**Frontend dependency check:**
```bash
cd ReceiptHealth/client
npm audit
```

**Backend dependency check:**
```bash
cd ReceiptHealth
dotnet list package --vulnerable
```

**Fix known vulnerabilities:**
```bash
# Frontend
npm audit fix

# Backend
dotnet add package [PackageName] --version [SafeVersion]
```

## 🔐 Secure Development Guidelines

### For Contributors

When contributing code, please:

1. **Validate all inputs** - Never trust user input
2. **Sanitize outputs** - Prevent XSS attacks
3. **Use parameterized queries** - Prevent SQL injection
4. **Avoid hardcoding secrets** - Use environment variables
5. **Keep dependencies updated** - Regularly check for updates
6. **Review code for security** - Think like an attacker
7. **Test error handling** - Don't leak sensitive information in errors
8. **Follow least privilege** - Only request necessary permissions

### Code Review Checklist

- [ ] No hardcoded credentials or API keys
- [ ] User inputs are validated and sanitized
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Sensitive data is encrypted
- [ ] Error messages don't leak sensitive information
- [ ] Dependencies are up to date
- [ ] No security warnings from linters
- [ ] Authentication/authorization properly implemented
- [ ] CORS configured correctly

## 📞 Contact Information

**Security Team:** [security@sanitasmind.app](mailto:security@sanitasmind.app)

**PGP Key:** Available upon request (email us first)

**Response Time:** We aim to respond within 48 hours

**Alternative Contact:** For urgent critical vulnerabilities, also message [@AlexanderErdelyi](https://github.com/AlexanderErdelyi) directly on GitHub

---

## 🙏 Thank You

We appreciate security researchers and users who help keep Sanitas Mind safe. Responsible disclosure helps protect all users of the application.

**Your security report could help thousands of users. Thank you for being a responsible security researcher!** 🛡️

---

*Last Updated: February 15, 2026*
