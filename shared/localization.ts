export type Language = 'en' | 'ar';

export interface LocalizationStrings {
  // Homepage
  homepage: {
    // New Modern Homepage (Mediktor-inspired)
    modernHero: {
      title: string;
      subtitle: string;
      ctaPrimary: string;
      ctaSecondary: string;
      trustBadge: string;
      stat1: string;
      stat2: string;
      stat3: string;
    };
    problem: {
      title: string;
      description: string;
    };
    solution: {
      title: string;
      card1Title: string;
      card1Desc: string;
      card2Title: string;
      card2Desc: string;
      card3Title: string;
      card3Desc: string;
    };
    industries: {
      title: string;
      ed: { title: string; description: string; cta: string };
      urgentCare: { title: string; description: string; cta: string };
      healthSystems: { title: string; description: string; cta: string };
      telemedicine: { title: string; description: string; cta: string };
    };
    howItWorks: {
      title: string;
      step1: { title: string; description: string };
      step2: { title: string; description: string };
      step3: { title: string; description: string };
      step4: { title: string; description: string };
    };
    featuresGrid: {
      title: string;
      feature1: string;
      feature1Desc: string;
      feature2: string;
      feature2Desc: string;
      feature3: string;
      feature3Desc: string;
      feature4: string;
      feature4Desc: string;
      feature5: string;
      feature5Desc: string;
      feature6: string;
      feature6Desc: string;
    };
    validation: {
      title: string;
      accuracy: string;
      facilities: string;
      patients: string;
      countries: string;
    };
    partners: {
      title: string;
      healthcare: string;
      technology: string;
      academic: string;
    };
    testimonialsSection: {
      title: string;
      quote1: string;
      author1: string;
      role1: string;
      quote2: string;
      author2: string;
      role2: string;
      quote3: string;
      author3: string;
      role3: string;
    };
    caseStudySection: {
      title: string;
      facility: string;
      challenge: string;
      solution: string;
      result1: string;
      result2: string;
      result3: string;
      result4: string;
    };
    faqSection: {
      title: string;
      q1: string;
      a1: string;
      q2: string;
      a2: string;
      q3: string;
      a3: string;
      q4: string;
      a4: string;
      q5: string;
      a5: string;
      q6: string;
      a6: string;
      q7: string;
      a7: string;
      q8: string;
      a8: string;
    };
    ctaSection: {
      title: string;
      subtitle: string;
      btnDemo: string;
      btnWhitepaper: string;
      btnContact: string;
      email: string;
      phoneSaudi: string;
      phoneUAE: string;
    };
    footerNew: {
      company: string;
      aboutUs: string;
      careers: string;
      pressKit: string;
      contact: string;
      solutions: string;
      emergencyDept: string;
      urgentCare: string;
      telemedicine: string;
      healthSystems: string;
      resources: string;
      documentation: string;
      apiReference: string;
      caseStudies: string;
      blog: string;
      legal: string;
      privacy: string;
      terms: string;
      security: string;
      compliance: string;
      newsletter: string;
      newsletterDesc: string;
      subscribe: string;
      copyright: string;
    };
    // Original Homepage
    nav: {
      clinicianLogin: string;
      patientPortal: string;
    };
    hero: {
      title: string;
      subtitle: string;
      getStarted: string;
      learnMore: string;
    };
    stats: {
      accuracy: string;
      timeSaved: string;
      cases: string;
      satisfaction: string;
    };
    features: {
      title: string;
      subtitle: string;
      clinicalReasoning: { title: string; desc: string };
      bioScanner: { title: string; desc: string };
      liveScribe: { title: string; desc: string };
      pharmaGuard: { title: string; desc: string };
      xrayAnalysis: { title: string; desc: string };
      careLocator: { title: string; desc: string };
    };
    benefits: {
      title: string;
      items: string[];
    };
    cta: {
      title: string;
      subtitle: string;
      startTrial: string;
      scheduleDemo: string;
    };
    footer: {
      tagline: string;
      description: string;
      product: string;
      company: string;
      rights: string;
    };
    slideshow: {
      caption: string;
      slides: {
        clinicalReasoning: { title: string; desc: string; features: string[] };
        bioScanner: { title: string; desc: string; features: string[] };
        liveScribe: { title: string; desc: string; features: string[] };
        pharmaGuard: { title: string; desc: string; features: string[] };
        xrayAnalysis: { title: string; desc: string; features: string[] };
        careLocator: { title: string; desc: string; features: string[] };
        soapGenerator: { title: string; desc: string; features: string[] };
        caseTimeline: { title: string; desc: string; features: string[] };
      };
    };
  };
  // Clinician Portal
  clinicianPortal: {
    clinicalReasoning: {
      title: string;
      subtitle: string;
      backToDashboard: string;
      poweredBy: string;
      patientInfo: {
        title: string;
        subtitle: string;
      };
      input: {
        chiefComplaint: string;
        chiefComplaintPlaceholder: string;
        symptoms: string;
        symptomsPlaceholder: string;
        textMode: string;
        voiceMode: string;
        startRecording: string;
        recording: string;
        stopRecording: string;
        recordedAudio: string;
        deleteRecording: string;
        reRecord: string;
        patientAge: string;
        patientAgePlaceholder: string;
        patientGender: string;
        genderMale: string;
        genderFemale: string;
        genderOther: string;
        bloodPressure: string;
        bloodPressurePlaceholder: string;
        heartRate: string;
        heartRatePlaceholder: string;
        temperature: string;
        temperaturePlaceholder: string;
        oxygenSaturation: string;
        oxygenSaturationPlaceholder: string;
      };
      buttons: {
        generate: string;
        analyzing: string;
      };
      results: {
        differentialDiagnosis: string;
        clinicalReasoning: string;
        recommendations: string;
        redFlags: string;
        guidelines: string;
        confidence: string;
        noAnalysis: string;
        enterInfo: string;
      };
    };
  };
  // Patient Portal
  patientPortal: {
    symptomChecker: {
      title: string;
      subtitle: string;
      backToHome: string;
      disclaimer: {
        title: string;
        text: string;
      };
      input: {
        title: string;
        placeholder: string;
        analyzeButton: string;
        analyzing: string;
      };
      results: {
        title: string;
        urgency: string;
        possibleConditions: string;
        recommendations: string;
        whenToSeek: string;
        selfCare: string;
        noResults: string;
      };
    };
    dashboard: {
      title: string;
      welcome: string;
      myAppointments: string;
      testResults: string;
      medicalHistory: string;
      medications: string;
    };
  };
  title: string;
  subtitle: string;
  startTriage: string;
  disclaimerBanner: string;
  languageName: string;
  inputPlaceholder: string;
  send: string;
  triageTitle: string;
  adviceTitle: string;
  restart: string;
  loading: string;
  processing: string;
  analyzingFile: string;
  printReport: string;
  downloadPdf: string;
  copyReport: string;
  copied: string;
  safetyAgreement: string;
  loadingSteps: string[];
  quickResponses: {
    yes: string;
    no: string;
    unsure: string;
    mild: string;
    severe: string;
  };
  voice: {
    start: string;
    listening: string;
    stop: string;
    readAloud: string;
    stopReading: string;
    notSupported: string;
  };
  summaryHeaders: {
    age: string;
    duration: string;
    severity: string;
    urgency: string;
    complaint: string;
    details: string;
    history: string;
    recommendation: string;
    disclaimer: string;
  };
  landingSafety: {
    title: string;
    p1: string;
    b1: string;
    p2: string;
    b2: string;
  };
  landingFeatures: {
    aiAnalysis: { title: string; desc: string };
    multimodal: { title: string; desc: string };
  };
  errors: {
    generic: string;
    api: string;
    fileTooLarge: string;
    unsupportedFileType: string;
    quotaExceeded: string;
    network: string;
    server: string;
    fileRead: string;
  };
  uploadLabel: string;
  login: {
    title: string;
    subtitle: string;
    googleButton: string;
    emailLabel: string;
    passwordLabel: string;
    nameLabel: string;
    signInBtn: string;
    signUpBtn: string;
    toggleToSignUp: string;
    toggleToSignIn: string;
    orDivider: string;
    error: string;
  };
  profile: {
    notLoggedIn: string;
    welcome: string;
    email: string;
    logout: string;
    login: string;
    historyTitle: string;
    noHistory: string;
    viewDetails: string;
    dateLabel: string;
    deleteRecord: string;
  };
}

export const LOCALIZATION: Record<Language, LocalizationStrings> = {
  en: {
    homepage: {
      modernHero: {
        title: 'AI-Powered Emergency Triage That Saves Lives',
        subtitle: 'Intelligent patient prioritization for emergency departments, urgent care centers, and healthcare systems across the Middle East',
        ctaPrimary: 'Request Demo',
        ctaSecondary: 'Try Symptom Checker',
        trustBadge: '✓ ISO 13485 Certified | HIPAA Compliant | Validated by 50+ Emergency Departments',
        stat1: '60s Avg Triage Time',
        stat2: '95% Accuracy',
        stat3: '40% Wait Time ↓',
      },
      problem: {
        title: 'The Emergency Department Challenge',
        description: 'Emergency departments face unprecedented challenges: overcrowding, limited resources, and critical decisions under pressure. Traditional triage methods struggle with consistency, speed, and accuracy when every second counts.',
      },
      solution: {
        title: 'Intelligent Solutions for Critical Care',
        card1Title: 'AI-Powered Assessment',
        card1Desc: 'Advanced algorithms analyze symptoms, vital signs, and medical history to assign accurate ESI levels in real-time',
        card2Title: 'Evidence-Based Protocols',
        card2Desc: 'Integrates international emergency medicine guidelines (ESI, CTAS, MTS) with local healthcare protocols',
        card3Title: 'EMR/EHR Integration',
        card3Desc: 'Plug-and-play integration with existing hospital systems. Deployment in under 2 weeks',
      },
      industries: {
        title: 'One Solution, Multiple Applications',
        ed: {
          title: 'Emergency Departments',
          description: 'Optimize patient flow, reduce wait times, and ensure critical cases receive immediate attention',
          cta: 'Learn More →',
        },
        urgentCare: {
          title: 'Urgent Care Centers',
          description: 'Differentiate between urgent and emergency cases to route patients to appropriate care levels',
          cta: 'Learn More →',
        },
        healthSystems: {
          title: 'Healthcare Systems',
          description: 'Enterprise-wide triage standardization across multiple facilities with centralized analytics',
          cta: 'Learn More →',
        },
        telemedicine: {
          title: 'Telemedicine Platforms',
          description: 'Remote triage capabilities for virtual consultations and pre-hospital assessment',
          cta: 'Learn More →',
        },
      },
      howItWorks: {
        title: 'How It Works',
        step1: {
          title: 'Patient Check-In',
          description: 'Patient enters symptoms via kiosk, mobile app, or staff-assisted interface',
        },
        step2: {
          title: 'AI Analysis',
          description: 'Advanced NLP and medical reasoning engine processes information in real-time',
        },
        step3: {
          title: 'Severity Classification',
          description: 'System assigns ESI level (1-5) with confidence score and clinical reasoning',
        },
        step4: {
          title: 'Care Coordination',
          description: 'Alerts staff, updates queue, and provides clinical decision support',
        },
      },
      featuresGrid: {
        title: 'Comprehensive Features',
        feature1: 'Multi-Language NLP',
        feature1Desc: 'Arabic, English, French support',
        feature2: 'Vital Signs Integration',
        feature2Desc: 'Automatic import from monitoring devices',
        feature3: 'Pediatric Protocols',
        feature3Desc: 'Specialized algorithms for children',
        feature4: 'Mass Casualty Mode',
        feature4Desc: 'Rapid triage for disaster scenarios',
        feature5: 'Analytics Dashboard',
        feature5Desc: 'Real-time ED metrics and performance tracking',
        feature6: 'Continuous Learning',
        feature6Desc: 'AI improves from clinician feedback',
      },
      validation: {
        title: 'Clinical Validation & Trust',
        accuracy: '95.3% Accuracy vs. Senior ED Nurses',
        facilities: '50+ Healthcare Facilities Deployed',
        patients: '500K+ Patients Triaged Successfully',
        countries: '12 Countries Across MENA Region',
      },
      partners: {
        title: 'Trusted Partners & Certifications',
        healthcare: 'Leading Healthcare Institutions',
        technology: 'Technology Partners',
        academic: 'Academic Collaborations',
      },
      testimonialsSection: {
        title: 'What Healthcare Professionals Say',
        quote1: 'My Doctor has transformed our emergency department workflow. We\'ve reduced average wait times by 38% while improving patient satisfaction scores significantly.',
        author1: 'Dr. Ahmed Al-Mansouri',
        role1: 'Emergency Medicine Director',
        quote2: 'The accuracy of the AI triage system is remarkable. It consistently identifies high-acuity patients and provides valuable clinical decision support to our nursing staff.',
        author2: 'Sarah Mitchell, RN',
        role2: 'Head of Emergency Nursing',
        quote3: 'Implementation was seamless. The team provided excellent training and the system integrated perfectly with our existing EMR infrastructure.',
        author3: 'Dr. Fatima Hassan',
        role3: 'Chief Medical Information Officer',
      },
      caseStudySection: {
        title: 'Real-World Impact: Reducing ED Overcrowding',
        facility: '400-bed Tertiary Care Hospital',
        challenge: '6-hour average ED wait times, patient walkouts, staff burnout',
        solution: 'My Doctor deployment with kiosk and staff interface',
        result1: '42% Reduction in wait times',
        result2: '89% Patient satisfaction improvement',
        result3: '31% Increase in ED throughput',
        result4: '0 Missed critical diagnoses in 6-month pilot',
      },
      faqSection: {
        title: 'Frequently Asked Questions',
        q1: 'How accurate is the AI triage system?',
        a1: 'Our system achieves 95.3% concordance with senior emergency department nurses and has been validated across 50+ healthcare facilities.',
        q2: 'How long does implementation take?',
        a2: 'Typical deployment takes less than 2 weeks, including EMR integration, staff training, and system configuration.',
        q3: 'Does it replace nurses or support them?',
        a3: 'My Doctor is designed to support and enhance clinical decision-making, not replace healthcare professionals. It provides evidence-based recommendations that nurses and physicians use to make final decisions.',
        q4: 'What languages are supported?',
        a4: 'Currently supports Arabic, English, and French with additional languages in development.',
        q5: 'How does it integrate with existing systems?',
        a5: 'Our platform offers plug-and-play integration with major EMR/EHR systems through HL7 and FHIR standards.',
        q6: 'What about data security and privacy?',
        a6: 'We are HIPAA compliant, GDPR compliant, and ISO 13485 certified. All patient data is encrypted at rest and in transit.',
        q7: 'Can it handle pediatric patients?',
        a7: 'Yes, our system includes specialized pediatric triage protocols and age-appropriate assessment algorithms.',
        q8: 'What kind of training is provided?',
        a8: 'We provide comprehensive on-site training, online resources, and 24/7 technical support for all users.',
      },
      ctaSection: {
        title: 'Ready to Transform Your Emergency Department?',
        subtitle: 'Join 50+ healthcare facilities using AI-powered triage to save lives and optimize resources',
        btnDemo: 'Get Started',
        btnWhitepaper: 'Download White Paper',
        btnContact: 'Contact Sales',
        email: 'info@mydoctor.iq',
        phoneSaudi: '+966 XX XXX XXXX (Saudi Arabia)',
        phoneUAE: '+971 XX XXX XXXX (UAE)',
      },
      footerNew: {
        company: 'Company',
        aboutUs: 'About Us',
        careers: 'Careers',
        pressKit: 'Press Kit',
        contact: 'Contact',
        solutions: 'Solutions',
        emergencyDept: 'Emergency Departments',
        urgentCare: 'Urgent Care',
        telemedicine: 'Telemedicine',
        healthSystems: 'Healthcare Systems',
        resources: 'Resources',
        documentation: 'Documentation',
        apiReference: 'API Reference',
        caseStudies: 'Case Studies',
        blog: 'Blog',
        legal: 'Legal',
        privacy: 'Privacy Policy',
        terms: 'Terms of Service',
        security: 'Security',
        compliance: 'Compliance',
        newsletter: 'Newsletter',
        newsletterDesc: 'Stay updated with the latest in emergency medicine AI',
        subscribe: 'Subscribe',
        copyright: '© 2024 My Doctor Pro. All rights reserved.',
      },
      nav: {
        clinicianLogin: 'Clinician Login',
        patientPortal: 'Patient Portal',
      },
      hero: {
        title: 'AI-Powered Medical Operating System',
        subtitle: 'Transform clinical workflows with intelligent diagnostics, real-time transcription, and evidence-based decision support',
        getStarted: 'Get Started',
        learnMore: 'Learn More',
      },
      stats: {
        accuracy: 'Diagnostic Accuracy',
        timeSaved: 'Time Saved',
        cases: 'Cases Analyzed',
        satisfaction: 'User Satisfaction',
      },
      features: {
        title: 'Comprehensive Clinical Intelligence Platform',
        subtitle: 'Everything you need for modern healthcare delivery',
        clinicalReasoning: { title: 'Clinical Reasoning Engine', desc: 'AI-powered differential diagnosis with probability scoring' },
        bioScanner: { title: '3D Bio-Scanner', desc: 'Interactive anatomical visualization with symptom mapping' },
        liveScribe: { title: 'Live Scribe', desc: 'Real-time voice-to-text clinical documentation' },
        pharmaGuard: { title: 'PharmaGuard', desc: 'Drug interaction checking and safety analysis' },
        xrayAnalysis: { title: 'X-Ray Analysis', desc: 'AI-powered medical imaging interpretation' },
        careLocator: { title: 'Care Locator', desc: 'Find nearby medical facilities and specialists' },
      },
      benefits: {
        title: 'Why Choose My Doctor',
        items: [
          'Reduce diagnostic errors with AI-powered clinical decision support',
          'Save time with automated documentation and SOAP note generation',
          'Improve patient outcomes through comprehensive symptom analysis',
          'Access evidence-based recommendations from medical literature',
          'Streamline workflow with integrated tools in one platform',
          'Enhance clinical confidence with probability-scored diagnoses',
        ],
      },
      cta: {
        title: 'Ready to Transform Your Clinical Practice?',
        subtitle: 'Join thousands of healthcare professionals using My Doctor',
        startTrial: 'Start Free Trial',
        scheduleDemo: 'Schedule Demo',
      },
      footer: {
        tagline: 'Medical Operating System',
        description: 'Empowering healthcare professionals with AI-driven clinical intelligence',
        product: 'Product',
        company: 'Company',
        rights: 'All rights reserved',
      },
      slideshow: {
        caption: 'Interactive product demonstration • 6 key features • Auto-advancing slideshow',
        slides: {
          clinicalReasoning: {
            title: 'Clinical Reasoning Engine',
            desc: 'AI-powered differential diagnosis with evidence-based recommendations',
            features: ['Symptom Analysis', 'Probability Scoring', 'Evidence-Based Results'],
          },
          bioScanner: {
            title: '3D Bio-Scanner',
            desc: 'Interactive anatomical visualization with symptom mapping',
            features: ['3D Body Model', 'Organ Insights', 'Visual Symptom Mapping'],
          },
          liveScribe: {
            title: 'Live Scribe',
            desc: 'Real-time voice-to-text transcription for clinical documentation',
            features: ['Voice Recognition', 'Auto-Transcription', 'Speaker ID'],
          },
          pharmaGuard: {
            title: 'PharmaGuard',
            desc: 'Drug interaction checking and medication safety analysis',
            features: ['Interaction Alerts', 'Dosage Guidance', 'Safety Warnings'],
          },
          xrayAnalysis: {
            title: 'X-Ray Analysis',
            desc: 'AI-powered medical imaging analysis and interpretation',
            features: ['Image Analysis', 'Finding Detection', 'Diagnostic Support'],
          },
          careLocator: {
            title: 'Care Locator',
            desc: 'Find nearby healthcare facilities and specialists',
            features: ['Facility Search', 'Map Integration', 'Contact Info'],
          },
          soapGenerator: {
            title: 'SOAP Note Generator',
            desc: 'Automated clinical documentation in standardized format',
            features: ['Auto-Generation', 'SOAP Format', 'Export Options'],
          },
          caseTimeline: {
            title: 'Case Timeline',
            desc: 'Comprehensive patient history with visual progression tracking',
            features: ['Event Tracking', 'Vital Trends', 'Treatment History'],
          },
        },
      },
    },
    clinicianPortal: {
      clinicalReasoning: {
        title: 'Clinical Reasoning',
        subtitle: 'Advanced AI diagnostic system with 20,000+ medical concepts & PubMed integration',
        backToDashboard: 'Back to Dashboard',
        poweredBy: 'Powered by BRAIN',
        patientInfo: {
          title: 'Patient Information',
          subtitle: 'Enter clinical data for AI analysis',
        },
        input: {
          chiefComplaint: 'Chief Complaint *',
          chiefComplaintPlaceholder: 'e.g., Chest pain, Headache, Abdominal pain',
          symptoms: 'Symptoms *',
          symptomsPlaceholder: 'e.g., fever, cough, shortness of breath, fatigue',
          textMode: 'Text',
          voiceMode: 'Voice',
          startRecording: 'Start Recording (Arabic)',
          recording: 'Recording...',
          stopRecording: 'Stop Recording',
          recordedAudio: 'Audio recorded successfully',
          deleteRecording: 'Delete',
          reRecord: 'Re-record',
          patientAge: 'Patient Age',
          patientAgePlaceholder: 'e.g., 45',
          patientGender: 'Patient Gender',
          genderMale: 'Male',
          genderFemale: 'Female',
          genderOther: 'Other',
          bloodPressure: 'Blood Pressure',
          bloodPressurePlaceholder: 'e.g., 120/80',
          heartRate: 'Heart Rate (bpm)',
          heartRatePlaceholder: 'e.g., 72',
          temperature: 'Temperature',
          temperaturePlaceholder: 'e.g., 37.5°C',
          oxygenSaturation: 'Oxygen Saturation (%)',
          oxygenSaturationPlaceholder: 'e.g., 98',
        },
        buttons: {
          generate: 'Generate Differential Diagnosis',
          analyzing: 'Analyzing with AI...',
        },
        results: {
          differentialDiagnosis: 'Differential Diagnosis',
          clinicalReasoning: 'Clinical Reasoning',
          recommendations: 'Recommendations',
          redFlags: 'Red Flags',
          guidelines: 'Clinical Guidelines',
          confidence: 'Confidence',
          noAnalysis: 'No analysis yet',
          enterInfo: 'Enter patient information and click "Generate Differential Diagnosis"',
        },
      },
    },
    patientPortal: {
      symptomChecker: {
        title: 'Symptom Checker',
        subtitle: 'AI-powered health assessment & care guide',
        backToHome: 'Back to Home',
        disclaimer: {
          title: 'Medical Disclaimer',
          text: 'This tool provides general health information and is not a substitute for professional medical advice. If you\'re experiencing a medical emergency, call emergency services immediately.',
        },
        input: {
          title: 'Describe Your Symptoms',
          placeholder: 'Describe your symptoms in detail... (e.g., "I have a headache and fever for 2 days")',
          analyzeButton: 'Analyze Symptoms',
          analyzing: 'Analyzing...',
        },
        results: {
          title: 'Analysis Results',
          urgency: 'Urgency Level',
          possibleConditions: 'Possible Conditions',
          recommendations: 'Recommendations',
          whenToSeek: 'When to Seek Care',
          selfCare: 'Self-Care Tips',
          noResults: 'No analysis results yet. Describe your symptoms and click Analyze.',
        },
      },
      dashboard: {
        title: 'Patient Dashboard',
        welcome: 'Welcome',
        myAppointments: 'My Appointments',
        testResults: 'Test Results',
        medicalHistory: 'Medical History',
        medications: 'Medications',
      },
    },
    title: "My Doctor",
    subtitle: "Advanced Medical Triage, Imaging Analysis & Detailed Advisory",
    startTriage: "Start Comprehensive Assessment",
    disclaimerBanner: "Health Notice: This system provides guidance only and is not a substitute for professional medical diagnosis. Call emergency services immediately in critical situations.",
    languageName: "English",
    inputPlaceholder: "Describe your symptoms here...",
    send: "Send",
    triageTitle: "Clinical Assessment",
    adviceTitle: "Detailed Clinical Report",
    restart: "Start New Assessment",
    loading: "Initializing Clinical Module...",
    processing: "Thinking...",
    analyzingFile: "Analyzing medical image/document...",
    printReport: "Print Medical Report",
    downloadPdf: "Download PDF",
    copyReport: "Copy Summary",
    copied: "Copied!",
    safetyAgreement: "I acknowledge that this is an AI system and not a doctor.",
    loadingSteps: [
      "Reviewing 10,000+ clinical protocols...",
      "Scanning Universal Medical Ontology...",
      "Analyzing symptom patterns...",
      "Checking rare disease databases...",
      "Formulating next question..."
    ],
    quickResponses: {
      yes: "Yes",
      no: "No",
      unsure: "Not Sure",
      mild: "Mild",
      severe: "Severe"
    },
    voice: {
      start: "Start Dictation",
      listening: "Listening...",
      stop: "Stop",
      readAloud: "Read Response",
      stopReading: "Stop Reading",
      notSupported: "Voice features not supported in this browser."
    },
    summaryHeaders: {
      age: "Patient Age/Gender",
      duration: "Duration of Symptoms",
      severity: "Severity Level",
      urgency: "Urgency Level",
      complaint: "Chief Complaint",
      details: "Comprehensive Symptom Details",
      history: "Medical History & Risk Factors",
      recommendation: "Clinical Recommendations",
      disclaimer: "Legal Disclaimer",
    },
    landingSafety: {
      title: "Important Safety Information",
      p1: "This application uses Artificial Intelligence to provide preliminary triage information. ",
      b1: "It is NOT a doctor.",
      p2: " It cannot diagnose diseases or prescribe medication. If you are experiencing chest pain, difficulty breathing, severe bleeding, or any other life-threatening emergency, ",
      b2: "call emergency services immediately."
    },
    landingFeatures: {
      aiAnalysis: { title: "Clinical AI Engine", desc: "Powered by advanced LLMs to conduct thorough symptom interviews." },
      multimodal: { title: "X-Ray & Lab Analysis", desc: "Upload medical images or PDFs for instant radiological and data analysis." }
    },
    errors: {
      generic: "An error occurred. Please try again.",
      api: "Unable to connect to the AI service. Please check your connection or API key.",
      fileTooLarge: "File is too large. Please upload a file smaller than 4MB.",
      unsupportedFileType: "Unsupported file type. Please upload an Image (JPEG, PNG, WEBP) or PDF.",
      quotaExceeded: "Service is currently busy (Rate Limit Exceeded). Please wait a moment and try again.",
      network: "Connection failed. Please check your internet connection.",
      server: "The AI service is temporarily unavailable. Please try again later.",
      fileRead: "Failed to read the file. Please try uploading a different file.",
    },
    uploadLabel: "Upload X-Ray / Report",
    login: {
      title: "Welcome Back",
      subtitle: "Sign in to access your medical history.",
      googleButton: "Continue with Google",
      emailLabel: "Email Address",
      passwordLabel: "Password",
      nameLabel: "Full Name",
      signInBtn: "Sign In",
      signUpBtn: "Create Account",
      toggleToSignUp: "Don't have an account? Sign Up",
      toggleToSignIn: "Already have an account? Sign In",
      orDivider: "Or continue with",
      error: "Unable to sign in. Please check your credentials.",
    },
    profile: {
      notLoggedIn: "You are not logged in.",
      welcome: "Welcome back to your health dashboard.",
      email: "Email Address",
      logout: "Sign Out",
      login: "Log In",
      historyTitle: "Patient Assessment History",
      noHistory: "No assessments found.",
      viewDetails: "View Full Report",
      dateLabel: "Date of Visit",
      deleteRecord: "Delete"
    },
  },
  ar: {
    homepage: {
      modernHero: {
        title: 'فرز طوارئ ذكي يُنقذ الأرواح',
        subtitle: 'تحديد أولويات المرضى الذكي لأقسام الطوارئ ومراكز الرعاية العاجلة والأنظمة الصحية في الشرق الأوسط',
        ctaPrimary: 'طلب عرض توضيحي',
        ctaSecondary: 'جرب فاحص الأعراض',
        trustBadge: '✓ معتمد ISO 13485 | متوافق مع HIPAA | تم التحقق منه من قبل أكثر من 50 قسم طوارئ',
        stat1: '60 ثانية متوسط وقت الفرز',
        stat2: '95% دقة',
        stat3: '40% انخفاض وقت الانتظار ↓',
      },
      problem: {
        title: 'تحدي قسم الطوارئ',
        description: 'تواجه أقسام الطوارئ تحديات غير مسبوقة: الاكتظاظ، الموارد المحدودة، والقرارات الحرجة تحت الضغط. تكافح طرق الفرز التقليدية مع الاتساق والسرعة والدقة عندما تكون كل ثانية مهمة.',
      },
      solution: {
        title: 'حلول ذكية للرعاية الحرجة',
        card1Title: 'تقييم مدعوم بالذكاء الاصطناعي',
        card1Desc: 'خوارزميات متقدمة تحلل الأعراض والعلامات الحيوية والتاريخ الطبي لتعيين مستويات ESI دقيقة في الوقت الفعلي',
        card2Title: 'بروتوكولات قائمة على الأدلة',
        card2Desc: 'يدمج إرشادات الطب الطارئ الدولية (ESI، CTAS، MTS) مع البروتوكولات الصحية المحلية',
        card3Title: 'تكامل EMR/EHR',
        card3Desc: 'تكامل سهل مع أنظمة المستشفيات الحالية. النشر في أقل من أسبوعين',
      },
      industries: {
        title: 'حل واحد، تطبيقات متعددة',
        ed: {
          title: 'أقسام الطوارئ',
          description: 'تحسين تدفق المرضى، تقليل أوقات الانتظار، وضمان حصول الحالات الحرجة على اهتمام فوري',
          cta: 'اعرف المزيد →',
        },
        urgentCare: {
          title: 'مراكز الرعاية العاجلة',
          description: 'التمييز بين الحالات العاجلة والطارئة لتوجيه المرضى إلى مستويات الرعاية المناسبة',
          cta: 'اعرف المزيد →',
        },
        healthSystems: {
          title: 'الأنظمة الصحية',
          description: 'توحيد الفرز على مستوى المؤسسة عبر مرافق متعددة مع تحليلات مركزية',
          cta: 'اعرف المزيد →',
        },
        telemedicine: {
          title: 'منصات الطب عن بُعد',
          description: 'قدرات الفرز عن بُعد للاستشارات الافتراضية والتقييم قبل المستشفى',
          cta: 'اعرف المزيد →',
        },
      },
      howItWorks: {
        title: 'كيف يعمل',
        step1: {
          title: 'تسجيل دخول المريض',
          description: 'يدخل المريض الأعراض عبر الكشك أو تطبيق الهاتف المحمول أو واجهة بمساعدة الموظفين',
        },
        step2: {
          title: 'تحليل الذكاء الاصطناعي',
          description: 'محرك معالجة اللغة الطبيعية المتقدم ومحرك التفكير الطبي يعالج المعلومات في الوقت الفعلي',
        },
        step3: {
          title: 'تصنيف الخطورة',
          description: 'يعين النظام مستوى ESI (1-5) مع درجة الثقة والتفكير السريري',
        },
        step4: {
          title: 'تنسيق الرعاية',
          description: 'ينبه الموظفين، يحدّث قائمة الانتظار، ويوفر دعم قرار سريري',
        },
      },
      featuresGrid: {
        title: 'ميزات شاملة',
        feature1: 'معالجة لغة طبيعية متعددة اللغات',
        feature1Desc: 'دعم العربية والإنجليزية والفرنسية',
        feature2: 'تكامل العلامات الحيوية',
        feature2Desc: 'استيراد تلقائي من أجهزة المراقبة',
        feature3: 'بروتوكولات الأطفال',
        feature3Desc: 'خوارزميات متخصصة للأطفال',
        feature4: 'وضع الحوادث الجماعية',
        feature4Desc: 'فرز سريع لسيناريوهات الكوارث',
        feature5: 'لوحة تحليلات',
        feature5Desc: 'مقاييس قسم الطوارئ في الوقت الفعلي وتتبع الأداء',
        feature6: 'تعلم مستمر',
        feature6Desc: 'يتحسن الذكاء الاصطناعي من ملاحظات الأطباء',
      },
      validation: {
        title: 'التحقق السريري والثقة',
        accuracy: '95.3% دقة مقابل ممرضات الطوارئ الكبار',
        facilities: 'أكثر من 50 منشأة صحية منتشرة',
        patients: 'أكثر من 500 ألف مريض تم فرزهم بنجاح',
        countries: '12 دولة عبر منطقة الشرق الأوسط وشمال أفريقيا',
      },
      partners: {
        title: 'شركاء موثوقون وشهادات',
        healthcare: 'مؤسسات الرعاية الصحية الرائدة',
        technology: 'شركاء التكنولوجيا',
        academic: 'التعاون الأكاديمي',
      },
      testimonialsSection: {
        title: 'ماذا يقول المهنيون الصحيون',
        quote1: 'لقد غيّر My Doctor سير عمل قسم الطوارئ لدينا. لقد خفضنا متوسط أوقات الانتظار بنسبة 38% مع تحسين درجات رضا المرضى بشكل كبير.',
        author1: 'د. أحمد المنصوري',
        role1: 'مدير طب الطوارئ',
        quote2: 'دقة نظام فرز الذكاء الاصطناعي رائعة. يحدد باستمرار المرضى ذوي الحدة العالية ويوفر دعم قرار سريري قيم لموظفي التمريض لدينا.',
        author2: 'سارة ميتشل، ممرضة مسجلة',
        role2: 'رئيسة التمريض الطارئ',
        quote3: 'كان التنفيذ سلسًا. قدم الفريق تدريبًا ممتازًا وتكامل النظام بشكل مثالي مع البنية التحتية لـ EMR الحالية لدينا.',
        author3: 'د. فاطمة حسن',
        role3: 'كبير مسؤولي المعلومات الطبية',
      },
      caseStudySection: {
        title: 'التأثير الواقعي: تقليل اكتظاظ قسم الطوارئ',
        facility: 'مستشفى رعاية ثالثية بـ 400 سرير',
        challenge: 'متوسط أوقات انتظار قسم الطوارئ 6 ساعات، مغادرة المرضى، إرهاق الموظفين',
        solution: 'نشر My Doctor مع كشك وواجهة موظفين',
        result1: '42% انخفاض في أوقات الانتظار',
        result2: '89% تحسين رضا المرضى',
        result3: '31% زيادة في إنتاجية قسم الطوارئ',
        result4: '0 تشخيصات حرجة فائتة في تجربة 6 أشهر',
      },
      faqSection: {
        title: 'الأسئلة الشائعة',
        q1: 'ما مدى دقة نظام فرز الذكاء الاصطناعي؟',
        a1: 'يحقق نظامنا توافقًا بنسبة 95.3% مع ممرضات أقسام الطوارئ الكبار وتم التحقق منه عبر أكثر من 50 منشأة صحية.',
        q2: 'كم من الوقت يستغرق التنفيذ؟',
        a2: 'عادةً ما يستغرق النشر أقل من أسبوعين، بما في ذلك تكامل EMR وتدريب الموظفين وتكوين النظام.',
        q3: 'هل يحل محل الممرضات أم يدعمهم؟',
        a3: 'تم تصميم My Doctor لدعم وتعزيز اتخاذ القرار السريري، وليس استبدال المهنيين الصحيين. يوفر توصيات قائمة على الأدلة يستخدمها الممرضون والأطباء لاتخاذ القرارات النهائية.',
        q4: 'ما هي اللغات المدعومة؟',
        a4: 'يدعم حاليًا العربية والإنجليزية والفرنسية مع لغات إضافية قيد التطوير.',
        q5: 'كيف يتكامل مع الأنظمة الحالية؟',
        a5: 'توفر منصتنا تكاملًا سهلًا مع أنظمة EMR/EHR الرئيسية من خلال معايير HL7 و FHIR.',
        q6: 'ماذا عن أمن البيانات والخصوصية؟',
        a6: 'نحن متوافقون مع HIPAA و GDPR ومعتمدون بـ ISO 13485. جميع بيانات المرضى مشفرة أثناء الراحة وأثناء النقل.',
        q7: 'هل يمكنه التعامل مع مرضى الأطفال؟',
        a7: 'نعم، يتضمن نظامنا بروتوكولات فرز أطفال متخصصة وخوارزميات تقييم مناسبة للعمر.',
        q8: 'ما نوع التدريب المقدم؟',
        a8: 'نوفر تدريبًا شاملاً في الموقع وموارد عبر الإنترنت ودعمًا فنيًا على مدار الساعة طوال أيام الأسبوع لجميع المستخدمين.',
      },
      ctaSection: {
        title: 'هل أنت مستعد لتحويل قسم الطوارئ الخاص بك؟',
        subtitle: 'انضم إلى أكثر من 50 منشأة صحية تستخدم الفرز المدعوم بالذكاء الاصطناعي لإنقاذ الأرواح وتحسين الموارد',
        btnDemo: 'ابدأ الآن',
        btnWhitepaper: 'تحميل الورقة البيضاء',
        btnContact: 'اتصل بالمبيعات',
        email: 'info@mydoctor.iq',
        phoneSaudi: '+966 XX XXX XXXX (السعودية)',
        phoneUAE: '+971 XX XXX XXXX (الإمارات)',
      },
      footerNew: {
        company: 'الشركة',
        aboutUs: 'من نحن',
        careers: 'الوظائف',
        pressKit: 'مجموعة الصحافة',
        contact: 'اتصل بنا',
        solutions: 'الحلول',
        emergencyDept: 'أقسام الطوارئ',
        urgentCare: 'الرعاية العاجلة',
        telemedicine: 'الطب عن بُعد',
        healthSystems: 'الأنظمة الصحية',
        resources: 'الموارد',
        documentation: 'التوثيق',
        apiReference: 'مرجع API',
        caseStudies: 'دراسات الحالة',
        blog: 'المدونة',
        legal: 'قانوني',
        privacy: 'سياسة الخصوصية',
        terms: 'شروط الخدمة',
        security: 'الأمان',
        compliance: 'الامتثال',
        newsletter: 'النشرة الإخبارية',
        newsletterDesc: 'ابق على اطلاع بأحدث التطورات في الذكاء الاصطناعي لطب الطوارئ',
        subscribe: 'اشترك',
        copyright: '© 2024 My Doctor Pro. جميع الحقوق محفوظة.',
      },
      nav: {
        clinicianLogin: 'تسجيل دخول الطبيب',
        patientPortal: 'بوابة المريض',
      },
      hero: {
        title: 'نظام تشغيل طبي مدعوم بالذكاء الاصطناعي',
        subtitle: 'حوّل سير العمل السريري بالتشخيص الذكي والنسخ الفوري ودعم القرار المبني على الأدلة',
        getStarted: 'ابدأ الآن',
        learnMore: 'اعرف المزيد',
      },
      stats: {
        accuracy: 'دقة التشخيص',
        timeSaved: 'الوقت الموفر',
        cases: 'الحالات المحللة',
        satisfaction: 'رضا المستخدمين',
      },
      features: {
        title: 'منصة ذكاء سريري شاملة',
        subtitle: 'كل ما تحتاجه لتقديم رعاية صحية حديثة',
        clinicalReasoning: { title: 'Clinical Reasoning Engine', desc: 'تشخيص تفاضلي مدعوم بالذكاء الاصطناعي مع تسجيل الاحتمالات' },
        bioScanner: { title: '3D Bio-Scanner', desc: 'تصور تشريحي تفاعلي مع رسم خرائط الأعراض' },
        liveScribe: { title: 'Live Scribe', desc: 'توثيق سريري من الصوت إلى النص في الوقت الفعلي' },
        pharmaGuard: { title: 'PharmaGuard', desc: 'فحص التفاعلات الدوائية وتحليل السلامة' },
        xrayAnalysis: { title: 'X-Ray Analysis', desc: 'تفسير التصوير الطبي المدعوم بالذكاء الاصطناعي' },
        careLocator: { title: 'Care Locator', desc: 'ابحث عن المرافق الطبية والمتخصصين القريبين' },
      },
      benefits: {
        title: 'لماذا تختار My Doctor',
        items: [
          'قلل أخطاء التشخيص بدعم القرار السريري المدعوم بالذكاء الاصطناعي',
          'وفر الوقت بالتوثيق الآلي وإنشاء ملاحظات SOAP',
          'حسّن نتائج المرضى من خلال تحليل شامل للأعراض',
          'احصل على توصيات مبنية على الأدلة من الأدبيات الطبية',
          'بسّط سير العمل بأدوات متكاملة في منصة واحدة',
          'عزز الثقة السريرية بتشخيصات مسجلة الاحتمالات',
        ],
      },
      cta: {
        title: 'هل أنت مستعد لتحويل ممارستك السريرية؟',
        subtitle: 'انضم إلى آلاف المهنيين الصحيين الذين يستخدمون My Doctor',
        startTrial: 'ابدأ تجربة مجانية',
        scheduleDemo: 'احجز عرضًا توضيحيًا',
      },
      footer: {
        tagline: 'نظام التشغيل الطبي',
        description: 'تمكين المهنيين الصحيين بالذكاء السريري المدعوم بالذكاء الاصطناعي',
        product: 'المنتج',
        company: 'الشركة',
        rights: 'جميع الحقوق محفوظة',
      },
      slideshow: {
        caption: 'عرض توضيحي تفاعلي للمنتج • 6 ميزات رئيسية • عرض شرائح تلقائي',
        slides: {
          clinicalReasoning: {
            title: 'Clinical Reasoning Engine',
            desc: 'تشخيص تفاضلي مدعوم بالذكاء الاصطناعي مع توصيات مبنية على الأدلة',
            features: ['تحليل الأعراض', 'تسجيل الاحتمالات', 'نتائج مبنية على الأدلة'],
          },
          bioScanner: {
            title: '3D Bio-Scanner',
            desc: 'تصور تشريحي تفاعلي مع رسم خرائط الأعراض',
            features: ['نموذج جسم ثلاثي الأبعاد', 'رؤى الأعضاء', 'رسم خرائط الأعراض المرئية'],
          },
          liveScribe: {
            title: 'Live Scribe',
            desc: 'نسخ من الصوت إلى النص في الوقت الفعلي للتوثيق السريري',
            features: ['التعرف على الصوت', 'النسخ التلقائي', 'تحديد المتحدث'],
          },
          pharmaGuard: {
            title: 'PharmaGuard',
            desc: 'فحص التفاعلات الدوائية وتحليل سلامة الأدوية',
            features: ['تنبيهات التفاعل', 'إرشادات الجرعة', 'تحذيرات السلامة'],
          },
          xrayAnalysis: {
            title: 'X-Ray Analysis',
            desc: 'تحليل وتفسير التصوير الطبي المدعوم بالذكاء الاصطناعي',
            features: ['تحليل الصور', 'اكتشاف النتائج', 'دعم التشخيص'],
          },
          careLocator: {
            title: 'Care Locator',
            desc: 'ابحث عن المرافق الصحية والمتخصصين القريبين',
            features: ['بحث المرافق', 'تكامل الخرائط', 'معلومات الاتصال'],
          },
          soapGenerator: {
            title: 'SOAP Note Generator',
            desc: 'توثيق سريري آلي بتنسيق موحد',
            features: ['التوليد التلقائي', 'تنسيق SOAP', 'خيارات التصدير'],
          },
          caseTimeline: {
            title: 'Case Timeline',
            desc: 'تاريخ شامل للمريض مع تتبع التقدم المرئي',
            features: ['تتبع الأحداث', 'اتجاهات العلامات الحيوية', 'تاريخ العلاج'],
          },
        },
      },
    },
    clinicianPortal: {
      clinicalReasoning: {
        title: 'التفكير السريري',
        subtitle: 'نظام تشخيص ذكي متقدم مع أكثر من 20,000 مفهوم طبي وتكامل PubMed',
        backToDashboard: 'العودة إلى لوحة التحكم',
        poweredBy: 'مدعوم بـ BRAIN',
        patientInfo: {
          title: 'معلومات المريض',
          subtitle: 'أدخل البيانات السريرية لتحليل الذكاء الاصطناعي',
        },
        input: {
          chiefComplaint: 'الشكوى الرئيسية *',
          chiefComplaintPlaceholder: 'مثال: ألم في الصدر، صداع، ألم في البطن',
          symptoms: 'الأعراض *',
          symptomsPlaceholder: 'مثال: حمى، سعال، ضيق في التنفس، إرهاق',
          textMode: 'نص',
          voiceMode: 'صوت',
          startRecording: 'بدء التسجيل (عربي)',
          recording: 'جاري التسجيل...',
          stopRecording: 'إيقاف التسجيل',
          recordedAudio: 'تم تسجيل الصوت بنجاح',
          deleteRecording: 'حذف',
          reRecord: 'إعادة التسجيل',
          patientAge: 'عمر المريض',
          patientAgePlaceholder: 'مثال: 45',
          patientGender: 'جنس المريض',
          genderMale: 'ذكر',
          genderFemale: 'أنثى',
          genderOther: 'آخر',
          bloodPressure: 'ضغط الدم',
          bloodPressurePlaceholder: 'مثال: 120/80',
          heartRate: 'معدل ضربات القلب (نبضة/دقيقة)',
          heartRatePlaceholder: 'مثال: 72',
          temperature: 'درجة الحرارة',
          temperaturePlaceholder: 'مثال: 37.5°م',
          oxygenSaturation: 'تشبع الأكسجين (%)',
          oxygenSaturationPlaceholder: 'مثال: 98',
        },
        buttons: {
          generate: 'إنشاء التشخيص التفاضلي',
          analyzing: 'جاري التحليل بالذكاء الاصطناعي...',
        },
        results: {
          differentialDiagnosis: 'التشخيص التفاضلي',
          clinicalReasoning: 'التفكير السريري',
          recommendations: 'التوصيات',
          redFlags: 'العلامات الحمراء',
          guidelines: 'الإرشادات السريرية',
          confidence: 'الثقة',
          noAnalysis: 'لا يوجد تحليل بعد',
          enterInfo: 'أدخل معلومات المريض وانقر على "إنشاء التشخيص التفاضلي"',
        },
      },
    },
    patientPortal: {
      symptomChecker: {
        title: 'فاحص الأعراض',
        subtitle: 'تقييم صحي مدعوم بالذكاء الاصطناعي ودليل الرعاية',
        backToHome: 'العودة للرئيسية',
        disclaimer: {
          title: 'إخلاء طبي',
          text: 'توفر هذه الأداة معلومات صحية عامة ولا تغني عن المشورة الطبية المتخصصة. إذا كنت تعاني من حالة طبية طارئة، اتصل بخدمات الطوارئ فوراً.',
        },
        input: {
          title: 'صف أعراضك',
          placeholder: 'صف أعراضك بالتفصيل... (مثلاً، "أعاني من صداع وحمى لمدة يومين")',
          analyzeButton: 'تحليل الأعراض',
          analyzing: 'جاري التحليل...',
        },
        results: {
          title: 'نتائج التحليل',
          urgency: 'مستوى العجلة',
          possibleConditions: 'الحالات المحتملة',
          recommendations: 'التوصيات',
          whenToSeek: 'متى تطلب الرعاية',
          selfCare: 'نصائح الرعاية الذاتية',
          noResults: 'لا توجد نتائج تحليل بعد. صف أعراضك وانقر تحليل.',
        },
      },
      dashboard: {
        title: 'لوحة المريض',
        welcome: 'مرحباً',
        myAppointments: 'مواعيدي',
        testResults: 'نتائج الفحوصات',
        medicalHistory: 'التاريخ الطبي',
        medications: 'الأدوية',
      },
    },
    title: "المساعد الطبي المتقدم",
    subtitle: "نظام الفرز الطبي الشامل وتحليل الأشعة والتقارير",
    startTriage: "ابدأ التقييم الطبي",
    disclaimerBanner: "ملاحظة هامة: هذا النظام يقدم إرشادات مساعدة ولا يغني عن زيارة الطبيب. في الحالات الطارئة، اتصل بالإسعاف فوراً.",
    languageName: "العربية",
    inputPlaceholder: "اكتب وصفاً لحالتك أو تحدث...",
    send: "إرسال",
    triageTitle: "العيادة الافتراضية",
    adviceTitle: "التقرير الطبي المفصل",
    restart: "بدء تقييم جديد",
    loading: "جاري تحضير الملف الطبي...",
    processing: "جاري تحليل الأعراض...",
    analyzingFile: "جاري قراءة الملفات المرفقة...",
    printReport: "طباعة التقرير",
    downloadPdf: "تحميل PDF",
    copyReport: "نسخ النص",
    copied: "تم النسخ!",
    safetyAgreement: "أدرك أن هذا نظام ذكاء اصطناعي مساعد وليس طبيباً بشرياً.",
    loadingSteps: [
      "مراجعة أكثر من 10,000 بروتوكول طبي...",
      "مسح قاعدة البيانات الطبية الشاملة...",
      "التدقيق في السجل المرضي...",
      "البحث في الأمراض النادرة...",
      "تجهيز السؤال التالي..."
    ],
    quickResponses: {
      yes: "نعم",
      no: "لا",
      unsure: "غير متأكد",
      mild: "خفيفة",
      severe: "شديدة"
    },
    voice: {
      start: "تحدث الآن",
      listening: "أسمعك...",
      stop: "إنهاء",
      readAloud: "قراءة الرد",
      stopReading: "صمت",
      notSupported: "الصوت غير مدعوم في متصفحك."
    },
    summaryHeaders: {
      age: "العمر والجنس",
      duration: "المدة الزمنية",
      severity: "مستوى الحدة",
      urgency: "مستوى الإلحاح",
      complaint: "الشكوى الرئيسية",
      details: "التفاصيل السريرية",
      history: "السجل المرضي",
      recommendation: "التوصيات والعلاج المقترح",
      disclaimer: "إخلاء المسؤولية",
    },
    landingSafety: {
      title: "معلومات هامة للسلامة",
      p1: "يستخدم هذا التطبيق الذكاء الاصطناعي للمساعدة في الفرز الأولي. ",
      b1: "هو ليس بديلاً للطبيب.",
      p2: " لا يمكن للنظام تشخيص الأمراض بشكل نهائي. إذا شعرت بألم في الصدر، ضيق تنفس شديد، أو نزيف، ",
      b2: "توجه للطوارئ فوراً."
    },
    landingFeatures: {
      aiAnalysis: { title: "استشارة طبية ذكية", desc: "خوارزميات متقدمة لمحاكاة المقابلة السريرية الدقيقة." },
      multimodal: { title: "تحليل الفحوصات والأشعة", desc: "قراءة فورية لصور الأشعة والتحاليل المخبرية (PDF)." }
    },
    errors: {
      generic: "حدث خطأ بسيط، حاول مرة أخرى.",
      api: "تعذر الاتصال بالخادم. تأكد من الإنترنت.",
      fileTooLarge: "الملف كبير جداً (الحد الأقصى 4 ميجا).",
      unsupportedFileType: "صيغة غير مدعومة. يرجى رفع صورة أو PDF.",
      quotaExceeded: "النظام مزدحم حالياً، يرجى الانتظار قليلاً.",
      network: "يرجى التحقق من اتصال الإنترنت.",
      server: "الخدمة غير متاحة مؤقتاً.",
      fileRead: "لم نتمكن من قراءة الملف.",
    },
    uploadLabel: "إرفاق ملف",
    login: {
      title: "مرحباً",
      subtitle: "سجل الدخول للمتابعة",
      googleButton: "المتابعة عبر Google",
      emailLabel: "البريد الإلكتروني",
      passwordLabel: "كلمة المرور",
      nameLabel: "الاسم الكامل",
      signInBtn: "دخول",
      signUpBtn: "إنشاء حساب جديد",
      toggleToSignUp: "ليس لديك حساب؟ سجل الآن",
      toggleToSignIn: "لديك حساب؟ سجل الدخول",
      orDivider: "أو",
      error: "فشل الدخول. تحقق من البيانات.",
    },
    profile: {
      notLoggedIn: "غير مسجل دخول",
      welcome: "أهلاً بك في ملفك الصحي",
      email: "البريد",
      logout: "خروج",
      login: "دخول",
      historyTitle: "سجل التقييمات الطبية",
      noHistory: "لا توجد سجلات سابقة.",
      viewDetails: "عرض التقرير الكامل",
      dateLabel: "تاريخ الزيارة",
      deleteRecord: "حذف"
    },
  }
};

export const SYSTEM_PROMPT_TRIAGE = `
You are an expert Senior Clinical Triage Specialist (MD/Consultant level).
Conduct a detailed medical interview. 

CRITICAL INSTRUCTIONS:
1. **SHORT & SHARP**: Questions must be concise and direct. Do not explain yourself. Do not provide preamble like "I will now ask...". Just ask the question.
2. **ONE QUERY**: Ask exactly one question at a time.
3. **TONE**: Professional, sharp, efficient.
4. **LANGUAGE**: If responding in Arabic, use ONLY Arabic text. No English words allowed.
5. **OPTIONS**: ALWAYS end every response with contextual short options tailored to your specific question:
   - English format: [OPTIONS: option1, option2, option3]
   - Arabic format: [خيارات: خيار1, خيار2, خيار3]
   - Options must be SHORT (2-4 words maximum)
   - Options must be SPECIFIC to the question asked
   - If Arabic language, use Arabic format with Arabic options only
   - Example for "Do you have fever?": [OPTIONS: Yes, No, Unsure]
   - Example Arabic for "هل لديك حمى؟": [خيارات: نعم, لا, غير متأكد]
   - Example for "How severe is pain?": [OPTIONS: Mild, Moderate, Severe]
   - Example Arabic for "ما شدة الألم؟": [خيارات: خفيف, متوسط, شديد]
   - NEVER skip options. ALWAYS include them.

**TERMINATION & SUMMARY RULES**:
- **Routine/Simple Cases**: You MUST ask at least **8 questions** to ensure thoroughness.
- **Complex/Chronic/Severe Cases**: You MUST ask up to **12 questions**.
- Do NOT stop early. Dig deep into history, risk factors, medications, allergies, and associated symptoms.
- Only when you have reached these limits or the user explicitly asks to stop, output EXACTLY this marker string:
SUMMARY_READY
Followed immediately by a JSON object:
{
  "age": "...",
  "duration": "...",
  "severity": "...",
  "mainComplaint": "...",
  "additionalDetails": "...",
  "medicalHistory": "..."
}

**UNIVERSAL MEDICAL ONTOLOGY - 10,000+ CONDITIONS COVERAGE**
Activate your internal medical weights to cross-reference user input against comprehensive ICD-10 chapters and specialized domains.

Start by asking: "What brings you here today?"
`;

export const SYSTEM_PROMPT_FINAL_ADVICE = `
You are a Senior Medical Consultant preparing a comprehensive clinical report.

Based on the triage conversation, generate a detailed medical advisory report in the following JSON format:

{
  "urgencyLevel": "EMERGENCY" | "URGENT" | "SEMI-URGENT" | "NON-URGENT" | "ROUTINE",
  "chiefComplaint": "Brief summary of main complaint",
  "symptoms": ["symptom1", "symptom2", ...],
  "assessment": "Detailed clinical assessment with differential diagnoses",
  "recommendations": "Clear action steps and treatment recommendations",
  "redFlags": ["warning sign 1", "warning sign 2", ...],
  "disclaimer": "Standard medical disclaimer"
}

Be thorough, professional, and evidence-based. Include specific red flags that warrant immediate medical attention.
`;
