import { 
  User, 
  ResearchArea, 
  Project, 
  Application, 
  TeamMember, 
  Milestone, 
  ProjectFile, 
  Message, 
  NotificationItem, 
  CalendarEvent, 
  Paper, 
  ActivityLog,
  ContactMessage 
} from '../types';
import { MOCK_USERS, MOCK_RESEARCH_AREAS, MOCK_PROJECTS } from './mock';
import { ASSETS } from './assets';

export const SEED_USERS: User[] = MOCK_USERS;
export const RESEARCH_AREAS: ResearchArea[] = MOCK_RESEARCH_AREAS;
export const SEED_PROJECTS: Project[] = MOCK_PROJECTS;

export const SEED_APPLICATIONS: Application[] = [
  {
    id: 'app-4',
    projectId: 'proj-1',
    projectTitle: 'AI Based Early Disease Prediction',
    projectThumbnail: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&auto=format&fit=crop&q=80',
    userId: 'user-serena',
    applicantUid: 'user-serena',
    userName: 'Serena Yvonne',
    userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    userEmail: 'serena@collabx.test',
    userDepartment: 'Computer Science and Engineering',
    message: 'I can assist in processing natural language radiologist reports using clinical transformer embeddings.',
    skillsNote: 'Transformers, HuggingFace, Python.',
    cvFileName: 'Serena_Yvonne_Academic_CV.pdf',
    cvFileSize: '1.1 MB',
    status: 'approved',
    appliedDate: '2026-07-06T11:00:00Z',
    responseNote: 'Approved. Serena will lead the radiology report NLP extraction submodule.',
    decidedAt: '2026-07-09T10:00:00Z'
  },
  {
    id: 'app-5',
    projectId: 'proj-6',
    projectTitle: 'Renewable Energy Optimization',
    projectThumbnail: ASSETS.projects.renewableEnergy,
    userId: 'user-brock',
    applicantUid: 'user-brock',
    userName: 'Brock Harrison',
    userAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
    userEmail: 'brock@collabx.test',
    userDepartment: 'Computer Science and Engineering',
    message: 'I have experience interfacing hardware inverters with Raspberry Pi telemetry relays.',
    skillsNote: 'Hardware telemetry, C++, Python.',
    cvFileName: 'Brock_Harrison_Academic_CV.pdf',
    cvFileSize: '1.3 MB',
    status: 'pending',
    appliedDate: '2026-08-01T14:00:00Z'
  }
];

export const SEED_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'tm-1',
    projectId: 'proj-1',
    userId: 'user-fahim',
    name: 'Dr. Fahim Rahman',
    email: 'fahim@collabx.test',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    role: 'supervisor',
    positionTitle: 'Principal Investigator',
    status: 'active',
    joinedAt: '2026-06-15T08:00:00Z'
  },
  {
    id: 'tm-2',
    projectId: 'proj-1',
    userId: 'user-ash',
    name: 'Ash Ketchum',
    email: 'ash@collabx.test',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    role: 'member',
    positionTitle: 'ML Engineer & Vision Specialist',
    status: 'active',
    joinedAt: '2026-07-08T14:30:00Z'
  },
  {
    id: 'tm-3',
    projectId: 'proj-1',
    userId: 'user-serena',
    name: 'Serena Yvonne',
    email: 'serena@collabx.test',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    role: 'member',
    positionTitle: 'Research Assistant (NLP & Text)',
    status: 'active',
    joinedAt: '2026-07-09T10:00:00Z'
  },
  {
    id: 'tm-4',
    projectId: 'proj-1',
    userId: 'user-gary',
    name: 'Gary Oak',
    email: 'gary@collabx.test',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
    role: 'member',
    positionTitle: 'Data Pipeline Specialist',
    status: 'active',
    joinedAt: '2026-07-10T12:00:00Z'
  }
];

export const SEED_MILESTONES: Milestone[] = [
  {
    id: 'm-1',
    projectId: 'proj-1',
    title: 'Literature Review & Prior Art Assessment',
    percent: 100,
    sortOrder: 1,
    dueDate: '2026-08-01',
    completed: true
  },
  {
    id: 'm-2',
    projectId: 'proj-1',
    title: 'Dataset Collection & Anonymization Audit',
    percent: 100,
    sortOrder: 2,
    dueDate: '2026-08-30',
    completed: true
  },
  {
    id: 'm-3',
    projectId: 'proj-1',
    title: 'Data Preprocessing & Augmentation Pipeline',
    percent: 100,
    sortOrder: 3,
    dueDate: '2026-09-25',
    completed: true
  },
  {
    id: 'm-4',
    projectId: 'proj-1',
    title: 'Model Development & Hyperparameter Tuning',
    percent: 60,
    sortOrder: 4,
    dueDate: '2026-11-15',
    completed: false
  },
  {
    id: 'm-5',
    projectId: 'proj-1',
    title: 'Final Report, Defense & Paper Submission',
    percent: 0,
    sortOrder: 5,
    dueDate: '2026-12-30',
    completed: false
  }
];

export const SEED_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    projectId: 'proj-1',
    senderId: 'user-fahim',
    senderName: 'Dr. Fahim Rahman',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    isSupervisor: true,
    body: 'Welcome everyone! We have finalized our ethics committee approval for the 45k anonymized chest radiograph dataset.',
    timestamp: 'Yesterday at 10:15 AM'
  },
  {
    id: 'msg-2',
    projectId: 'proj-1',
    senderId: 'user-ash',
    senderName: 'Ash Ketchum',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    body: 'Awesome! I have verified our preprocessing scripts. We have normalized bounding boxes and contrast histogram equalization.',
    timestamp: 'Yesterday at 10:22 AM'
  },
  {
    id: 'msg-3',
    projectId: 'proj-1',
    senderId: 'user-serena',
    senderName: 'Serena Yvonne',
    senderAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    body: 'Here is the cleaned metadata CSV containing diagnostic annotations and disease severity ratings.',
    timestamp: 'Yesterday at 11:05 AM',
    attachment: {
      name: 'dataset_annotations_v2.zip',
      size: '24.8 MB',
      type: 'application/zip'
    }
  },
  {
    id: 'msg-4',
    projectId: 'proj-1',
    senderId: 'user-fahim',
    senderName: 'Dr. Fahim Rahman',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    isSupervisor: true,
    body: 'Great work team. Let us review the initial ResNet-50 and Vision Transformer validation loss curves in our Thursday lab sync.',
    timestamp: 'Today at 09:30 AM'
  }
];

export const SEED_PROJECT_FILES: ProjectFile[] = [
  {
    id: 'file-1',
    projectId: 'proj-1',
    uploadedBy: 'user-fahim',
    uploaderName: 'Dr. Fahim Rahman',
    name: 'Research_Proposal_Ethical_Review.pdf',
    size: '2.4 MB',
    type: 'PDF Document',
    uploadedAt: '2026-06-20'
  },
  {
    id: 'file-2',
    projectId: 'proj-1',
    uploadedBy: 'user-serena',
    uploaderName: 'Serena Yvonne',
    name: 'dataset_annotations_v2.zip',
    size: '24.8 MB',
    type: 'ZIP Archive',
    uploadedAt: '2026-08-10'
  },
  {
    id: 'file-3',
    projectId: 'proj-1',
    uploadedBy: 'user-ash',
    uploaderName: 'Ash Ketchum',
    name: 'Preprocessing_Benchmark_Notebook.ipynb',
    size: '1.2 MB',
    type: 'Jupyter Notebook',
    uploadedAt: '2026-08-15'
  }
];

export const SEED_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    userId: 'user-ash',
    type: 'application_approved',
    title: 'Application Approved!',
    body: 'Dr. Fahim Rahman approved your application for "AI Based Early Disease Prediction".',
    link: '/projects/proj-1',
    isRead: false,
    createdAt: '2 hours ago'
  },
  {
    id: 'notif-2',
    userId: 'user-ash',
    type: 'new_message',
    title: 'New Team Message',
    body: 'Dr. Fahim Rahman posted in "AI Based Early Disease Prediction" discussion.',
    link: '/projects/proj-1/discussion',
    isRead: false,
    createdAt: '4 hours ago'
  },
  {
    id: 'notif-3',
    userId: 'user-ash',
    type: 'deadline',
    title: 'Upcoming Milestone Deadline',
    body: 'Milestone "Model Development & Tuning" is due in 14 days.',
    link: '/projects/proj-1/progress',
    isRead: false,
    createdAt: '1 day ago'
  },
  {
    id: 'notif-4',
    userId: 'user-ash',
    type: 'new_project',
    title: 'New Project Matching Your Interests',
    body: '"Renewable Energy Optimization" in Artificial Intelligence was just published.',
    link: '/projects/proj-6',
    isRead: true,
    createdAt: '3 days ago'
  },
  {
    id: 'notif-5',
    userId: 'user-ash',
    type: 'paper_published',
    title: 'New Paper Uploaded',
    body: 'Dr. Sarhan published "Low-Power LoRaWAN Sensor Architectures for Agriculture".',
    link: '/papers/paper-2',
    isRead: true,
    createdAt: '5 days ago'
  }
];

export const SEED_EVENTS: CalendarEvent[] = [
  {
    id: 'evt-1',
    userId: 'user-ash',
    projectId: 'proj-1',
    projectName: 'AI Based Early Disease Prediction',
    title: 'Bi-Weekly AI Lab Progress Sync',
    type: 'meeting',
    eventDate: '2026-10-15',
    eventTime: '10:00 AM - 11:30 AM',
    reminder: '1 day before',
    description: 'Reviewing ROC-AUC metrics and Grad-CAM saliency heatmaps with Dr. Fahim Rahman in Room 402.'
  },
  {
    id: 'evt-2',
    userId: 'user-ash',
    projectId: 'proj-1',
    projectName: 'AI Based Early Disease Prediction',
    title: 'Midterm Progress Report Submission',
    type: 'submission',
    eventDate: '2026-10-22',
    eventTime: '11:59 PM',
    reminder: '2 days before',
    description: 'Submit compiled IEEE draft report of preprocessing methodology and baseline model performance.'
  },
  {
    id: 'evt-3',
    userId: 'user-ash',
    projectId: 'proj-1',
    projectName: 'AI Based Early Disease Prediction',
    title: 'Preliminary Model Architecture Presentation',
    type: 'presentation',
    eventDate: '2026-10-28',
    eventTime: '02:00 PM - 03:30 PM',
    reminder: '1 day before',
    description: 'Presenting comparative Vision Transformer vs ResNet50 validation results to the CSE departmental board.'
  },
  {
    id: 'evt-4',
    userId: 'user-ash',
    title: 'CSE 222 DBMS Project Showcase',
    type: 'presentation',
    eventDate: '2026-11-04',
    eventTime: '09:00 AM - 01:00 PM',
    reminder: '3 days before',
    description: 'Annual Port City International University research innovation symposium exhibition.'
  }
];

export const SEED_PAPERS: Paper[] = [
  {
    id: 'paper-1',
    uploaderId: 'user-fahim',
    uploaderName: 'Dr. Fahim Rahman',
    uploaderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    title: 'Deep Multi-Modal Feature Fusion for Thoracic Anomaly Detection',
    abstract: 'Automated thoracic radiograph screening suffers from substantial false positive rates in clinical deployment. We propose a cross-attention transformer that fuses bilateral lung segmentation masks with patient clinical histories. Evaluated on 45,000 public and proprietary radiographs, our model achieved an AUROC of 0.942, outperforming standalone convolutional baselines by 4.8%.',
    paperType: 'Journal',
    areaId: 'area-ai',
    areaName: 'Artificial Intelligence',
    year: 2026,
    doi: '10.1109/JBHI.2026.3129841',
    authors: ['Dr. Fahim Rahman', 'Ash Ketchum', 'Serena Yvonne', 'Dr. Nazmul Hossain'],
    keywords: ['Healthcare AI', 'Chest X-Ray', 'Transformers', 'Deep Learning', 'Computer Vision'],
    visibility: 'public',
    aiAssisted: false,
    views: 890,
    downloads: 340,
    likes: 67,
    createdAt: '2026-08-01T10:00:00Z',
    coverImage: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'paper-2',
    uploaderId: 'user-sarhan',
    uploaderName: 'Dr. Sarhan',
    uploaderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    title: 'Low-Power LoRaWAN Sensor Architectures for Precision Soil Telemetry',
    abstract: 'Precision agriculture requires continuous spatial monitoring across large geographical test plots. We engineer a resilient battery-less soil moisture and ambient temperature node utilizing solar micro-harvesting. Field trials over 180 continuous days demonstrated zero downtime and a 99.4% packet reception rate across a 4.2 km agricultural radius.',
    paperType: 'Conference',
    areaId: 'area-iot',
    areaName: 'Internet of Things',
    year: 2026,
    doi: '10.1145/3543873.3587211',
    authors: ['Dr. Sarhan', 'Brock Harrison', 'Dr. Sabbir Islam'],
    keywords: ['IoT', 'LoRaWAN', 'Smart Agriculture', 'Energy Harvesting', 'Edge Telemetry'],
    visibility: 'public',
    aiAssisted: false,
    views: 620,
    downloads: 215,
    likes: 42,
    createdAt: '2026-07-15T09:00:00Z',
    coverImage: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'paper-3',
    uploaderId: 'user-sabbir',
    uploaderName: 'Dr. Sabbir Islam',
    uploaderAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
    title: 'Zero-Knowledge Verifiable Credentials for Academic Transcript Auditing',
    abstract: 'Verifying student academic credentials currently relies on centralized registrar endpoints vulnerable to downtime and spoofing. We formulate a decentralized protocol anchored on Ethereum Layer-2 rollups employing zk-SNARKs. Employers can cryptographically verify student GPA thresholds and degree conferrals without obtaining full historical course transcripts.',
    paperType: 'Conference',
    areaId: 'area-sec',
    areaName: 'Cyber Security',
    year: 2025,
    doi: '10.1007/978-3-031-41235-8_12',
    authors: ['Dr. Sabbir Islam', 'Gary Oak', 'Dr. Fahim Rahman'],
    keywords: ['Blockchain', 'Zero Knowledge', 'Cryptography', 'Academic Integrity', 'zk-SNARKs'],
    visibility: 'public',
    aiAssisted: false,
    views: 740,
    downloads: 198,
    likes: 54,
    createdAt: '2025-11-12T14:00:00Z',
    coverImage: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'paper-4',
    uploaderId: 'user-ash',
    uploaderName: 'Ash Ketchum',
    uploaderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    title: 'Explainable Vision Transformers for Thoracic Radiograph Saliency',
    abstract: 'Black-box deep learning models hinder physician adoption in clinical diagnostics. In this preprint, we explore attention rollout and Grad-CAM++ visualizations to explain patch activations in Vision Transformers trained on the CheXpert corpus, correlating attention bounds with radiologist eye-tracking annotations.',
    paperType: 'Preprint',
    areaId: 'area-ai',
    areaName: 'Artificial Intelligence',
    year: 2026,
    authors: ['Ash Ketchum', 'Dr. Fahim Rahman'],
    keywords: ['Explainable AI', 'Vision Transformers', 'Grad-CAM', 'Medical Imaging'],
    visibility: 'public',
    aiAssisted: true,
    views: 450,
    downloads: 120,
    likes: 38,
    createdAt: '2026-08-20T12:00:00Z',
    coverImage: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=400&auto=format&fit=crop&q=80'
  }
];

export const SEED_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'act-1',
    userId: 'user-ash',
    userName: 'Ash Ketchum',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    action: 'submitted application for',
    entityType: 'project',
    entityTitle: 'Smart Agriculture Using IoT',
    createdAt: '1 hour ago'
  },
  {
    id: 'act-2',
    userId: 'user-fahim',
    userName: 'Dr. Fahim Rahman',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    action: 'updated milestone progress on',
    entityType: 'milestone',
    entityTitle: 'AI Based Early Disease Prediction (75%)',
    createdAt: '3 hours ago'
  },
  {
    id: 'act-3',
    userId: 'user-sabbir',
    userName: 'Dr. Sabbir Islam',
    userAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
    action: 'published new research project',
    entityType: 'project',
    entityTitle: 'Blockchain for Academic Records',
    createdAt: '6 hours ago'
  },
  {
    id: 'act-4',
    userId: 'user-misty',
    userName: 'Misty Williams',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    action: 'registered as a new student',
    entityType: 'user',
    entityTitle: 'Department of CSE',
    createdAt: '1 day ago'
  },
  {
    id: 'act-5',
    userId: 'user-admin',
    userName: 'Admin User',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    action: 'approved project publication for',
    entityType: 'project',
    entityTitle: 'Renewable Energy Optimization',
    createdAt: '2 days ago'
  }
];

export const SEED_CONTACT_MESSAGES: ContactMessage[] = [
  {
    id: 'cmsg-1',
    name: 'Tanvir Ahmed',
    email: 'tanvir@pciu.edu.bd',
    subject: 'Inquiry regarding research lab hardware access',
    category: 'General Inquiry',
    message: 'Hello, I am a 3rd year CSE student interested in using the GPU cluster for an NLP semester project. Can external supervisors sponsor access?',
    status: 'replied',
    createdAt: '2026-10-02T10:00:00Z',
    adminReply: 'Yes Tanvir, please ask your project supervisor to submit an authorization form to the AI Lab coordinator.'
  },
  {
    id: 'cmsg-2',
    name: 'Nusrat Jahan',
    email: 'nusrat@pciu.edu.bd',
    subject: 'Faculty registration verification request',
    category: 'Account Verification',
    message: 'I have registered with my institutional email. Please verify my researcher badge.',
    status: 'new',
    createdAt: '2026-10-06T15:30:00Z'
  }
];
