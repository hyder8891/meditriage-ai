# MediTriage AI Pro - Clinician User Guide

**Version 1.0** | **Last Updated:** December 2025 | **Author:** Manus AI

---

## Introduction

MediTriage AI Pro is a comprehensive medical operating system designed to enhance clinical decision-making through artificial intelligence. This guide provides healthcare professionals with detailed instructions for using the platform's advanced diagnostic and documentation tools.

The system combines evidence-based medical reasoning with modern technology to support clinicians in delivering accurate diagnoses, streamlining documentation workflows, and improving patient outcomes. By integrating multiple clinical tools into a unified interface, MediTriage AI Pro reduces cognitive load and allows healthcare providers to focus on patient care rather than administrative tasks.

---

## Getting Started

### Accessing the Platform

Navigate to the MediTriage AI Pro homepage and select **"Clinician Login"** from the navigation menu. The platform uses Manus OAuth for secure authentication, supporting Google, GitHub, and email-based login methods. Upon successful authentication, you will be directed to the clinician dashboard where all clinical tools are accessible through the sidebar navigation.

### Dashboard Overview

The clinician dashboard serves as the central hub for all clinical activities. The interface features a persistent sidebar on the left containing navigation links to all major features, while the main content area displays your active cases, recent activities, and quick-access tools. The dashboard provides real-time statistics including total active cases, pending diagnoses, and recent transcriptions.

---

## Core Features

### Case Management

The case management system allows you to create, track, and manage patient cases throughout the diagnostic and treatment process. Each case contains comprehensive patient information, clinical notes, vital signs, diagnoses, and treatment plans.

**Creating a New Case**

To create a new case, click the **"New Case"** button on the dashboard. Enter the patient's demographic information including name, age, and gender. Provide the chief complaint in natural language, describing the primary reason for the visit. Select the urgency level from emergency, urgent, semi-urgent, non-urgent, or routine based on clinical assessment. The system automatically timestamps the case and assigns it to your clinician profile.

**Managing Existing Cases**

Access your case list from the dashboard to view all active, completed, and archived cases. Each case card displays the patient name, chief complaint, urgency level, and last updated timestamp. Click on any case to view detailed information including vitals, diagnoses, clinical notes, and timeline events. Update case status as patients progress through treatment, moving cases from active to completed or archived as appropriate.

### Clinical Reasoning Engine

The Clinical Reasoning Engine leverages DeepSeek's advanced medical AI to generate differential diagnoses based on patient symptoms, vital signs, and medical history. This tool provides evidence-based diagnostic suggestions with probability scores to support clinical decision-making.

**Generating Differential Diagnoses**

From within a patient case, navigate to the Clinical Reasoning section. Enter the patient's symptoms as a comma-separated list or natural language description. Input current vital signs including blood pressure, heart rate, temperature, and oxygen saturation. The system processes this information through the AI engine and returns a ranked list of possible diagnoses with probability scores, supporting evidence, recommended tests, and red flags requiring immediate attention.

**Interpreting Results**

Each diagnosis includes a probability score indicating the likelihood based on presented symptoms and clinical data. Review the reasoning provided for each diagnosis to understand the AI's decision-making process. Pay special attention to red flags highlighted by the system, as these indicate potentially serious conditions requiring urgent intervention. The recommended actions section provides evidence-based next steps including laboratory tests, imaging studies, specialist referrals, or immediate treatments.

### Live Scribe - Voice Transcription

Live Scribe transforms clinical consultations into structured documentation through real-time voice-to-text transcription. This feature reduces documentation time and allows clinicians to maintain eye contact with patients during consultations.

**Recording a Consultation**

Navigate to the Live Scribe page from the sidebar. Click the **"Start Recording"** button to begin audio capture. The system uses your device's microphone to record the conversation. Speak naturally during the consultation, and the AI will automatically transcribe your words in real-time. Use the pause button to temporarily stop recording without ending the session, or click stop when the consultation is complete.

**Editing Transcriptions**

After recording, the transcription appears in an editable text area. Review the text for accuracy and make any necessary corrections. Identify speaker roles by selecting whether each section was spoken by the clinician, patient, or represents mixed dialogue. Add timestamps and annotations to mark important moments in the consultation. Link the transcription to a specific patient case for integrated documentation.

**Generating SOAP Notes**

The Smart Clinical Notes Generator converts raw transcriptions into structured SOAP format documentation. Click the **"Generate SOAP Note"** button after completing a transcription. The AI analyzes the conversation and automatically populates Subjective, Objective, Assessment, and Plan sections. Review each section for accuracy and completeness. Edit any section directly within the preview modal. Copy the SOAP note to your clipboard, download it as a text file, or save it directly to the patient's clinical notes.

### 3D Bio-Scanner

The 3D Bio-Scanner provides interactive anatomical visualization to help identify symptom locations and affected body systems. This tool enhances patient communication and diagnostic accuracy through visual symptom mapping.

**Using the Bio-Scanner**

Access the Bio-Scanner from the sidebar navigation. The interface displays a three-dimensional human body model with clickable regions including head, neck, chest, abdomen, upper limbs, and lower limbs. Symptoms from the current patient case are automatically highlighted with yellow pulsing indicators on relevant body regions. Click on any body region to view detailed organ information, common conditions affecting that area, and diagnostic considerations.

**Navigation Controls**

Rotate the 3D model by clicking and dragging with your mouse or using the rotation buttons. Zoom in and out using the dedicated zoom controls to examine specific anatomical areas in detail. Reset the view to the default position at any time using the reset button. The legend explains the color coding system, with yellow indicating active symptoms and blue representing normal regions.

### PharmaGuard - Drug Interaction Checker

PharmaGuard analyzes potential drug-drug interactions to prevent adverse events and ensure patient safety. This tool provides real-time alerts about medication conflicts, contraindications, and dosage concerns.

**Checking Drug Interactions**

Navigate to the PharmaGuard page from the sidebar. Enter medication names in the search field, selecting from the autocomplete suggestions. Add multiple medications to build a complete medication list for analysis. Click **"Check Interactions"** to process the medication combination through the AI analysis engine. The system returns interaction severity levels (major, moderate, minor), mechanisms of interaction, clinical significance, and specific recommendations for management.

**Interpreting Interaction Reports**

Major interactions require immediate attention and may necessitate medication changes or close monitoring. Moderate interactions should be considered but may be manageable with dosage adjustments or timing modifications. Minor interactions are typically clinically insignificant but worth noting in patient records. Each interaction includes detailed explanations of the mechanism and practical recommendations for clinical management.

### Care Locator

The Care Locator helps patients find appropriate medical facilities across Iraq, including hospitals, clinics, emergency services, and specialist centers. This tool is particularly valuable for referrals and emergency situations.

**Searching for Facilities**

Access the Care Locator from the sidebar navigation. Select the facility type from hospital, clinic, emergency, or specialist options. Choose a city from the dropdown menu featuring major Iraqi cities including Baghdad, Basra, Mosul, Erbil, and others. Click **"Search"** to retrieve matching facilities. Results display facility names in both Arabic and English, addresses, phone numbers, available specialties, and emergency service availability.

**Emergency Facilities**

The Emergency Facilities section provides quick access to hospitals with 24/7 emergency departments. These facilities are pre-filtered for immediate reference during urgent situations. Each listing includes direct phone numbers and addresses for rapid patient referral.

### Case Timeline

The Case Timeline visualizes patient history chronologically, showing symptom progression, vital signs trends, diagnoses, treatments, and interventions over time. This comprehensive view supports longitudinal care and pattern recognition.

**Viewing Timeline Events**

Access the timeline from within a patient case. Events are displayed vertically with the most recent at the top. Each event card shows the event type, timestamp, severity level, and relevant data. Color coding distinguishes different event types: symptoms (orange), vital signs (blue), diagnoses (purple), treatments (green), medications (pink), procedures (indigo), lab results (yellow), imaging (teal), and notes (gray).

**Filtering Events**

Use the filter buttons to show or hide specific event types. This allows focused review of particular aspects of patient care, such as viewing only vital signs trends or medication history. The vital signs section displays trends for blood pressure, heart rate, temperature, and oxygen saturation with visual indicators for normal, warning, and critical ranges.

---

## Best Practices

### Clinical Decision Support

While MediTriage AI Pro provides powerful diagnostic assistance, it is designed to augment rather than replace clinical judgment. Always correlate AI-generated diagnoses with your clinical examination findings, patient history, and professional experience. Use the system's recommendations as a starting point for differential diagnosis, but apply your medical knowledge to contextualize results for each individual patient.

### Documentation Efficiency

Maximize the value of Live Scribe by recording complete consultations rather than fragmenting documentation across multiple sessions. Review and edit transcriptions promptly while the consultation details are fresh in your memory. Use the SOAP note generator to create structured documentation quickly, but always review and customize the output to reflect your clinical reasoning and specific patient circumstances.

### Patient Safety

Pay particular attention to red flags highlighted by the Clinical Reasoning Engine, as these indicate potentially serious conditions requiring immediate intervention. Always verify drug interactions identified by PharmaGuard before prescribing or modifying medications. When in doubt, consult with colleagues, specialists, or pharmacists to ensure patient safety.

### Data Privacy

The platform implements robust security measures to protect patient information, but clinicians must also follow best practices. Always log out when leaving your workstation unattended. Do not share your login credentials with others. Ensure patient information is only accessed for legitimate clinical purposes. Follow your institution's policies regarding electronic health records and patient confidentiality.

---

## Troubleshooting

### Common Issues

**Transcription Accuracy Problems**

If Live Scribe produces inaccurate transcriptions, ensure you are speaking clearly and at a moderate pace. Check that your microphone is properly connected and positioned appropriately. Reduce background noise in the consultation environment. The system performs best with high-quality audio input and clear speech patterns.

**Slow AI Processing**

Clinical Reasoning Engine and PharmaGuard rely on external AI services that may occasionally experience delays. If processing takes longer than expected, wait for the system to complete rather than submitting multiple requests. Check your internet connection stability. During peak usage times, processing may take slightly longer but should complete within 30-60 seconds.

**Case Access Issues**

If you cannot access a specific case, verify that the case was created under your clinician account. Check that the case has not been archived or deleted. Ensure you have the appropriate permissions for the case. Contact your system administrator if access issues persist.

---

## Support and Resources

For technical support, feature requests, or bug reports, visit the Manus support portal at https://help.manus.im. The platform is continuously updated with new features and improvements based on user feedback. Check the changelog regularly for information about new capabilities and enhancements.

Additional training resources, video tutorials, and clinical use case examples are available in the online documentation portal. Join the MediTriage AI Pro community forum to connect with other healthcare professionals, share best practices, and learn advanced techniques for maximizing the platform's capabilities.

---

## Conclusion

MediTriage AI Pro represents a significant advancement in clinical decision support technology. By integrating artificial intelligence with traditional medical workflows, the platform empowers healthcare professionals to deliver more accurate diagnoses, reduce documentation burden, and improve patient outcomes. As you become more familiar with the system's capabilities, you will discover new ways to leverage its features to enhance your clinical practice.

We encourage you to explore all features thoroughly, provide feedback on your experience, and suggest improvements that would benefit your clinical workflow. Your insights help shape the future development of MediTriage AI Pro and ensure it continues to meet the evolving needs of healthcare professionals.
