# PwnDoc1A

PwnDoc1A (Pwndoc fork) is a pentest reporting application making it simple and easy to write your findings and generate a customizable Docx report.  
The main goal is to have more time to **Pwn** and less time to **Doc** by mutualizing data like vulnerabilities between users.

# Installation Guide

## Prerequisites

- Git installed
- Docker and Docker Compose available
- `jq` command-line JSON processor
- Bash shell

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/AmadeusITGroup/pwndoc1A.git
cd pwndoc1A
```


### 2. Install jq

Depending on your operating system:

## Ubuntu/Debian

```bash 
sudo apt-get update sudo apt-get install jq
```

## macOS (using Homebrew)

```bash
brew install jq
```

## CentOS/RHEL

```bash
sudo yum install jq
```

### 3. Run Installation Script

```bash
./install.sh
```

### 4. Script Functionality

The `install.sh` script performs several critical setup tasks:

- **Cryptographic Key Generation**
    - Generates encryption keys for database security
    - Creates secure, unique cryptographic mechanisms
- **Authentication Configuration**
    - Configures Single Sign-On (SSO) authentication
    - Provides option to enable or disable SSO based on your infrastructure needs
- **Database Initialization**
    - Prepares and populates the database
    - Sets up initial data structures and configurations
- **Container Deployment**
    - Uses Docker Compose to deploy necessary containers
    - Ensures consistent environment across different systems

### 5. Post-Installation Verification

After running the script, verify:

- Containers are running correctly
- Database is populated
- Authentication mechanisms are functioning

## Troubleshooting

If you encounter issues during installation:

- Check script permissions (`chmod +x install.sh`)
- Verify all dependencies are installed
- Confirm `jq` is properly installed
- Review logs for specific error messages

You can also open an GitHub so that I can help you.

# Documentation
- [Installation](https://pwndoc.github.io/pwndoc/#/installation)
- [Data](https://pwndoc.github.io/pwndoc/#/data)
- [Vulnerabilities](https://pwndoc.github.io/pwndoc/#/vulnerabilities)
- [Audits](https://pwndoc.github.io/pwndoc/#/audits)
- [Templating](https://pwndoc.github.io/pwndoc/#/docxtemplate)

# Features

- Multiple Language support
- Multiple Data support
- Great Customization
  - Manage reusable Audit and Vulnerability Data
  - Create Custom Sections
  - Add custom fields to Vulnerabilities
- Vulnerabilities Management
- Multi-User reporting
- Docx Report Generation
- Docx Template customization

# Demos

![](https://github.com/AmadeusITGroup/pwndoc1A/blob/vue3/demo.gif)
# Donate

If you would like to help me and sponsor this project

[:heart: Sponsor Me](https://github.com/sponsors/chapizze)

Thank you for the support !
