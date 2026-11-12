\# 🛡️ SentinelOps

\### Centralized Log Monitoring and Threat Detection System



\*\*Monitor. Detect. Analyze. Secure.\*\*



SentinelOps is a cybersecurity monitoring platform developed as part of an internship project at \*\*Unlox\*\*. It is designed to help security analysts monitor system activities, analyze security logs, identify suspicious behavior, manage security alerts, and generate reports through a centralized Security Operations Center (SOC) dashboard.



\## 🚀 Project Overview



SentinelOps focuses on centralized security monitoring and threat detection for Windows and Linux environments.



The platform provides a unified interface for exploring security events, monitoring endpoints, managing detection rules, and analyzing potential security threats.



\## ✨ Key Features



\- \*\*Security Dashboard\*\* – View security statistics, activity charts, and monitoring information.

\- \*\*Log Explorer\*\* – Search, filter, and analyze security events.

\- \*\*Endpoint Monitoring\*\* – View and manage monitored endpoints.

\- \*\*Security Alerts\*\* – Review, acknowledge, resolve, and add notes to alerts.

\- \*\*Detection Rules\*\* – Configure rule-based threat detection.

\- \*\*Security Use Cases\*\* – Explore cybersecurity monitoring scenarios.

\- \*\*Report Generation\*\* – Generate and download PDF and CSV reports.

\- \*\*User Profile\*\* – Manage profile information and preferences.

\- \*\*SOC Interface\*\* – Modern dark-themed security monitoring interface.



\## 🔍 Security Monitoring Use Cases



1\. Windows Failed Login Detection

2\. Suspicious Successful Login Detection

3\. Linux SSH Login Monitoring

4\. File Integrity Monitoring

5\. Kali Linux Activity Monitoring



\## 🛠️ Technology Stack



| Category | Technologies |

|---|---|

| Frontend | React 18, TypeScript |

| Styling | Tailwind CSS |

| Charts | Recharts |

| Build Tool | Vite |

| Data Persistence | Browser Local Storage |

| Reporting | jsPDF, jsPDF-AutoTable |

| Version Control | Git, GitHub |

| Planned Log Integration | Elasticsearch, Logstash, Kibana, Winlogbeat, Filebeat |



\## 💻 Installation and Setup



\### Prerequisites

\- Node.js

\- npm

\- Visual Studio Code

\- Git



\### 1. Clone the Repository



```bash

git clone https://github.com/deepakjm007/SentinelOps.git

```



\### 2. Open the Project



```bash

cd SentinelOps

```



\### 3. Install Dependencies



```bash

npm install

```



\### 4. Start the Application



```bash

npm run dev

```



\### 5. Open in Browser



```text

http://localhost:5173/

```



Use the local URL displayed in your terminal if a different port is assigned.



\## 🏗️ ELK Stack Integration



SentinelOps is designed to support centralized log monitoring using the ELK Stack.



\- \*\*Elasticsearch:\*\* Stores and indexes security events.

\- \*\*Logstash:\*\* Processes and forwards incoming logs.

\- \*\*Kibana:\*\* Provides log visualization and analysis.

\- \*\*Winlogbeat:\*\* Collects Windows event logs.

\- \*\*Filebeat:\*\* Collects Linux system and authentication logs.



\*\*Integration Status:\*\* Real-time ELK data collection and integration with the SentinelOps frontend are pending. The current application uses simulated monitoring data. Live monitoring requires completing the ELK integration.



\## 🔒 Security Considerations



The current frontend uses browser-based demo authentication and local data persistence.



Production deployment requires secure backend authentication, role-based authorization, protected APIs, and secure data storage.



Never upload passwords, API keys, authentication tokens, or private environment files to GitHub.



\## 🎯 Project Goals



\- Develop a centralized cybersecurity monitoring platform.

\- Understand Windows and Linux security log monitoring.

\- Explore suspicious activities and threat detection.

\- Implement rule-based security monitoring.

\- Understand SOC workflows and security alert management.

\- Build practical cybersecurity development experience.



\## 👨‍💻 Developer



\*\*Deepak J M\*\*



Cybersecurity Intern – Unlox



B.Tech – Computer Science and Engineering (Cyber Security)



GM University, Davanagere



GitHub: https://github.com/deepakjm007



\## 📄 Project Information



\*\*Project Name:\*\* SentinelOps



\*\*Project Type:\*\* Cybersecurity Internship Project



\*\*Organization:\*\* Unlox



\*\*Domain:\*\* Cybersecurity | SOC | SIEM | Threat Detection



\---



Developed as part of the Unlox internship to gain practical experience in cybersecurity monitoring, log analysis, and security operations.

