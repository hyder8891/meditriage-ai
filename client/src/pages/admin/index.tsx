import AdminFeaturePage from './AdminFeaturePage';
import { 
  DollarSign, FileText, Activity, Zap, Stethoscope, Syringe, Brain, Mic, 
  FileSpreadsheet, Cloud, CloudRain, Wind, MessageSquare, History, Building2, 
  Gavel, Settings, Phone, Key, UserPlus, TestTube, ClipboardList 
} from 'lucide-react';

// Analytics & Monitoring
export function AdminBudget() {
  return (
    <AdminFeaturePage
      title="Budget Tracking"
      description="Monitor and manage system resource budgets and costs"
      icon={<DollarSign className="h-6 w-6 text-red-500" />}
      backendRouter="budget-router"
      features={[
        'Real-time budget monitoring',
        'Cost allocation by service',
        'Budget alerts and notifications',
        'Historical spending analysis',
        'Resource usage optimization'
      ]}
    />
  );
}

export function AdminOrchestration() {
  return (
    <AdminFeaturePage
      title="Orchestration Logs"
      description="View and analyze system orchestration and workflow logs"
      icon={<FileText className="h-6 w-6 text-red-500" />}
      backendRouter="orchestration-router"
      features={[
        'Real-time log streaming',
        'Advanced filtering and search',
        'Workflow execution tracking',
        'Error detection and alerts',
        'Performance metrics'
      ]}
    />
  );
}

export function AdminLoadTest() {
  return (
    <AdminFeaturePage
      title="Load Testing"
      description="Execute and monitor system load tests"
      icon={<Activity className="h-6 w-6 text-red-500" />}
      backendRouter="load-test-router"
      features={[
        'Configurable load test scenarios',
        'Real-time performance metrics',
        'Concurrent user simulation',
        'Response time analysis',
        'System bottleneck identification'
      ]}
    />
  );
}

export function AdminSelfHealing() {
  return (
    <AdminFeaturePage
      title="Self-Healing System"
      description="Monitor and configure automatic system recovery"
      icon={<Zap className="h-6 w-6 text-red-500" />}
      backendRouter="self-healing-router"
      features={[
        'Automatic error detection',
        'Self-recovery mechanisms',
        'Health check monitoring',
        'Incident response automation',
        'System resilience metrics'
      ]}
    />
  );
}

// Clinical Tools
export function AdminClinical() {
  return (
    <AdminFeaturePage
      title="Clinical Routers"
      description="Manage clinical decision support and routing systems"
      icon={<Stethoscope className="h-6 w-6 text-red-500" />}
      backendRouter="clinical-router"
      features={[
        'Clinical pathway management',
        'Decision support algorithms',
        'Protocol configuration',
        'Care coordination tools',
        'Clinical data routing'
      ]}
    />
  );
}

export function AdminTriage() {
  return (
    <AdminFeaturePage
      title="Enhanced Triage"
      description="Advanced triage system with AI-powered prioritization"
      icon={<Syringe className="h-6 w-6 text-red-500" />}
      backendRouter="triage-enhanced-router"
      features={[
        'AI-powered urgency assessment',
        'Multi-factor triage scoring',
        'Real-time queue management',
        'Priority escalation rules',
        'Triage performance analytics'
      ]}
    />
  );
}

export function AdminSymptomChecker() {
  return (
    <AdminFeaturePage
      title="Structured Symptom Checker"
      description="Advanced symptom analysis with structured data collection"
      icon={<Brain className="h-6 w-6 text-red-500" />}
      backendRouter="symptom-checker-structured-router"
      features={[
        'Structured symptom questionnaires',
        'Differential diagnosis generation',
        'Evidence-based recommendations',
        'Symptom pattern recognition',
        'Clinical decision support'
      ]}
    />
  );
}

export function AdminAudioSymptom() {
  return (
    <AdminFeaturePage
      title="Audio Symptom Analysis"
      description="Voice-based symptom collection and analysis"
      icon={<Mic className="h-6 w-6 text-red-500" />}
      backendRouter="audio-symptom-router"
      features={[
        'Voice-to-text transcription',
        'Natural language processing',
        'Symptom extraction from audio',
        'Multi-language support',
        'Audio quality assessment'
      ]}
    />
  );
}

export function AdminSmartForms() {
  return (
    <AdminFeaturePage
      title="Smart Dynamic Forms"
      description="Intelligent form generation and management"
      icon={<FileSpreadsheet className="h-6 w-6 text-red-500" />}
      backendRouter="smart-form-router"
      features={[
        'Dynamic form generation',
        'Conditional logic and branching',
        'Form template library',
        'Data validation rules',
        'Form analytics and optimization'
      ]}
    />
  );
}

// Patient Engagement
export function AdminWearables() {
  return (
    <AdminFeaturePage
      title="Wearable Integration"
      description="Manage fitness tracker and wearable device integrations"
      icon={<Cloud className="h-6 w-6 text-red-500" />}
      backendRouter="wearable-router"
      features={[
        'Apple Watch integration',
        'Fitbit data sync',
        'Real-time health metrics',
        'Device connection management',
        'Wearable data analytics'
      ]}
    />
  );
}

export function AdminWeather() {
  return (
    <AdminFeaturePage
      title="Weather-Based Health Alerts"
      description="Configure weather-triggered health notifications"
      icon={<CloudRain className="h-6 w-6 text-red-500" />}
      backendRouter="weather-router"
      features={[
        'Barometric pressure monitoring',
        'Weather-health correlation',
        'Automated patient alerts',
        'Condition-specific triggers',
        'Historical weather impact analysis'
      ]}
    />
  );
}

export function AdminAirQuality() {
  return (
    <AdminFeaturePage
      title="Air Quality Monitoring"
      description="Track air quality and health impact alerts"
      icon={<Wind className="h-6 w-6 text-red-500" />}
      backendRouter="air-quality-router"
      features={[
        'Real-time AQI monitoring',
        'Pollution level alerts',
        'Health risk assessments',
        'Location-based tracking',
        'Respiratory health recommendations'
      ]}
    />
  );
}

export function AdminConversations() {
  return (
    <AdminFeaturePage
      title="Conversational AI"
      description="Manage AI-powered patient conversations"
      icon={<MessageSquare className="h-6 w-6 text-red-500" />}
      backendRouter="conversational-router"
      features={[
        'AI chat interface management',
        'Conversation flow configuration',
        'Natural language understanding',
        'Context-aware responses',
        'Conversation quality metrics'
      ]}
    />
  );
}

export function AdminChatHistory() {
  return (
    <AdminFeaturePage
      title="Chat History"
      description="View and analyze all patient-AI conversations"
      icon={<History className="h-6 w-6 text-red-500" />}
      backendRouter="conversation-history-router"
      features={[
        'Complete conversation logs',
        'Search and filtering',
        'Sentiment analysis',
        'Quality assurance review',
        'Conversation analytics'
      ]}
    />
  );
}

// Business Features
export function AdminB2B2C() {
  return (
    <AdminFeaturePage
      title="B2B2C Portal"
      description="Manage business-to-business-to-consumer partnerships"
      icon={<Building2 className="h-6 w-6 text-red-500" />}
      backendRouter="b2b2c-router"
      features={[
        'Partner organization management',
        'White-label configuration',
        'Multi-tenant support',
        'Revenue sharing models',
        'Partner analytics dashboard'
      ]}
    />
  );
}

export function AdminResourceAuction() {
  return (
    <AdminFeaturePage
      title="Resource Auction"
      description="Healthcare resource bidding and allocation system"
      icon={<Gavel className="h-6 w-6 text-red-500" />}
      backendRouter="resource-auction-router"
      features={[
        'Doctor availability bidding',
        'Skill-based matching',
        'Price optimization',
        'Network quality scoring',
        'Auction analytics'
      ]}
    />
  );
}

export function AdminPreferences() {
  return (
    <AdminFeaturePage
      title="User Preferences"
      description="Manage system-wide user preference settings"
      icon={<Settings className="h-6 w-6 text-red-500" />}
      backendRouter="preferences-router"
      features={[
        'User preference templates',
        'Default settings management',
        'Preference migration tools',
        'Privacy controls',
        'Notification preferences'
      ]}
    />
  );
}

// Auth & Onboarding
export function AdminPhoneAuth() {
  return (
    <AdminFeaturePage
      title="Phone Authentication"
      description="SMS and phone-based authentication management"
      icon={<Phone className="h-6 w-6 text-red-500" />}
      backendRouter="phone-auth-router"
      features={[
        'SMS verification system',
        'Phone number validation',
        'OTP management',
        'Multi-factor authentication',
        'Phone auth analytics'
      ]}
    />
  );
}

export function AdminOAuth() {
  return (
    <AdminFeaturePage
      title="OAuth Configuration"
      description="Third-party OAuth provider management"
      icon={<Key className="h-6 w-6 text-red-500" />}
      backendRouter="oauth-router"
      features={[
        'OAuth provider configuration',
        'Social login management',
        'Token management',
        'Scope configuration',
        'OAuth analytics'
      ]}
    />
  );
}

export function AdminOnboarding() {
  return (
    <AdminFeaturePage
      title="Onboarding Flow"
      description="Configure user onboarding experiences"
      icon={<UserPlus className="h-6 w-6 text-red-500" />}
      backendRouter="onboarding-router"
      features={[
        'Onboarding flow editor',
        'Step-by-step configuration',
        'Progress tracking',
        'Completion analytics',
        'A/B testing support'
      ]}
    />
  );
}

// Lab & Testing
export function AdminLabResults() {
  return (
    <AdminFeaturePage
      title="Lab Results Integration"
      description="Manage laboratory result integrations and analysis"
      icon={<TestTube className="h-6 w-6 text-red-500" />}
      backendRouter="lab-router"
      features={[
        'Lab system integrations',
        'OCR result processing',
        'Biomarker extraction',
        'Trend analysis',
        'Reference range management'
      ]}
    />
  );
}

export function AdminTriageQueue() {
  return (
    <AdminFeaturePage
      title="Triage Queue Monitor"
      description="Real-time triage queue monitoring and management"
      icon={<ClipboardList className="h-6 w-6 text-red-500" />}
      backendRouter="triage-enhanced-router"
      features={[
        'Real-time queue status',
        'Wait time monitoring',
        'Priority management',
        'Queue analytics',
        'Resource allocation'
      ]}
    />
  );
}
