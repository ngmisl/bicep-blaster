# Security Policy

## Supported Versions

The following versions of Bicep Blaster are currently supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.2.x   | :white_check_mark: |
| 1.1.x   | :white_check_mark: |
| 1.0.x   | :x:                |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of Bicep Blaster seriously. If you believe you've found a security vulnerability, please follow these steps:

1. **Do not disclose the vulnerability publicly** until it has been addressed by our team.
2. SimpleX details of the vulnerability to [BicepBlaster](https://simplex.chat/contact/#/?v=2-7&smp=smp%3A%2F%2FZKe4uxF4Z_aLJJOEsC-Y6hSkXgQS5-oc442JQGkyP8M%3D%40smp17.simplex.im%2F1CEQbUx7PLENFjgLngWHKRb-hTNQIOKR%23%2F%3Fv%3D1-3%26dh%3DMCowBQYDK2VuAyEAO805q6Syl84pJXUTqmNiPfLPU_Dk_hqyosW56vMy7BU%253D%26srv%3Dogtwfxyi3h2h5weftjjpjmxclhb5ugufa5rcyrmg7j4xlch7qsr5nuqd.onion) or open a private security advisory on GitHub.
3. Include as much information as possible, such as:
   - A description of the vulnerability
   - Steps to reproduce the issue
   - Potential impact
   - Suggested fixes (if any)

## Response Timeline

- **Initial Response**: You will receive an acknowledgment of your report within 48 hours.
- **Status Updates**: We will provide updates on the progress of addressing the vulnerability at least once every 7 days.
- **Resolution**: Once the vulnerability is fixed, we will notify you and discuss appropriate disclosure timelines.

## Security Measures

Bicep Blaster implements the following security measures:

- No personal workout data is stored on remote servers
- All exercise data is stored locally in the browser
- No sensitive permissions are required beyond what's needed for core functionality (wake lock, audio)
- Regular security audits of dependencies using Bun's built-in security tools

## Bug Bounty

We currently do not offer a formal bug bounty program, but we may provide acknowledgments in our release notes for significant security contributions.

## Supported Browsers

We officially support and test security updates on:

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)
- Mobile browsers (iOS Safari, Android Chrome)
