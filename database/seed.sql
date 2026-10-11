-- =====================================================================
-- CollabX Seed Data
-- =====================================================================

INSERT INTO `departments` (`id`, `name`, `code`) VALUES
(1, 'Computer Science and Engineering', 'CSE'),
(2, 'Electrical and Electronic Engineering', 'EEE'),
(3, 'Natural Sciences & Mathematics', 'NSM'),
(4, 'Business Administration', 'BBA');

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `university_id`, `role`, `status`, `headline`, `department_id`, `institution`, `bio`) VALUES
('user-ash', 'Ash Ketchum', 'ash@collabx.test', 'pbkdf2:sha256:600000$collabx$c61747f38c42b7f449b75b4b016daba691d0fea13824bc9fd83be7f8471d4122', '2022-1-60-001', 'student', 'active', 'CSE Student · AI & Machine Learning Enthusiast', 1, 'Port City International University', 'Junior CSE student specializing in applied machine learning, computer vision, and neural network interpretability.'),
('user-fahim', 'Dr. Fahim Rahman', 'fahim@collabx.test', 'pbkdf2:sha256:600000$collabx$c61747f38c42b7f449b75b4b016daba691d0fea13824bc9fd83be7f8471d4122', 'FAC-CSE-001', 'supervisor', 'active', 'Associate Professor & AI Lab Director', 1, 'Port City International University', 'Ph.D. in Computer Science. Principal Investigator at the Intelligent Systems Research Lab.'),
('user-sarhan', 'Dr. Sarhan', 'sarhan@collabx.test', 'pbkdf2:sha256:600000$collabx$c61747f38c42b7f449b75b4b016daba691d0fea13824bc9fd83be7f8471d4122', 'FAC-CSE-002', 'supervisor', 'active', 'Professor & IoT Research Lead', 1, 'Port City International University', 'Distinguished Professor with 18 years of academic research in Smart Sensors and Embedded Systems.'),
('user-sabbir', 'Dr. Sabbir Islam', 'sabbir@collabx.test', 'pbkdf2:sha256:600000$collabx$c61747f38c42b7f449b75b4b016daba691d0fea13824bc9fd83be7f8471d4122', 'FAC-CSE-004', 'researcher', 'active', 'Postdoctoral Fellow in Cryptography', 1, 'Port City International University', 'Investigating decentralized identity protocols and zero-knowledge proofs.'),
('user-admin', 'CollabX Administrator', 'admin@collabx.test', 'pbkdf2:sha256:600000$collabx$c61747f38c42b7f449b75b4b016daba691d0fea13824bc9fd83be7f8471d4122', 'ADM-001', 'admin', 'active', 'System Administrator & Portal Moderator', 1, 'Port City International University', 'Central administrator managing student applications and research moderation.');

INSERT INTO `research_areas` (`id`, `name`, `slug`, `icon`, `color`, `bg_pastel`, `sort_order`) VALUES
('area-ai', 'Artificial Intelligence', 'artificial-intelligence', 'Brain', '#E53935', '#FDE3E3', 1),
('area-ds', 'Data Science', 'data-science', 'BarChart2', '#0E9F6E', '#DDF5EA', 2),
('area-sec', 'Cyber Security', 'cyber-security', 'ShieldCheck', '#5C54E5', '#E9E9FB', 3),
('area-web', 'Web Technologies', 'web-technologies', 'Globe', '#F05A28', '#FFE9DC', 4),
('area-iot', 'Internet of Things', 'internet-of-things', 'Cpu', '#0B6BE6', '#DEEBFB', 5),
('area-cloud', 'Cloud Computing', 'cloud-computing', 'Cloud', '#0E7490', '#D9F3F0', 6),
('area-bio', 'Bioinformatics', 'bioinformatics', 'Dna', '#059669', '#D9F7E3', 7),
('area-other', 'Others & Interdisciplinary', 'others', 'Layers', '#4B5563', '#E8EAF0', 8);

INSERT INTO `projects` (`id`, `supervisor_id`, `title`, `slug`, `summary`, `description`, `area_id`, `project_type`, `difficulty`, `duration_months`, `total_positions`, `filled_positions`, `deadline`, `start_date`, `end_date`, `status`, `thumbnail_path`, `views`, `progress_percent`) VALUES
('proj-1', 'user-fahim', 'AI Based Early Disease Prediction', 'ai-based-early-disease-prediction', 'Developing novel deep convolutional and transformer architectures to screen thoracic chest radiographs.', 'This research investigation addresses the urgent global need for accessible screening tools in clinics.', 'area-ai', 'Thesis', 'Intermediate', 6, 5, 3, '2026-12-30', '2026-07-01', '2026-12-30', 'active', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&auto=format&fit=crop&q=80', 1420, 75),
('proj-2', 'user-sarhan', 'Smart Agriculture Using IoT', 'smart-agriculture-using-iot', 'Deploying solar-powered wireless sensor nodes across test agricultural plots to automate micro-irrigation.', 'Smart Agriculture leverages low-power LoRaWAN telemetry and real-time capacitive soil moisture probes.', 'area-iot', 'Funded Research', 'Intermediate', 5, 4, 2, '2026-11-15', '2026-08-01', '2027-01-01', 'active', 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=600&auto=format&fit=crop&q=80', 980, 45),
('proj-5', 'user-sabbir', 'Blockchain for Academic Records', 'blockchain-for-academic-records', 'A tamper-proof decentralized credential issuance and verification protocol for diplomas.', 'This system issues Soulbound ERC-5192 tokens representing verified degree transcripts.', 'area-sec', 'Thesis', 'Intermediate', 5, 4, 2, '2026-11-20', '2026-08-10', '2027-01-10', 'active', 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&auto=format&fit=crop&q=80', 740, 50);

INSERT INTO `milestones` (`id`, `project_id`, `title`, `percent`, `sort_order`, `due_date`, `completed`) VALUES
('m-1', 'proj-1', 'Literature Review & Prior Art Assessment', 100, 1, '2026-08-01', 1),
('m-2', 'proj-1', 'Dataset Collection & Anonymization Audit', 100, 2, '2026-08-30', 1),
('m-3', 'proj-1', 'Data Preprocessing & Augmentation Pipeline', 100, 3, '2026-09-25', 1),
('m-4', 'proj-1', 'Model Development & Hyperparameter Tuning', 60, 4, '2026-11-15', 0),
('m-5', 'proj-1', 'Final Report, Defense & Paper Submission', 0, 5, '2026-12-30', 0);
