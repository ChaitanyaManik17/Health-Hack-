# 🧠 S.H.I.E.L.D. Labs  
### *Strategic Health Innovation & Explainable Learning Division*  
> **AI-Powered, Explainable Evaluation for Objective Structured Clinical Examinations (OSCEs)**  

---

## 🚀 Overview  

**S.H.I.E.L.D. Labs** was developed to tackle one of the most persistent challenges in **medical education** — subjective, delayed, and inconsistent evaluation of clinical skills during **Objective Structured Clinical Examinations (OSCEs)**.  

These exams assess how medical students interact with standardized patients, diagnose conditions, and demonstrate empathy — but current manual grading methods vary across evaluators and institutions, creating bias and limiting scalability.  

To solve this, we built an **end-to-end AI evaluation platform** that delivers **instant, unbiased, and explainable feedback** using validated clinical rubrics and communication frameworks.

---

## 💡 Solution  

S.H.I.E.L.D. Labs automates the OSCE evaluation process from **audio upload to feedback generation**.  
It ensures:
- ⚖ **Fairness & consistency** across evaluations  
- ⚙ **Scalability** to handle large cohorts simultaneously  
- ⏱ **Instant feedback** within two minutes  
- 🔍 **Explainability** through transparent, evidence-linked justifications  

---

## 🏗 System Architecture  

### 🌐 Multi-Layered AWS Infrastructure  
Our architecture is designed for **scalability, security, and interoperability** with educational systems.  

#### **1️⃣ Input Layer**
- Students upload OSCE recordings (audio or transcript).  
- Files stored in **Amazon S3**.  
- Processed via **AWS Transcribe** and **AWS HealthScribe** for accurate, speaker-separated medical transcripts.  

#### **2️⃣ AI Evaluation Engine**
- Hosted on **Amazon EC2**, orchestrated with **Amazon SageMaker**.  
- Core analysis powered by **Google Gemini 2.5 Flash** integrated through **Amazon Bedrock**.  
- Two evaluation dimensions:  
  - **Clinical Accuracy:** 20-item *Critical Actions Checklist* + 10-point *IDEA rubric*  
  - **Empathy & Communication:** 7 domains forming a 35-point *Communication Score*  

#### **3️⃣ Frontend Dashboards**
- **React.js** frontend with role-based dashboards:  
  - 👩‍🏫 **Professor Dashboard:** Review/edit AI-generated feedback, adjust parameters, and rescore automatically.  
  - 🧑‍🎓 **Student Dashboard:** Receive detailed feedback with strengths, weaknesses, and improvement insights.  
- **SageMaker Insights** visualizes cohort performance and supports natural language queries like:  
  > “Which communication domain needs most improvement this semester?”  

#### **4️⃣ Kubernetes & Supervisor Orchestration**
- **Kubernetes Ingress** manages routing between backend (FastAPI), frontend (React), and AWS services.  
- **Supervisor** automates service deployment and restarts.  

---

## 🧠 Tech Stack  

| Layer | Technology |
|-------|-------------|
| **Frontend** | React.js, TailwindCSS |
| **Backend** | FastAPI (Python), AWS SDK |
| **Database** | MongoDB |
| **Cloud Services** | Amazon S3, Transcribe, HealthScribe, EC2, SageMaker, Bedrock |
| **AI Model** | Google Gemini 2.5 Flash |
| **Analytics** | SageMaker Insights |
| **Deployment** | Kubernetes, Supervisor |
| **Security** | IAM Roles, RBAC, HTTPS via Ingress |

---

## ⚙ Installation  

### 1️⃣ Clone the Repository  
bash
git clone https://github.com/<your-repo>/shield-labs.git
cd shield-labs
`

### 2️⃣ Install Backend Dependencies

bash
pip install -r requirements.txt


### 3️⃣ Install Frontend Dependencies

bash
cd frontend
yarn install


### 4️⃣ Configure Environment Variables

Create `.env` files with the following keys:


MONGO_URI=<your_mongodb_url>
AWS_ACCESS_KEY_ID=<your_aws_key>
AWS_SECRET_ACCESS_KEY=<your_aws_secret>
AWS_REGION=<aws_region>
GEMINI_API_KEY=<your_bedrock_gemini_key>


---

## ☁ AWS Setup

1. **Amazon S3** – Create secure storage buckets for OSCE recordings
2. **AWS Transcribe / HealthScribe** – Enable speech-to-text and medical transcript generation
3. **Amazon EC2** – Deploy the AI evaluation engine
4. **Amazon SageMaker** – Manage and fine-tune evaluation models
5. **Amazon Bedrock** – Integrate Google Gemini 2.5 Flash for multimodal evaluation
6. **SageMaker Insights** – Power analytics and query-based dashboards

---

## 🧩 Deployment

### 1️⃣ Verify AWS Services

Ensure S3, Transcribe, HealthScribe, EC2, SageMaker, and Bedrock are configured and IAM permissions are correct.

### 2️⃣ Confirm MongoDB Access

Verify MongoDB connectivity at the provided URI.

### 3️⃣ Launch Services

bash
sudo supervisorctl start all


This starts:

* Backend API on **port 8001**
* Frontend on **port 3000**

### 4️⃣ Configure Kubernetes Ingress

Example routing configuration:

yaml
path: /api
backend:
  service:
    name: backend-service
    port:
      number: 8001


---

## 🔍 Key Features

✅ **Automated OSCE Evaluation** – End-to-end AI feedback pipeline
✅ **Explainable Feedback** – Each comment linked to transcript evidence
✅ **Dual Role Dashboards** – Professors and students have tailored views
✅ **Cohort Analytics** – Compare student progress, visualize weaknesses
✅ **Natural Language Queries** – “Which student improved most in empathy?”
✅ **Scalable Deployment** – Kubernetes handles multiple evaluations in parallel

---

## 🔐 Security

* Role-Based Access Control (RBAC)
* Encrypted Amazon S3 storage
* IAM-based service permissions
* HTTPS secured endpoints via Kubernetes Ingress

---

## 📈 Impact

| Metric           | Before   | After S.H.I.E.L.D.             |
| ---------------- | -------- | ------------------------------ |
| Evaluation Time  | 3–5 days | **<2 minutes**                 |
| Inter-Rater Bias | High     | **Eliminated**                 |
| Feedback Detail  | Limited  | **Comprehensive, explainable** |
| Scalability      | Manual   | **Cloud-native & automated**   |

---

## 🧭 Future Roadmap

* 🎥 **Video-based Gesture Recognition**
* 🧾 **Custom Rubric Builder**
* 🧑‍💻 **LMS Integration (Canvas, Blackboard, Moodle)**
* 📈 **Adaptive Learning Insights** for personalized progress tracking

---

## 👥 Team

S.H.I.E.L.D. Labs was built by a multidisciplinary team of **AI engineers, data scientists, and medical educators** committed to advancing fairness, speed, and transparency in healthcare education.

---

## 🧾 License

This project is licensed under the **MIT License**.
See the [LICENSE](LICENSE) file for details.

---

## 🌟 Acknowledgments

Special thanks to:

* **AWS Educate** for cloud credits
* **Google Cloud / Gemini Team** for Bedrock API access
* **Medical Education Partners** for rubric validation

---

> ⚕ *S.H.I.E.L.D. Labs — Automating Fair, Fast, and Explainable OSCE Evaluations for the Next Generation of Healthcare Education.*



---

Would you like me to include a *Mermaid architecture diagram* (showing S3 → Transcribe → SageMaker → Bedrock → Dashboard flow) at the top of the README? It looks amazing on GitHub and gives a visual overview of your cloud pipeline.
```
