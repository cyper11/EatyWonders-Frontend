export const TERMS_AND_CONDITIONS_SECTIONS = [
  {
    title: null,
    content: "Welcome to Eaty Wonders! These Terms and Conditions govern your use of the Eaty Wonders platform, a food promotional web application dedicated to highlighting the culinary landscape of the Province of Cavite. By registering an account, you agree to comply with these terms."
  },
  {
    title: "Account Registration and Roles",
    content: "End-Users must provide accurate information. Food Owners must provide verifiable business information and have legal authority to promote the establishment."
  },
  {
    title: "Food Owner Responsibilities",
    content: "Food Owners are strictly required to keep their menus, pricing, contact details, and operating hours accurate. You agree to provide valid business legal documents (e.g., business permits) upon request. Uploading falsified documents is strictly prohibited."
  },
  {
    title: "User-Generated Content",
    content: "Reviews and uploaded photos must be respectful. Eaty Wonders strictly prohibits hate speech, harassment, explicit content, or defamatory remarks. Posting fake reviews or using bots to manipulate restaurant ratings is forbidden."
  },
  {
    title: "Ban Policy",
    content: "Temporary Bans may be issued for minor infractions (e.g., spamming comments). Permanent Bans will be issued for severe violations, including submitting fraudulent legal documents, hate speech, hacking attempts, or malicious bot activity."
  }
];

export const PRIVACY_POLICY_SECTIONS = [
  {
    title: "Effective Date: May 3, 2026",
    content: "Welcome to Eaty Wonders. We respect your privacy and are committed to protecting your personal data in compliance with the Data Privacy Act of 2012 (Republic Act No. 10173) of the Philippines, its Implementing Rules and Regulations, and other relevant policies, including issuances of the National Privacy Commission (NPC)."
  },
  {
    title: "1. Information We Collect",
    content: "We adhere to the principle of Proportionality, meaning we only collect data that is adequate, relevant, and strictly necessary for the functions of the platform. (Account Information) First name, middle name, surname, suffix (optional), email address, and encrypted password. (Business Information) Restaurant descriptions, menus, and operating hours. (Location Data) GPS coordinates for map features (processed strictly client-side and never transmitted to our servers). (System Logs) IP addresses, browser types, and access times for security."
  },
  {
    title: "2. How We Use Your Information",
    content: "We process your personal data under the principle of Legitimate Purpose to: Manage and authenticate your account, facilitate secure password resets, provide interactive map features (nearby destinations), allow administrators to review business applications, and send critical system updates."
  },
  {
    title: "3. Data Sharing and Disclosure",
    content: "We do not sell, rent, or trade your personal information. We share data only with your explicit consent, for Public Profiles (submitted by Food Owners for viewing), or for Legal Compliance (valid court orders or Philippine law enforcement requests)."
  },
  {
    title: "4. Data Security and Retention",
    content: "We implement robust technical and organizational security measures. Your data is retained only as long as necessary. Upon account deletion or inactivity, data is securely anonymized or permanently deleted."
  },
  {
    title: "5. Your Rights as a Data Subject",
    content: "Under the Data Privacy Act of 2012, you possess the Right to be Informed, Right to Object, Right to Access, Right to Rectification, Right to Erasure or Blocking, Right to Damages, Right to Data Portability, and the Right to File a Complaint with the NPC."
  }
];

// Legacy exports for backward compatibility
export const TERMS_AND_CONDITIONS = TERMS_AND_CONDITIONS_SECTIONS.map(s => s.title ? `${s.title}: ${s.content}` : s.content).join('\n\n');
export const PRIVACY_POLICY = PRIVACY_POLICY_SECTIONS.map(s => s.title ? `${s.title}: ${s.content}` : s.content).join('\n\n');
