<div class="markdown-heading" dir="auto"><h1 align="center" tabindex="-1" class="heading-element" dir="auto">Pwndoc1A</h1><a id="user-content-Pwndoc1A" class="anchor" aria-label="Permalink: Pwndoc1A" href="#Pwndoc1A"></a></div>
<p align="center"> <a href="https://vuejs.org/"><img src="https://img.shields.io/badge/Vue.js-v3.15.4-42b883" alt="Vue.js Badge" style="background-color:#42b883;"></a> <a href="https://quasar.dev/"><img src="https://img.shields.io/badge/Quasar-v2.14-1976d2" alt="Quasar Badge" style="background-color:#1976d2;"></a> <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-v18-ffca28" alt="Node.js Badge" style="background-color:#ffca28;"></a> <a href="https://www.mongodb.com/"><img src="https://img.shields.io/badge/MongoDB-v8.0-4DB33D" alt="MongoDB Badge" style="background-color:#4DB33D;"></a> <a href="https://www.docker.com/"><img src="https://img.shields.io/badge/Docker-0db7ed" alt="Docker Badge" style="background-color:#0db7ed;"></a> </p>

**PwnDoc1A** (a fork of Pwndoc) is a **penetration testing reporting application** designed to streamline the process of documenting findings and generating customizable Docx reports. It features easy findings creation, knowledge sharing, statistics, and report generation capabilities to further enhance efficiency.
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
- Statistics (WIP)

# Demos

![](https://github.com/AmadeusITGroup/pwndoc1A/blob/vue3/demo.gif)

![](https://github.com/AmadeusITGroup/pwndoc1A/blob/vue3/docs/_images/stats.png)

![](https://github.com/AmadeusITGroup/pwndoc1A/blob/vue3/docs/_images/statsReport.png)
# Donate

If you would like to help me and sponsor this project

[:heart: Sponsor Me](https://github.com/sponsors/chapizze)

Thank you for the support !
