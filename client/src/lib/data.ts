import type { CoachingModule, EQFramework, Scenario, HeuristicTemplate, KnowledgeArticle } from "@shared/schema";

// =============================================================================
// LAYER 2 — Behavioral Communication Models (Supporting Insight Layer)
// =============================================================================
// These models help sellers APPLY emotional intelligence more effectively
// by understanding observable communication preferences.
// IMPORTANT: DISC is an OPTIONAL behavioral lens—it supports emotionally intelligent 
// interactions but does not measure emotional intelligence.
// DISC describes observable communication preferences.
// EI refers to demonstrated capability: how well someone perceives, adapts, and responds.
export const communicationStyleModels: EQFramework[] = [
  {
    id: "disc",
    name: "DISC Communication Styles",
    description: "An optional behavioral communication lens that helps adapt your approach to different stakeholder preferences. Note: DISC describes observable communication preferences, not emotional intelligence capabilities.",
    principles: [
      "Dominance (D): Direct, results-oriented, decisive",
      "Influence (I): Enthusiastic, collaborative, optimistic",
      "Steadiness (S): Patient, reliable, team-oriented",
      "Conscientiousness (C): Analytical, precise, systematic"
    ],
    techniques: [
      {
        name: "Style Identification",
        description: "Quickly identify a stakeholder's primary communication style through verbal and non-verbal cues",
        example: "A physician who wants bottom-line efficacy data first may prefer direct, data-driven communication"
      },
      {
        name: "Adaptive Communication",
        description: "Modify your presentation style to match the stakeholder's preferences",
        example: "For analytical stakeholders, lead with clinical data and methodology details"
      },
      {
        name: "Style-Aware Conversations",
        description: "Use behavioral awareness to navigate conversations more effectively",
        example: "With relationship-focused stakeholders, take time to build rapport before diving into data"
      }
    ],
    color: "chart-1"
  }
];

// =============================================================================
// LAYER 1 — Emotional Intelligence (Core Measurement Layer)
// =============================================================================
// Emotional Intelligence is a DEMONSTRATED CAPABILITY in ReflectivAI.
// These frameworks assess how effectively a seller perceives, interprets, and 
// responds to observable signals in complex sales conversations.
// Key point: EI is measured through observable behaviors, not personality traits.
// It is NOT personality-based, NOT behavioral labeling, and NOT diagnostic.
export const eqFrameworks: EQFramework[] = [
  {
    id: "active-listening",
    name: "Active Listening",
    description: "An emotional intelligence skill: developing deep listening to understand stakeholder needs and build trust",
    principles: [
      "Give full attention without planning your response",
      "Reflect back what you hear to confirm understanding",
      "Ask clarifying questions to go deeper",
      "Notice non-verbal cues and emotional undertones"
    ],
    techniques: [
      {
        name: "Paraphrasing",
        description: "Restate the stakeholder's message in your own words",
        example: "So what I'm hearing is that your primary concern is patient adherence..."
      },
      {
        name: "Emotional Validation",
        description: "Acknowledge the feelings behind the words",
        example: "I can understand why the formulary restrictions are frustrating for your practice"
      },
      {
        name: "Strategic Silence",
        description: "Use purposeful pauses to encourage deeper sharing",
        example: "After a stakeholder shares a concern, pause 3-5 seconds before responding"
      }
    ],
    color: "chart-2"
  },
  {
    id: "empathy-mapping",
    name: "Empathy Mapping",
    description: "An emotional intelligence skill: understanding stakeholder perspectives by mapping what they think, feel, say, and do",
    principles: [
      "Map what stakeholders SAY in conversations",
      "Infer what they THINK based on their questions",
      "Identify what they FEEL through emotional cues",
      "Observe what they DO in their decision patterns"
    ],
    techniques: [
      {
        name: "Stakeholder Journey Mapping",
        description: "Chart the emotional journey of key decision-makers",
        example: "Map a KOL's journey from initial skepticism to advocacy for your therapy"
      },
      {
        name: "Pain Point Discovery",
        description: "Uncover the real challenges stakeholders face daily",
        example: "Ask about their biggest frustration in managing treatment-resistant patients"
      },
      {
        name: "Value Alignment",
        description: "Connect your solution to what stakeholders truly care about",
        example: "Link clinical outcomes to the physician's personal mission of improving lives"
      }
    ],
    color: "chart-3"
  },
  {
    id: "rapport-building",
    name: "Rapport Building",
    description: "An emotional intelligence skill: establishing genuine connections that form the foundation of trusted partnerships",
    principles: [
      "Find authentic common ground beyond business",
      "Match communication style and energy levels",
      "Demonstrate consistent reliability over time",
      "Show genuine interest in their success"
    ],
    techniques: [
      {
        name: "Mirroring",
        description: "Subtly match body language, pace, and vocabulary",
        example: "If a stakeholder speaks methodically, slow your pace to match"
      },
      {
        name: "Value-First Approach",
        description: "Lead with insights and value before discussing products",
        example: "Share a relevant clinical insight before presenting your therapy data"
      },
      {
        name: "Follow-Through Excellence",
        description: "Build trust through consistent delivery on commitments",
        example: "Send the promised journal article within 24 hours of the meeting"
      }
    ],
    color: "chart-4"
  }
];

export const coachingModules: CoachingModule[] = [
  {
    id: "discovery",
    title: "Discovery Questions Mastery",
    description: "Learn to ask powerful questions that uncover stakeholder needs, challenges, and priorities",
    category: "discovery",
    icon: "Search",
    frameworks: ["active-listening", "empathy-mapping"],
    exercises: [
      {
        id: "d1",
        title: "Open-Ended Question Practice",
        description: "Practice converting closed questions to open-ended alternatives",
        type: "practice"
      },
      {
        id: "d2",
        title: "Needs Discovery Role-Play",
        description: "Simulate a first meeting with a new oncologist",
        type: "roleplay"
      }
    ],
    progress: 0
  },
  {
    id: "stakeholder",
    title: "Stakeholder Mapping",
    description: "Identify and understand all decision-makers in the healthcare ecosystem",
    category: "stakeholder",
    icon: "Users",
    frameworks: ["disc", "empathy-mapping"],
    exercises: [
      {
        id: "s1",
        title: "Influence Network Analysis",
        description: "Map the decision-making network for a hospital system",
        type: "practice"
      },
      {
        id: "s2",
        title: "P&T Committee Dynamics",
        description: "Understand pharmacy and therapeutics committee processes",
        type: "quiz"
      }
    ],
    progress: 0
  },
  {
    id: "clinical",
    title: "Clinical Evidence Communication",
    description: "Present clinical data effectively to different stakeholder types",
    category: "clinical",
    icon: "FileText",
    frameworks: ["disc", "active-listening"],
    exercises: [
      {
        id: "c1",
        title: "Data Storytelling",
        description: "Transform clinical trial results into compelling narratives",
        type: "practice"
      },
      {
        id: "c2",
        title: "KOL Presentation",
        description: "Present phase 3 data to a skeptical key opinion leader",
        type: "roleplay"
      }
    ],
    progress: 0
  },
  {
    id: "objection",
    title: "Objection Handling",
    description: "Address concerns and objections with empathy and evidence",
    category: "objection",
    icon: "Shield",
    frameworks: ["active-listening", "rapport-building"],
    exercises: [
      {
        id: "o1",
        title: "Cost Objection Response",
        description: "Practice responding to budget and pricing concerns",
        type: "roleplay"
      },
      {
        id: "o2",
        title: "Safety Concern Navigation",
        description: "Address adverse event questions effectively",
        type: "practice"
      }
    ],
    progress: 0
  },
  {
    id: "closing",
    title: "Closing Techniques",
    description: "Guide stakeholders toward commitment with confidence and integrity",
    category: "closing",
    icon: "CheckCircle",
    frameworks: ["rapport-building", "disc"],
    exercises: [
      {
        id: "cl1",
        title: "Commitment Ladder",
        description: "Practice gaining incremental commitments",
        type: "practice"
      },
      {
        id: "cl2",
        title: "Next Steps Confirmation",
        description: "Master the art of clear action planning",
        type: "roleplay"
      }
    ],
    progress: 0
  },
  {
    id: "eq-mastery",
    title: "EI Mastery for Pharma",
    description: "Integrate all emotional intelligence frameworks for healthcare selling",
    category: "eq",
    icon: "Brain",
    frameworks: ["disc", "active-listening", "empathy-mapping", "rapport-building"],
    exercises: [
      {
        id: "eq1",
        title: "Multi-Stakeholder Meeting",
        description: "Navigate a meeting with diverse communication styles",
        type: "roleplay"
      },
      {
        id: "eq2",
        title: "EI Self-Assessment",
        description: "Evaluate your emotional intelligence strengths",
        type: "quiz"
      }
    ],
    progress: 0
  }
];

export const scenarios: Scenario[] = [
  // HIV/PrEP Scenarios
  {
    id: "hiv_im_prep_lowshare",
    title: "Low Descovy Share with Missed PrEP Opportunity",
    description: "IM prescriber underutilizes PrEP despite steady STI testing in young MSM",
    category: "hiv",
    stakeholder: "Dr. Maya Patel - Internal Medicine MD, Urban Clinic",
    objective: "Create urgency around PrEP gaps; commit to proactive Descovy prescribing where appropriate and standardize quarterly follow-ups",
    context: "This time-pressed IM physician has inconsistent quarterly labs and follow-ups. STI testing volume suggests missed PrEP opportunities. Clinic believes few true PrEP candidates exist despite evidence to the contrary.",
    challenges: [
      "Belief that few patients are true PrEP candidates",
      "Renal safety and monitoring workload concerns",
      "Limited time for detailed discussions",
      "Prior auth burden for PrEP medications"
    ],
    keyMessages: [
      "Quantify at-risk patient pool from STI volume",
      "Review TAF renal safety advantages over TDF",
      "Propose nurse-led PrEP/lab cadence",
      "Streamlined quarterly follow-up protocol"
    ],
    impact: [
      "Reduce new HIV infections in at-risk population",
      "Improve clinic PrEP initiation rates by 30%",
      "Establish standardized monitoring workflow",
      "Protect high-risk patients proactively"
    ],
    suggestedPhrasing: [
      "I noticed your STI testing volume suggests there may be patients who could benefit from PrEP. Can we review the data together?",
      "TAF-based PrEP offers renal safety advantages that may address your monitoring concerns. Would you like to see the comparison data?",
      "What if we set up a nurse-led protocol to handle quarterly labs and follow-ups? This could reduce your workload significantly."
    ],
    difficulty: "intermediate"
  },
  {
    id: "hiv_np_highshare_access",
    title: "High Descovy Share but Access Barriers",
    description: "NP with strong share faces prior-auth workload and staffing friction",
    category: "hiv",
    stakeholder: "Sarah Thompson, NP - HIV Specialty Clinic",
    objective: "Broaden appropriate Descovy use via predictable PA batching and support roles; revisit generic TDF users with unrestricted coverage",
    context: "High-performing NP with excellent Descovy adoption. However, prior-auth burden and limited staffing cap patient throughput. Workflow friction limits breadth of appropriate prescribing.",
    challenges: [
      "Prior-auth processing burden",
      "Limited staffing resources",
      "Workflow friction for new starts",
      "Time constraints during patient visits"
    ],
    keyMessages: [
      "Implement twice-weekly PA batching protocol",
      "Partner with specialty pharmacy for benefits checks",
      "Identify TDF users with commercial coverage for conversion",
      "Streamlined hub enrollment process"
    ],
    impact: [
      "Increase patient access to optimal PrEP regimen",
      "Reduce staff burnout from PA processing",
      "Convert eligible TDF patients to TAF",
      "Improve clinic efficiency by 25%"
    ],
    suggestedPhrasing: [
      "Your Descovy adoption is excellent. What if we could reduce the PA burden by batching them twice weekly?",
      "I can connect you with our specialty pharmacy partner to handle benefits verification. Would that help free up your staff?",
      "There may be TDF patients with commercial coverage who could convert to TAF without additional PA. Can we identify them together?"
    ],
    difficulty: "advanced"
  },
  {
    id: "hiv_pa_treat_switch_slowdown",
    title: "Slowing Biktarvy Switches in Stable Patients",
    description: "Top HIV clinic with declining switch velocity; perception that most patients are optimized",
    category: "hiv",
    stakeholder: "Michael Chen, PA-C - Academic HIV Center",
    objective: "Reinforce durability and convenience benefits; define clear switch criteria and implement quarterly optimization review",
    context: "Hospital-affiliated ID clinic where prior switch velocity fell to 1-2 patients in 13 weeks. Strong perception that most patients are already optimized on current regimens.",
    challenges: [
      "Reluctance to switch stable, suppressed patients",
      "Perception of complete optimization",
      "Limited awareness of newer regimen benefits",
      "Competing clinical priorities"
    ],
    keyMessages: [
      "Long-term durability and resistance barrier data",
      "Simplified regimen improves adherence",
      "Create candidate list by labs/adherence flags",
      "Schedule switch day with counseling script"
    ],
    impact: [
      "Improve long-term treatment outcomes",
      "Reduce pill burden for eligible patients",
      "Proactive resistance prevention",
      "Enhanced patient satisfaction"
    ],
    suggestedPhrasing: [
      "Even with stable, suppressed patients, there may be opportunities to simplify regimens. Can we review which patients might benefit?",
      "The resistance barrier data for Biktarvy is compelling for long-term durability. Would you like to see the latest studies?",
      "What if we scheduled a quarterly optimization day to systematically review candidates? I can provide a counseling script to streamline the process."
    ],
    difficulty: "advanced"
  },
  {
    id: "hiv_np_cab_growth",
    title: "Cabotegravir Interest Without Systematic Screening",
    description: "CAB share growing but NP honors requests without systematic adherence/resistance evaluation",
    category: "hiv",
    stakeholder: "Jennifer Williams, NP - Community Health Center",
    objective: "Align on candidacy and monitoring criteria; protect long-term regimen durability through proper screening",
    context: "Patient demand is driving CAB/RPV selection without systematic adherence and resistance evaluation. Risk of inappropriate starts and treatment failures.",
    challenges: [
      "Patient-driven selection without clinical criteria",
      "Uncertainty about resistance screening requirements",
      "Monitoring protocol gaps",
      "Missed-dose management concerns"
    ],
    keyMessages: [
      "Adopt eligibility checklist for long-acting candidates",
      "Review resistance history before initiation",
      "Establish missed-dose action plan",
      "Set up injection calendar system"
    ],
    impact: [
      "Prevent treatment failures from inappropriate selection",
      "Protect long-term regimen options",
      "Improve patient outcomes with proper screening",
      "Reduce virologic breakthrough risk"
    ],
    suggestedPhrasing: [
      "I understand patients are asking for long-acting options. Would an eligibility checklist help ensure we're selecting the right candidates?",
      "Resistance history is critical for CAB success. Can I share a screening protocol that other practices have found helpful?",
      "What's your current approach for missed-dose scenarios? I have some resources that could help with patient counseling."
    ],
    difficulty: "intermediate"
  },
  // Oncology Scenarios
  {
    id: "onc_md_io_adc_pathways",
    title: "ADC Integration with IO Backbone",
    description: "Solid-tumor center evaluating ADCs; P&T scrutinizes cost/response and chair time",
    category: "oncology",
    stakeholder: "Dr. Robert Chen - Hematology/Oncology, Community Practice",
    objective: "Define biomarker-driven patient subset with clear OS/PFS benefit and operational fit; add to order sets and tumor board review",
    context: "Center is IO-backbone heavy with toxicity bandwidth constraints. P&T committee focuses on cost-per-response and infusion chair time. Need to demonstrate clear value proposition.",
    challenges: [
      "Toxicity management resource constraints",
      "P&T cost scrutiny and pathway integration",
      "Infusion chair time limitations",
      "Competition with established IO regimens"
    ],
    keyMessages: [
      "Biomarker-driven patient selection criteria",
      "Clear delta OS/PFS vs standard of care",
      "AE mitigation and management protocols",
      "NCCN category of evidence alignment"
    ],
    impact: [
      "Expand treatment options for biomarker+ patients",
      "Improve progression-free survival",
      "Establish clear pathway position",
      "Enhance tumor board decision-making"
    ],
    suggestedPhrasing: [
      "For your biomarker-positive patients, the OS/PFS data shows a clear benefit. Would you like to review the subset analysis?",
      "I understand chair time is a concern. The infusion protocol is designed to fit within your existing workflow. Can I walk you through it?",
      "This aligns with the NCCN category of evidence. Would it help to present this to your tumor board?"
    ],
    difficulty: "advanced"
  },
  {
    id: "onc_np_pathway_ops",
    title: "Pathway-Driven Care with Staffing Constraints",
    description: "Community infusion site with conservative IO use and short-staffed AE clinics",
    category: "oncology",
    stakeholder: "Lisa Martinez, NP - Community Oncology Infusion Center",
    objective: "Standardize NP-led education and toxicity call-tree; add AE one-pager to pathway handouts",
    context: "Conservative IO adoption due to staffing and AE management concerns. Education packets inconsistent across patients. Need standardized approach within resource constraints.",
    challenges: [
      "Staffing limitations for AE management",
      "Pathway paperwork burden",
      "Inconsistent patient education",
      "Limited time for toxicity monitoring"
    ],
    keyMessages: [
      "Template kits for patient education",
      "Standing nurse protocols for common AEs",
      "Streamlined pathway documentation",
      "Toxicity call-tree for efficient triage"
    ],
    impact: [
      "Improve patient safety with standardized protocols",
      "Reduce staff burden through efficiency",
      "Increase confidence in IO prescribing",
      "Better patient outcomes with consistent education"
    ],
    suggestedPhrasing: [
      "I have template kits that other infusion centers have used successfully. Would you like to see how they've streamlined patient education?",
      "A toxicity call-tree could help your team triage more efficiently. Can I share one that's been working well?",
      "Standing nurse protocols for common AEs could reduce the documentation burden. Would that be helpful to review?"
    ],
    difficulty: "intermediate"
  },
  {
    id: "onc_pa_gu_oral_onc_tminus7",
    title: "Oral Oncolytic Onboarding Optimization",
    description: "GU team struggles with hub forms and day-25-30 refill gaps",
    category: "oncology",
    stakeholder: "David Park, PA-C - GU Oncology Practice",
    objective: "Adopt T-7 onboarding with early hub enrollment, benefits check, and day-10 toxicity tele-visit",
    context: "Fragmented onboarding leads to late hub enrollment and refill gaps at days 25-30. Patients experience treatment interruptions affecting outcomes.",
    challenges: [
      "Fragmented onboarding process",
      "Late hub enrollment timing",
      "Day-25-30 refill gaps",
      "Inconsistent toxicity monitoring"
    ],
    keyMessages: [
      "T-7 onboarding checklist implementation",
      "Early hub enrollment at prescription",
      "Day-10 toxicity tele-visit protocol",
      "Refill safeguard system"
    ],
    impact: [
      "Eliminate treatment interruptions",
      "Improve medication adherence rates",
      "Earlier toxicity detection and management",
      "Better patient outcomes through continuity"
    ],
    suggestedPhrasing: [
      "If we enroll patients in the hub at T-7, we can avoid those day-25 refill gaps. Would you like to see the onboarding checklist?",
      "A day-10 toxicity tele-visit catches issues early before they become serious. How does that fit with your current workflow?",
      "Early benefits verification prevents surprises at the pharmacy. Can I show you how other GU practices have implemented this?"
    ],
    difficulty: "beginner"
  },
  // Cardiovascular Scenarios
  {
    id: "cv_card_md_hf_gdmt_uptake",
    title: "HFrEF Clinic GDMT Optimization",
    description: "Entresto uptake 62% of eligible HFrEF; SGLT2 at 38%; day-30 refill gaps",
    category: "cardiology",
    stakeholder: "Dr. Amanda Lewis - Cardiologist, Academic Heart Failure Center",
    objective: "Implement discharge GDMT checklist; pharmacy tech enrollment for copay help; achieve +10pp SGLT2 in 90 days",
    context: "Top-tier HF program with suboptimal four-pillar GDMT adoption. Fellows handle PAs leading to delays. Day-30 refill gaps compromise outcomes.",
    challenges: [
      "Copay barriers for SGLT2 inhibitors",
      "PA friction through fellow workflow",
      "Handoff gaps to PCP after discharge",
      "Inconsistent four-pillar implementation"
    ],
    keyMessages: [
      "Discharge GDMT checklist implementation",
      "Pharmacy tech copay assistance enrollment",
      "Start SGLT2 before discharge when eligible",
      "Convert ACE/ARB to ARNI within 48-72h per protocol"
    ],
    impact: [
      "Reduce 30-day HF readmissions by 20%",
      "Improve SGLT2 uptake to 48%+ in 90 days",
      "Eliminate day-30 refill gaps",
      "Better mortality outcomes with complete GDMT"
    ],
    suggestedPhrasing: [
      "Starting SGLT2 before discharge captures patients while they're still in the system. What would it take to add this to your discharge protocol?",
      "A pharmacy tech can handle copay assistance enrollment, freeing up your fellows for clinical work. Would that help?",
      "The 48-72h window for ARNI conversion is evidence-based. Can I share the protocol that other HF centers are using?"
    ],
    difficulty: "advanced"
  },
  {
    id: "cv_np_ckd_sglt2_calendar",
    title: "Rural HF Program with CKD Safety Concerns",
    description: "SGLT2 underused in CKD stage 3 due to misconceptions; no titration calendar",
    category: "cardiology",
    stakeholder: "Karen Mitchell, NP - Rural Heart Failure Clinic",
    objective: "Implement titration calendar and CKD-safe counseling; track eGFR and UACR at baseline and 12 weeks",
    context: "Rural practice with high CKD comorbidity in HF patients. SGLT2 inhibitors underutilized due to renal safety misconceptions. No structured titration approach.",
    challenges: [
      "CKD safety misconceptions about SGLT2i",
      "No structured titration calendar",
      "Limited specialist support in rural setting",
      "Patient education gaps on sick-day rules"
    ],
    keyMessages: [
      "SGLT2i renal safety data in CKD Stage 3",
      "Standardized titration calendar template",
      "Sick-day rules patient education",
      "Follow-up lab monitoring protocol"
    ],
    impact: [
      "Expand SGLT2i access to CKD patients",
      "Improve cardiorenal outcomes",
      "Reduce HF hospitalizations in rural population",
      "Build provider confidence in CKD prescribing"
    ],
    suggestedPhrasing: [
      "The DAPA-CKD and EMPA-KIDNEY trials show SGLT2i are safe in Stage 3 CKD. Would you like to review the renal outcomes?",
      "A titration calendar takes the guesswork out of dosing. Can I share a template you could customize for your practice?",
      "Sick-day rules are critical for patient safety. I have a one-pager that explains this in patient-friendly language."
    ],
    difficulty: "intermediate"
  },
  {
    id: "cv_pa_postmi_transitions",
    title: "Post-MI and HF Transitions Optimization",
    description: "SGLT2 initiation often deferred to PCP; ARNI starts delayed pending echo; readmissions above benchmark",
    category: "cardiology",
    stakeholder: "James Rodriguez, PA-C - Cardiac Care Unit",
    objective: "Start SGLT2 prior to discharge and convert to ARNI within 48-72h; pharmacy follow-up day 7",
    context: "Post-MI patients with reduced EF often discharged without complete GDMT. SGLT2 deferred to PCP, ARNI delayed for echo. Readmission rates above national benchmark.",
    challenges: [
      "Deferrals of GDMT initiation to outpatient",
      "Delayed ARNI titration pending echo",
      "Readmissions above benchmark",
      "Lack of structured transition protocol"
    ],
    keyMessages: [
      "In-hospital SGLT2 initiation protocol",
      "ARNI conversion within 48-72h timeline",
      "Day-7 pharmacy follow-up call",
      "Transition checklist with accountable owners"
    ],
    impact: [
      "Reduce 30-day readmissions to benchmark",
      "Improve complete GDMT at discharge",
      "Better post-MI survival outcomes",
      "Seamless transition to outpatient care"
    ],
    suggestedPhrasing: [
      "Deferring GDMT to the PCP often means it doesn't happen. What if we started SGLT2 here before discharge?",
      "A day-7 pharmacy follow-up call catches refill issues before they become gaps. Would that help with your readmission rates?",
      "A transition checklist with clear accountability could ensure nothing falls through the cracks. Can I share what's working at other centers?"
    ],
    difficulty: "intermediate"
  },
  // Vaccines Scenarios
  {
    id: "vac_id_adult_flu_playbook",
    title: "Adult Flu Program Optimization",
    description: "ID group with LTC/high-risk adults; late clinic launches; weak reminder-recall",
    category: "vaccines",
    stakeholder: "Dr. Evelyn Harper - Infectious Diseases Specialist",
    objective: "Pre-book age-appropriate vaccine mix; schedule early clinics; implement SMS reminders and standing orders in LTC",
    context: "ID practice serving long-term care and high-risk adult populations. Flu coverage fell in 65+ patients. Late clinic start and weak reminder systems contribute to missed opportunities.",
    challenges: [
      "Late flu clinic scheduling",
      "Weak reminder-recall systems",
      "Denials for 65+ formulations",
      "LTC coordination gaps"
    ],
    keyMessages: [
      "Pre-book age-appropriate vaccine mix early",
      "Calendarize clinic days before season",
      "EHR prompts for 65+ high-dose selection",
      "Standing orders in LTC facilities"
    ],
    impact: [
      "Increase 65+ flu coverage by 15%",
      "Reduce hospitalizations in high-risk patients",
      "Optimize clinic efficiency",
      "Improve LTC protection rates"
    ],
    suggestedPhrasing: [
      "Pre-booking the age-appropriate vaccine mix early ensures you have the right formulations when patients arrive. Can we plan this together?",
      "SMS reminders have shown 20% improvement in show rates. Would you like to see how to integrate this with your EHR?",
      "Standing orders in LTC facilities streamline the process significantly. I can help you implement this if you're interested."
    ],
    difficulty: "intermediate"
  },
  {
    id: "vac_np_primary_care_capture",
    title: "Primary Care Vaccine Capture Improvement",
    description: "Adequate storage but VIS misses due to staff rotation; ad-hoc Saturday clinics",
    category: "vaccines",
    stakeholder: "Alex Nguyen, NP - Family Medicine Practice",
    objective: "Implement standing orders, huddle checklists, and fixed weekend clinic schedule",
    context: "Primary care practice with adequate vaccine storage but workflow inconsistencies. Staff rotation causes VIS documentation misses. Saturday clinics are ad-hoc rather than scheduled.",
    challenges: [
      "Workflow inconsistency with staff rotation",
      "VIS documentation misses",
      "Ad-hoc weekend clinic scheduling",
      "EHR prompt underutilization"
    ],
    keyMessages: [
      "Standing orders for routine vaccinations",
      "Morning huddle vaccination checklist",
      "Fixed weekend clinic calendar",
      "Standardized VIS documentation workflow"
    ],
    impact: [
      "Improve vaccination capture rates by 20%",
      "Reduce documentation errors",
      "Consistent patient access on weekends",
      "Streamlined staff workflow"
    ],
    suggestedPhrasing: [
      "A morning huddle checklist ensures everyone knows who needs vaccinations that day. Would that help with staff rotation?",
      "Fixed weekend clinic schedules are easier for patients to remember. What would it take to make Saturdays consistent?",
      "Standing orders remove the need for individual physician authorization. Can I show you how other practices have set this up?"
    ],
    difficulty: "beginner"
  },
  // COVID-19 Scenarios
  {
    id: "covid_pulm_md_antiviral_ddi_path",
    title: "Outpatient Antiviral Optimization",
    description: "High-risk COPD/ILD population; Paxlovid first line but DDI triage slows prescribing",
    category: "covid",
    stakeholder: "Dr. Carlos Ramos - Pulmonologist",
    objective: "Implement rapid DDI triage protocol and standing infusion slot; achieve 48-hour initiation KPI",
    context: "Pulmonology practice with high-risk COPD and ILD patients. Paxlovid is first-line but DDI complexity slows prescribing. 3-day IV remdesivir limited by infusion capacity.",
    challenges: [
      "DDI complexity slowing Paxlovid initiation",
      "Limited infusion capacity for remdesivir",
      "Delayed treatment beyond 48-hour window",
      "Variable prescriber comfort with DDI triage"
    ],
    keyMessages: [
      "Rapid DDI screening protocol",
      "Standing infusion slot reservation",
      "48-hour initiation as quality metric",
      "Partner scheduling for IV options"
    ],
    impact: [
      "Reduce time to antiviral initiation",
      "Improve outcomes in high-risk patients",
      "Decrease COVID hospitalizations",
      "Standardize treatment approach"
    ],
    suggestedPhrasing: [
      "A rapid DDI screening protocol could help you prescribe Paxlovid more confidently. Would you like to see one?",
      "What if we reserved standing infusion slots for remdesivir candidates? That way capacity isn't a barrier.",
      "48-hour initiation is the key quality metric. How close are you currently, and what's the biggest bottleneck?"
    ],
    difficulty: "advanced"
  },
  {
    id: "covid_pulm_np_postcovid_adherence",
    title: "Post-COVID Clinic Antiviral Adherence",
    description: "Eligible patients present day 4-5; callbacks delay start; variable rebound education",
    category: "covid",
    stakeholder: "Maria Santos, NP - Pulmonary Medicine",
    objective: "Implement same-day eRx template; create patient one-pager; route day-2 positives to NP tele-start",
    context: "Post-COVID clinic seeing eligible patients too late in disease course. Callback delays push initiation beyond therapeutic window. Inconsistent patient education on rebound symptoms.",
    challenges: [
      "Late patient presentation (day 4-5)",
      "Callback delays to initiation",
      "Inconsistent rebound counseling",
      "Limited same-day access"
    ],
    keyMessages: [
      "Same-day eRx template for eligible patients",
      "Patient one-pager on treatment expectations",
      "Day-2 positive routing to NP tele-start",
      "Standardized rebound education"
    ],
    impact: [
      "Reduce time to treatment initiation",
      "Improve patient adherence and expectations",
      "Decrease hospitalization rates",
      "Better patient satisfaction with care"
    ],
    suggestedPhrasing: [
      "A same-day eRx template gets treatment started before the callback delay. Would that work for your workflow?",
      "Patients often have questions about rebound symptoms. This one-pager addresses the most common concerns.",
      "Routing day-2 positives directly to an NP tele-start could catch more patients in the therapeutic window. How does that sound?"
    ],
    difficulty: "beginner"
  },
  // Original scenarios updated with impact
  {
    id: "onc-kol",
    title: "Oncology KOL Introduction",
    description: "First meeting with a key opinion leader in breast cancer treatment",
    category: "oncology",
    stakeholder: "Dr. Sarah Chen, MD - Medical Oncologist, Cancer Center Director",
    objective: "Establish credibility and schedule a follow-up meeting to discuss clinical data",
    context: "Dr. Chen is highly published in HER2+ breast cancer. She's skeptical of new therapies without robust long-term data. Her time is extremely limited.",
    challenges: [
      "Limited time window (15 minutes)",
      "High skepticism toward pharma reps",
      "Demands peer-reviewed evidence",
      "Already loyal to competitor product"
    ],
    keyMessages: [
      "Novel mechanism of action",
      "Phase 3 overall survival data",
      "Quality of life improvements",
      "Patient support program"
    ],
    impact: [
      "Establish key opinion leader relationship",
      "Open door for clinical data presentation",
      "Potential speaker/advisory opportunity",
      "Regional practice influence"
    ],
    suggestedPhrasing: [
      "I know your time is valuable. I have one piece of data I think you'll find compelling—may I share it briefly?",
      "Your publications in HER2+ breast cancer are impressive. Our Phase 3 data addresses some of the gaps you've written about.",
      "Would a peer-to-peer with one of our investigators be more valuable than a follow-up with me?"
    ],
    difficulty: "advanced"
  },
  {
    id: "card-formulary",
    title: "Cardiology Formulary Review",
    description: "Present to the P&T committee for formulary inclusion",
    category: "cardiology",
    stakeholder: "Hospital P&T Committee - 8 members including pharmacists, physicians, and administrators",
    objective: "Gain preferred formulary status for your heart failure medication",
    context: "The hospital is cost-conscious but values clinical outcomes. Current standard of care is well-established. Your drug offers incremental benefit at higher cost.",
    challenges: [
      "Price premium over existing options",
      "Limited real-world evidence",
      "Need pharmacoeconomic justification",
      "Competing presentation from rival company"
    ],
    keyMessages: [
      "Reduction in hospitalizations",
      "Total cost of care savings",
      "Improved patient outcomes",
      "Physician feedback data"
    ],
    impact: [
      "Formulary access for 2,000+ HF patients",
      "Reduced administrative burden for prescribers",
      "Improved patient access to therapy",
      "Potential system-wide adoption"
    ],
    suggestedPhrasing: [
      "When you factor in reduced hospitalizations, the total cost of care actually decreases. May I walk you through the pharmacoeconomic analysis?",
      "Physicians in similar health systems have shared positive feedback on patient outcomes. Would it help to hear their experience?",
      "Preferred formulary status would remove barriers for your prescribers. What additional data would support that decision?"
    ],
    difficulty: "advanced"
  },
  {
    id: "neuro-access",
    title: "Neurology Market Access",
    description: "Navigate prior authorization challenges with a payer",
    category: "neurology",
    stakeholder: "Dr. James Miller - Medical Director, Regional Health Plan",
    objective: "Reduce prior authorization barriers for your multiple sclerosis therapy",
    context: "The payer has strict utilization management. Your therapy is second-line due to cost. Physicians are frustrated with approval delays.",
    challenges: [
      "Strict step-therapy requirements",
      "Focus on cost containment",
      "Limited meeting time",
      "Competing therapies on formulary"
    ],
    keyMessages: [
      "Clinical differentiation data",
      "Patient adherence benefits",
      "Long-term cost effectiveness",
      "Real-world outcomes"
    ],
    impact: [
      "Reduce PA turnaround to 24-48 hours",
      "Improve physician satisfaction",
      "Faster patient access to therapy",
      "Reduced disease progression"
    ],
    suggestedPhrasing: [
      "I understand cost containment is critical. Our real-world data shows reduced relapse rates that translate to lower long-term costs.",
      "Physicians have expressed frustration with approval delays. What would make the PA process work better for everyone?",
      "Would you consider a streamlined approval pathway for patients who meet specific clinical criteria?"
    ],
    difficulty: "intermediate"
  },
  {
    id: "immuno-launch",
    title: "Immunology New Product Launch",
    description: "Introduce a newly approved biologic to a rheumatology practice",
    category: "immunology",
    stakeholder: "Dr. Maria Rodriguez - Rheumatologist, Private Practice",
    objective: "Secure commitment to trial the new therapy with appropriate patients",
    context: "The practice sees many rheumatoid arthritis patients. They're familiar with existing biologics. Your product offers a novel mechanism with good safety data.",
    challenges: [
      "Comfort with existing therapies",
      "Concern about switching stable patients",
      "Questions about insurance coverage",
      "Limited office visit time"
    ],
    keyMessages: [
      "Rapid onset of action",
      "Favorable safety profile",
      "Patient convenience features",
      "Access and affordability programs"
    ],
    impact: [
      "Expand treatment options for RA patients",
      "Improve outcomes in inadequate responders",
      "Establish early adoption in practice",
      "Build foundation for broader use"
    ],
    suggestedPhrasing: [
      "For patients who haven't responded adequately to current biologics, this offers a new mechanism. Would you like to identify potential candidates?",
      "The rapid onset of action means patients may see improvement sooner. Can I share the timeline data?",
      "Our patient support program handles coverage questions, so your staff doesn't have to. Would that be helpful?"
    ],
    difficulty: "beginner"
  },
  {
    id: "rare-diagnosis",
    title: "Rare Disease Diagnosis Journey",
    description: "Help a physician recognize and diagnose a rare metabolic disorder",
    category: "rare-disease",
    stakeholder: "Dr. Patricia Lee - Pediatric Geneticist, Academic Medical Center",
    objective: "Increase awareness of disease symptoms and diagnostic pathway",
    context: "The condition affects 1 in 50,000 patients. Average time to diagnosis is 5 years. Your company offers the only approved treatment.",
    challenges: [
      "Low disease awareness",
      "Complex diagnostic workup",
      "Limited patient population",
      "Academic skepticism"
    ],
    keyMessages: [
      "Red flag symptoms",
      "Diagnostic algorithm",
      "Early treatment benefits",
      "Patient identification support"
    ],
    impact: [
      "Reduce diagnostic odyssey for patients",
      "Earlier intervention and treatment",
      "Improved long-term outcomes",
      "Regional center of excellence potential"
    ],
    suggestedPhrasing: [
      "Patients with this condition often present with symptoms that could be mistaken for other disorders. I have a red flag checklist that might help with early identification.",
      "The average diagnostic delay is 5 years. A simple screening algorithm could help identify candidates sooner. Would you like to see it?",
      "We offer patient identification support to help find undiagnosed patients in your system. Can I explain how it works?"
    ],
    difficulty: "intermediate"
  }
];

export const heuristicTemplates: HeuristicTemplate[] = [
  {
    id: "h1",
    category: "objection",
    name: "Feel-Felt-Found",
    template: "I understand how you feel. Other physicians have felt the same way. What they've found is that [benefit/outcome].",
    example: "I understand how you feel about the cost. Other oncologists felt the same concern initially. What they've found is that the reduction in hospitalizations more than offsets the therapy cost.",
    useCase: "When facing emotional or initial resistance objections",
    eqPrinciples: ["empathy-mapping", "active-listening"]
  },
  {
    id: "h2",
    category: "objection",
    name: "Acknowledge-Bridge-Close",
    template: "That's an important consideration. [Acknowledge]. What we've seen is [bridge to benefit]. How would [closing question]?",
    example: "That's an important consideration about long-term safety. We now have 5-year follow-up data showing consistent outcomes. How would access to that data help your prescribing confidence?",
    useCase: "When addressing specific clinical or data concerns",
    eqPrinciples: ["active-listening", "rapport-building"]
  },
  {
    id: "h3",
    category: "value-proposition",
    name: "Problem-Agitate-Solve",
    template: "Many physicians struggle with [problem]. This leads to [negative impact]. [Your solution] addresses this by [benefit].",
    example: "Many physicians struggle with patient adherence to injection therapies. This leads to suboptimal outcomes and increased office visits. Our auto-injector design addresses this with a 94% patient preference rating.",
    useCase: "When presenting your therapy's unique value",
    eqPrinciples: ["empathy-mapping"]
  },
  {
    id: "h4",
    category: "value-proposition",
    name: "Before-After-Bridge",
    template: "Before [your solution], patients experienced [challenge]. After, they [improved outcome]. The bridge is [your specific benefit].",
    example: "Before our therapy, patients with moderate-to-severe RA averaged 4 flares per year. After starting treatment, that dropped to 1.2 flares. The bridge is our rapid onset of action within the first week.",
    useCase: "When demonstrating clinical transformation",
    eqPrinciples: ["empathy-mapping", "rapport-building"]
  },
  {
    id: "h5",
    category: "closing",
    name: "Assumptive Next Step",
    template: "Based on what we've discussed, would it make sense to [specific next action]? I can [support offer].",
    example: "Based on what we've discussed about your HER2+ patients, would it make sense to schedule a peer-to-peer with Dr. Martinez? I can coordinate calendars this week.",
    useCase: "When gaining commitment after positive discussion",
    eqPrinciples: ["disc", "rapport-building"]
  },
  {
    id: "h6",
    category: "closing",
    name: "Trial Close with Options",
    template: "Would you prefer to start with [option A] or [option B]? Either way, I'll ensure [support commitment].",
    example: "Would you prefer to start with sample patients or begin with a lunch-and-learn for your team? Either way, I'll ensure you have all the clinical resources you need.",
    useCase: "When offering pathways to commitment",
    eqPrinciples: ["disc"]
  },
  {
    id: "h7",
    category: "discovery",
    name: "Situation-Problem-Implication",
    template: "Tell me about [situation]. What challenges does that create? How does that impact [patient outcomes/practice efficiency]?",
    example: "Tell me about your current approach to treatment-resistant patients. What challenges does that create in your practice? How does that impact your confidence in managing complex cases?",
    useCase: "When uncovering deep needs and priorities",
    eqPrinciples: ["active-listening", "empathy-mapping"]
  },
  {
    id: "h8",
    category: "discovery",
    name: "Day-in-the-Life",
    template: "Walk me through how you currently handle [situation]. What would make that easier/better?",
    example: "Walk me through how you currently handle insurance prior authorizations for biologics. What would make that process easier for your team?",
    useCase: "When understanding workflows and pain points",
    eqPrinciples: ["active-listening", "empathy-mapping"]
  },
  {
    id: "h9",
    category: "rapport",
    name: "Genuine Curiosity",
    template: "I noticed [observation about their work/interest]. What drew you to [that specialty/approach]?",
    example: "I noticed you've published extensively on personalized medicine approaches. What drew you to focus on biomarker-driven treatment selection?",
    useCase: "When building authentic connection",
    eqPrinciples: ["rapport-building", "active-listening"]
  },
  {
    id: "h10",
    category: "rapport",
    name: "Shared Purpose",
    template: "What we share is a commitment to [patient outcome]. I'm here to support that by [specific value].",
    example: "What we share is a commitment to improving quality of life for RA patients. I'm here to support that by ensuring you have the latest clinical evidence and patient access resources.",
    useCase: "When aligning on common ground",
    eqPrinciples: ["rapport-building", "empathy-mapping"]
  }
];

export const knowledgeArticles: KnowledgeArticle[] = [
  {
    id: "fda-approval",
    title: "FDA Drug Approval Process Overview",
    category: "fda",
    content: `The FDA drug approval process is rigorous and multi-phased, designed to ensure safety and efficacy before market authorization.

## Preclinical Testing
Before human trials, drugs undergo laboratory and animal testing to assess safety and biological activity.

## Clinical Trial Phases

### Phase 1
- 20-100 healthy volunteers
- Focus on safety and dosage
- Duration: Several months

### Phase 2
- 100-500 patients with condition
- Assess efficacy and side effects
- Duration: Several months to 2 years

### Phase 3
- 1,000-5,000 patients
- Confirm efficacy, monitor adverse reactions
- Duration: 1-4 years

## NDA/BLA Review
The New Drug Application or Biologics License Application is submitted with all clinical data. FDA review typically takes 10-12 months, with priority review available for breakthrough therapies.

## Post-Marketing (Phase 4)
Ongoing safety monitoring and additional studies after approval.`,
    summary: "Understanding the FDA's drug approval pathway from preclinical testing through post-market surveillance",
    tags: ["FDA", "drug approval", "clinical trials", "NDA", "regulatory"]
  },
  {
    id: "clinical-design",
    title: "Clinical Trial Design Fundamentals",
    category: "clinical-trials",
    content: `Understanding clinical trial design is essential for effectively communicating with healthcare providers about your therapy's evidence base.

## Randomized Controlled Trials (RCTs)
The gold standard for establishing causality. Patients are randomly assigned to treatment or control groups.

## Key Design Elements

### Blinding
- Single-blind: Patients don't know assignment
- Double-blind: Neither patients nor investigators know
- Open-label: All parties aware of assignment

### Control Types
- Placebo-controlled
- Active comparator
- Standard of care

### Endpoints
- Primary: Main outcome measure
- Secondary: Additional outcomes of interest
- Exploratory: Hypothesis-generating

## Statistical Considerations
- p-value: Probability result occurred by chance
- Confidence interval: Range of plausible values
- Hazard ratio: Comparison of event rates
- Number needed to treat: Patients to treat for one benefit`,
    summary: "Core concepts in clinical trial design that every pharma professional should understand",
    tags: ["clinical trials", "RCT", "endpoints", "statistics", "evidence"]
  },
  {
    id: "hipaa-basics",
    title: "HIPAA Compliance for Pharma Sales",
    category: "compliance",
    content: `HIPAA regulations impact how pharmaceutical representatives can interact with healthcare providers and access patient information.

## Protected Health Information (PHI)
Any individually identifiable health information including:
- Names, addresses, dates
- Medical records and history
- Insurance information
- Any other identifying data

## Key Requirements

### Minimum Necessary Standard
Only access the minimum PHI needed for a specific purpose.

### Business Associate Agreements
Required when third parties handle PHI on behalf of covered entities.

### Security Safeguards
- Administrative controls
- Physical safeguards
- Technical measures

## Implications for Sales Reps
- Never request specific patient information
- Avoid looking at patient charts or records
- Be careful with sample signature logs
- Maintain confidentiality of any incidental exposure`,
    summary: "Essential HIPAA knowledge for maintaining compliance in pharmaceutical sales interactions",
    tags: ["HIPAA", "compliance", "privacy", "PHI", "regulations"]
  },
  {
    id: "hcp-engagement",
    title: "HCP Engagement Best Practices",
    category: "hcp-engagement",
    content: `Effective engagement with healthcare providers requires balancing value delivery with regulatory compliance.

## Pre-Call Planning
- Research the HCP's specialty and interests
- Review publication history
- Understand practice dynamics
- Prepare relevant clinical data

## During the Interaction
- Lead with value, not product
- Listen more than you speak
- Respect time constraints
- Offer relevant resources

## Compliance Considerations
- Follow speaker program guidelines
- Proper documentation of samples
- Transparency in value exchanges
- Sunshine Act reporting

## Virtual Engagement
- Leverage approved digital channels
- Respect communication preferences
- Provide easy access to resources
- Follow up appropriately`,
    summary: "Guidelines for effective and compliant healthcare provider engagement",
    tags: ["HCP", "engagement", "compliance", "best practices", "sales"]
  },
  {
    id: "market-access",
    title: "Understanding Payer Dynamics",
    category: "market-access",
    content: `Navigating the complex payer landscape is crucial for ensuring patient access to your therapies.

## Payer Types

### Commercial Payers
- Large national insurers (UnitedHealthcare, Anthem, Aetna)
- Regional health plans
- Self-insured employers

### Government Payers
- Medicare Part D
- Medicaid (state-specific)
- Veterans Affairs

## Formulary Tiers
- Tier 1: Generic (lowest copay)
- Tier 2: Preferred brand
- Tier 3: Non-preferred brand
- Specialty tier: High-cost therapies

## Access Barriers
- Prior authorization
- Step therapy requirements
- Quantity limits
- Site of care restrictions

## Value Demonstration
- Clinical differentiation
- Pharmacoeconomic data
- Real-world evidence
- Patient outcomes data`,
    summary: "Key concepts in market access and payer navigation for pharmaceutical products",
    tags: ["payers", "formulary", "market access", "insurance", "reimbursement"]
  },
  {
    id: "pricing-transparency",
    title: "Drug Pricing and Transparency",
    category: "pricing",
    content: `Understanding drug pricing mechanisms helps navigate conversations about cost and value.

## Pricing Terminology

### WAC (Wholesale Acquisition Cost)
The manufacturer's list price to wholesalers. Often used as the starting point for negotiations.

### AWP (Average Wholesale Price)
A benchmark price, typically WAC plus a markup. Used in some reimbursement calculations.

### ASP (Average Sales Price)
Medicare Part B uses ASP plus 6% for reimbursement of physician-administered drugs.

## Discounts and Rebates
- Medicaid rebates (mandatory)
- Commercial rebates (negotiated)
- 340B program pricing
- Patient assistance programs

## Transparency Requirements
- Sunshine Act reporting
- State pricing laws
- Pipeline notification requirements

## Value-Based Discussions
Frame cost conversations around:
- Total cost of care
- Avoided hospitalizations
- Quality of life improvements
- Long-term outcomes`,
    summary: "Navigate drug pricing conversations with clarity and confidence",
    tags: ["pricing", "transparency", "WAC", "rebates", "value"]
  }
];

export const diseaseStates = [
  { id: "hiv", name: "HIV" },
  { id: "prep", name: "PrEP (HIV Prevention)" },
  { id: "oncology", name: "Oncology" },
  { id: "cardiology", name: "Cardiology" },
  { id: "neurology", name: "Neurology" },
  { id: "infectious-disease", name: "Infectious Disease" },
  { id: "endocrinology", name: "Endocrinology" },
  { id: "respiratory", name: "Respiratory / Pulmonology" },
  { id: "hepatology", name: "Hepatology" },
  { id: "vaccines", name: "Vaccines / Immunization" },
  { id: "general-medicine", name: "General Medicine" },
];

export const coachingStyles = [
  { 
    id: "direct", 
    name: "Direct Coach", 
    description: "Straight to the point. Gives clear, actionable feedback without sugarcoating.",
    icon: "Zap",
    promptModifier: "Be direct and concise. Give clear, actionable feedback. Don't sugarcoat issues - tell the rep exactly what they need to improve. Focus on practical next steps."
  },
  { 
    id: "empathetic", 
    name: "Empathetic Coach", 
    description: "Supportive and encouraging. Focuses on building confidence while coaching.",
    icon: "Heart",
    promptModifier: "Be warm, supportive, and encouraging. Acknowledge the rep's efforts and challenges. Build confidence while gently guiding improvement. Use positive framing."
  },
  { 
    id: "analytical", 
    name: "Analytical Coach", 
    description: "Data-driven and methodical. Breaks down performance with detailed analysis.",
    icon: "BarChart3",
    promptModifier: "Be analytical and data-driven. Break down performance metrics and provide detailed analysis. Reference specific frameworks and best practices. Be methodical and thorough."
  },
  { 
    id: "motivational", 
    name: "Motivational Coach", 
    description: "High-energy and inspiring. Pushes reps to reach their full potential.",
    icon: "Flame",
    promptModifier: "Be energetic, inspiring, and motivational. Push the rep to reach their full potential. Celebrate wins enthusiastically. Frame challenges as growth opportunities."
  }
];

export const hcpProfiles = [
  { 
    id: "hiv_fp_md_timepressed", 
    name: "Dr. Maya Patel — Family Practice MD", 
    specialty: "Family Medicine", 
    setting: "Urban clinic with mixed payer base", 
    style: "Direct; wants concise workflows",
    therapeuticAreas: ["hiv", "prep", "infectious-disease", "general-medicine"],
    prescriberLevel: "Moderate Volume",
    concern: "Time Constraints"
  },
  { 
    id: "hiv_id_md_guideline_strict", 
    name: "Dr. Evelyn Harper — Infectious Diseases", 
    specialty: "Infectious Diseases", 
    setting: "Academic ID clinic", 
    style: "Evidence-demanding; skeptical of marketing",
    therapeuticAreas: ["hiv", "prep", "infectious-disease"],
    prescriberLevel: "High Volume",
    concern: "Evidence Quality"
  },
  { 
    id: "onco_hemonc_md_costtox", 
    name: "Dr. Chen — Hematology/Oncology", 
    specialty: "Hem/Onc", 
    setting: "Community oncology practice", 
    style: "Wants clear ΔOS/ΔPFS with AE context",
    therapeuticAreas: ["oncology"],
    prescriberLevel: "High Volume",
    concern: "Cost & Toxicity"
  },
  { 
    id: "vax_peds_np_hesitancy", 
    name: "Alex Nguyen, NP — Pediatrics", 
    specialty: "Pediatrics", 
    setting: "Suburban pediatrics office", 
    style: "Brief, template-driven",
    therapeuticAreas: ["vaccines", "general-medicine"],
    prescriberLevel: "Moderate Volume",
    concern: "Patient Hesitancy"
  },
  { 
    id: "covid_hosp_hospitalist_threshold", 
    name: "Dr. Fabiano — Hospitalist", 
    specialty: "Internal Medicine", 
    setting: "Community hospital", 
    style: "Order-set focused",
    therapeuticAreas: ["infectious-disease", "general-medicine"],
    prescriberLevel: "High Volume",
    concern: "Protocol Adherence"
  },
  { 
    id: "hbv_hepatology_md_access", 
    name: "Dr. Smith — Hepatology", 
    specialty: "Hepatology", 
    setting: "Academic liver clinic", 
    style: "Wants PA-ready documentation",
    therapeuticAreas: ["hepatology", "infectious-disease"],
    prescriberLevel: "High Volume",
    concern: "Access & PA"
  },
  { 
    id: "cardio_fm_md_ascvd_risk", 
    name: "Dr. Lewis — Primary Care Cardiology Focus", 
    specialty: "Family Medicine", 
    setting: "Large IPA", 
    style: "Targets measurable KPI gains",
    therapeuticAreas: ["cardiology", "general-medicine"],
    prescriberLevel: "Moderate Volume",
    concern: "KPI Metrics"
  },
  { 
    id: "pulm_md_copd_exac", 
    name: "Dr. Ramos — Pulmonology", 
    specialty: "Pulmonology", 
    setting: "Pulmonary clinic", 
    style: "Brief; focuses on exacerbation risk",
    therapeuticAreas: ["respiratory"],
    prescriberLevel: "High Volume",
    concern: "Exacerbation Risk"
  },
  { 
    id: "endo_md_t2d_ckd", 
    name: "Dr. Nasser — Endocrinology", 
    specialty: "Endocrinology", 
    setting: "Multispecialty group", 
    style: "Wants ADA/KDIGO alignment",
    therapeuticAreas: ["endocrinology", "cardiology"],
    prescriberLevel: "High Volume",
    concern: "Guideline Alignment"
  },
  { 
    id: "asthma_peds_md_controller", 
    name: "Dr. Ortega — Pediatrics", 
    specialty: "Pediatrics", 
    setting: "Community clinic", 
    style: "Uses step charts and action plans",
    therapeuticAreas: ["respiratory", "general-medicine"],
    prescriberLevel: "Low Volume",
    concern: "Controller Adherence"
  },
  { 
    id: "neuro_md_ms_migraine", 
    name: "Dr. Kovacs — Neurology", 
    specialty: "Neurology", 
    setting: "Academic neurology center", 
    style: "Wants mechanism-of-action detail and long-term safety data",
    therapeuticAreas: ["neurology", "general-medicine"],
    prescriberLevel: "High Volume",
    concern: "Long-term Safety"
  },
  { 
    id: "neuro_np_headache_clinic", 
    name: "Sarah Mitchell, NP — Headache & Migraine", 
    specialty: "Neurology", 
    setting: "Headache specialty clinic", 
    style: "Patient-centered; focused on quality of life outcomes",
    therapeuticAreas: ["neurology"],
    prescriberLevel: "Moderate Volume",
    concern: "Patient QoL"
  },
];

// Helper to get HCP profile descriptor for display (industry standard format)
export function getHcpDescriptor(profile: typeof hcpProfiles[0]): string {
  return profile.prescriberLevel;
}

// Helper to get HCP concern tag
export function getHcpConcernTag(profile: typeof hcpProfiles[0]): string {
  return profile.concern;
}

// =============================================================================
// UNIFIED EI SCORING SYSTEM
// =============================================================================
// All EI metrics use a consistent 1-5 scoring scale with performance levels.
// This ensures intuitive, comparable evaluation across all coaching experiences.

export type PerformanceLevel = "exceptional" | "strong" | "developing" | "emerging" | "needs-focus";

export interface PerformanceLevelInfo {
  level: PerformanceLevel;
  label: string;
  range: string;
  color: string;
  bgColor: string;
}

export const performanceLevels: Record<PerformanceLevel, PerformanceLevelInfo> = {
  "exceptional": { level: "exceptional", label: "Exceptional", range: "4.5-5.0", color: "text-green-600", bgColor: "bg-green-500/10" },
  "strong": { level: "strong", label: "Strong", range: "3.5-4.4", color: "text-blue-600", bgColor: "bg-blue-500/10" },
  "developing": { level: "developing", label: "Developing", range: "2.5-3.4", color: "text-yellow-600", bgColor: "bg-yellow-500/10" },
  "emerging": { level: "emerging", label: "Emerging", range: "1.5-2.4", color: "text-orange-600", bgColor: "bg-orange-500/10" },
  "needs-focus": { level: "needs-focus", label: "Needs Focus", range: "1.0-1.4", color: "text-red-600", bgColor: "bg-red-500/10" }
};

export function getPerformanceLevel(score: number): PerformanceLevelInfo {
  if (score >= 4.5) return performanceLevels["exceptional"];
  if (score >= 3.5) return performanceLevels["strong"];
  if (score >= 2.5) return performanceLevels["developing"];
  if (score >= 1.5) return performanceLevels["emerging"];
  return performanceLevels["needs-focus"];
}

export function getScoreColor(score: number): string {
  if (score >= 4.5) return "text-green-600";
  if (score >= 3.5) return "text-blue-600";
  if (score >= 2.5) return "text-yellow-600";
  if (score >= 1.5) return "text-orange-600";
  return "text-red-600";
}

export function getScoreBgColor(score: number): string {
  if (score >= 4.5) return "bg-green-500/10 border-green-500/30";
  if (score >= 3.5) return "bg-blue-500/10 border-blue-500/30";
  if (score >= 2.5) return "bg-yellow-500/10 border-yellow-500/30";
  if (score >= 1.5) return "bg-orange-500/10 border-orange-500/30";
  return "bg-red-500/10 border-red-500/30";
}

// EI Metrics Framework - Layer 1 (Core Measurement)
// Measures DEMONSTRATED CAPABILITY through observable behaviors.
// All metrics scored 1-5 for consistency and intuitive comparison.
export interface EQMetric {
  id: string;
  name: string;
  displayName: string;
  category: "self-perception" | "self-expression" | "interpersonal" | "decision-making" | "stress-management";
  description: string;
  calculation: string;
  sampleIndicators: string[];
  keyTip: string;
  whatGoodLooksLike: string;
  learnMoreLink?: string;
  color: string;
  isCore: boolean;
}

export const eqMetrics: EQMetric[] = [
  {
    id: "empathy",
    name: "Empathy Accuracy",
    displayName: "Empathy Accuracy",
    category: "interpersonal",
    isCore: true,
    description: "How accurately you recognized and responded to observable HCP signals. Demonstrates understanding of their clinical situation based on expressed concerns.",
    calculation: "Observed signal responses / Total observable signals (1-5 score)",
    sampleIndicators: [
      "Acknowledges HCP's concerns before offering solutions",
      "Uses phrases like 'I understand your concern about...'",
      "Validates the emotional context of clinical decisions",
      "Demonstrates awareness of HCP's practice pressures"
    ],
    keyTip: "Lead with acknowledgment before presenting data. Show you understand their patient population challenges.",
    whatGoodLooksLike: "Rep consistently validates HCP concerns, asks about specific patient scenarios, and connects solutions to their expressed needs rather than jumping to product features.",
    learnMoreLink: "https://www.eiconsortium.org/measures/eqi.html",
    color: "hsl(142, 76%, 36%)"
  },
  {
    id: "clarity",
    name: "Clarity & Alignment",
    displayName: "Clarity & Alignment",
    category: "self-expression",
    isCore: true,
    description: "How well your responses aligned to the HCP's expressed needs. Demonstrates clear, relevant messaging that connects to stated concerns.",
    calculation: "Aligned responses / Total response opportunities (1-5 score)",
    sampleIndicators: [
      "Uses structured frameworks (e.g., headline first, then support)",
      "Avoids jargon when explaining complex concepts",
      "Summarizes key points at appropriate intervals",
      "Adapts language complexity to audience"
    ],
    keyTip: "Use the 'headline-evidence-summary' structure. Lead with the key message, support with data, close with the takeaway.",
    whatGoodLooksLike: "Rep explains clinical data in 2-3 sentences that a busy HCP can immediately understand and act upon. Complex trial data is translated into practice implications.",
    color: "hsl(221, 83%, 53%)"
  },
  {
    id: "compliance",
    name: "Compliance",
    displayName: "Compliance",
    category: "decision-making",
    isCore: false,
    description: "Observable adherence to approved labeling and appropriate redirects when faced with off-label inquiries.",
    calculation: "Compliant statements / Total claims (1-5 score)",
    sampleIndicators: [
      "Uses only approved indications and claims",
      "References approved PI/label language",
      "Redirects off-label questions appropriately",
      "Includes fair balance when discussing efficacy"
    ],
    keyTip: "When asked off-label questions, acknowledge the question and redirect to approved uses or offer to connect with Medical Affairs.",
    whatGoodLooksLike: "Rep never makes unsupported claims. All efficacy statements reference specific trial data. Fair balance is naturally integrated. Off-label requests handled professionally.",
    color: "hsl(262, 83%, 58%)"
  },
  {
    id: "discovery",
    name: "Discovery Depth",
    displayName: "Discovery Depth",
    category: "interpersonal",
    isCore: true,
    description: "How well you validated assumptions and surfaced meaningful information through insightful questioning.",
    calculation: "Quality discovery questions / Opportunities to probe (1-5 score)",
    sampleIndicators: [
      "Asks open-ended questions about patient types",
      "Probes for underlying concerns behind objections",
      "Explores current treatment protocols",
      "Inquires about formulary and access situations"
    ],
    keyTip: "Ask 'What would need to be true...' questions to understand decision criteria. Focus on patient outcomes, not product adoption.",
    whatGoodLooksLike: "Rep asks 3-5 thoughtful questions before presenting. Questions reveal genuine curiosity about HCP's practice, patient mix, and treatment challenges.",
    color: "hsl(24, 95%, 53%)"
  },
  {
    id: "objection-handling",
    name: "Objection Handling",
    displayName: "Objection Handling",
    category: "stress-management",
    isCore: false,
    description: "Demonstrated ability to acknowledge and reframe concerns with evidence and appropriate empathy.",
    calculation: "Effective objection responses / Total objections (1-5 score)",
    sampleIndicators: [
      "Listens carefully before responding to objections",
      "Reframes objections constructively",
      "Offers evidence-based answers",
      "Uses Feel-Felt-Found or Acknowledge-Bridge-Close frameworks"
    ],
    keyTip: "A response scores well if it contains both objection recognition and a compliant fact or empathetic statement.",
    whatGoodLooksLike: "Rep welcomes objections as opportunities. Uses 'I appreciate you raising that...' then provides specific data. Never becomes defensive.",
    learnMoreLink: "https://www.richardson.com/sales-resources/defining-the-best-sales-objection-handling-techniques/",
    color: "hsl(340, 82%, 52%)"
  },
  {
    id: "confidence",
    name: "Confidence",
    displayName: "Confidence",
    category: "self-perception",
    isCore: false,
    description: "Demonstrated self-assurance in presenting clinical data and recommendations while remaining open to dialogue.",
    calculation: "Confident statements / Total statements (1-5 score)",
    sampleIndicators: [
      "Uses declarative statements vs. hedging language",
      "Maintains position when challenged appropriately",
      "Avoids excessive qualifiers ('maybe', 'kind of', 'I think')",
      "Demonstrates product and disease state expertise"
    ],
    keyTip: "Replace 'I think the data shows...' with 'The Phase III trial demonstrated...' Own your expertise while staying humble.",
    whatGoodLooksLike: "Rep speaks with authority about clinical data but invites questions. Uses 'The evidence demonstrates...' rather than 'I believe...'",
    color: "hsl(47, 96%, 53%)"
  },
  {
    id: "active-listening",
    name: "Active Listening",
    displayName: "Active Listening",
    category: "interpersonal",
    isCore: false,
    description: "Demonstrated paraphrasing and responding to what was actually said, confirming understanding.",
    calculation: "Listening behaviors / Total exchanges (1-5 score)",
    sampleIndicators: [
      "Paraphrases HCP statements to check for understanding",
      "Reacts to both words and emotions",
      "Asks clarifying follow-up questions",
      "References earlier points in the conversation"
    ],
    keyTip: "Use phrases like 'What I'm hearing is...' and 'If I understand correctly...' to demonstrate active engagement.",
    whatGoodLooksLike: "Rep paraphrases HCP concerns before responding. Picks up on subtle cues about time pressure or skepticism. Never interrupts.",
    color: "hsl(173, 80%, 40%)"
  },
  {
    id: "adaptability",
    name: "Adaptive Communication",
    displayName: "Adaptive Communication",
    category: "stress-management",
    isCore: true,
    description: "Demonstrated flexibility in adjusting approach based on observed signals, time constraints, and emerging concerns.",
    calculation: "Adaptive pivots / Signal-triggered opportunities (1-5 score)",
    sampleIndicators: [
      "Adjusts depth of detail based on HCP interest",
      "Pivots when sensing disengagement",
      "Modifies communication approach based on HCP style",
      "Respects time constraints by prioritizing key messages"
    ],
    keyTip: "Watch for verbal and non-verbal cues. If you sense time pressure, offer: 'I want to respect your time—shall I focus on [key point]?'",
    whatGoodLooksLike: "Rep notices HCP is rushed and immediately offers a 'headline summary.' Switches from data-heavy to story-based approach when sensing cognitive overload.",
    color: "hsl(291, 64%, 42%)"
  },
  {
    id: "action-insight",
    name: "Action Insight",
    displayName: "Action Insight",
    category: "decision-making",
    isCore: false,
    description: "Demonstrated ability to translate discussion into concrete next steps and commitments.",
    calculation: "Actionable closes / Opportunities to close (1-5 score)",
    sampleIndicators: [
      "Proposes specific next steps",
      "Asks for commitment to try with appropriate patients",
      "Schedules follow-up conversations",
      "Offers resources that match identified needs"
    ],
    keyTip: "Always close with a specific ask: 'Would you be open to trying [product] with your next [patient type]?'",
    whatGoodLooksLike: "Every conversation ends with a clear mutual commitment. Rep confirms understanding of next steps and timeline before departing.",
    color: "hsl(199, 89%, 48%)"
  },
  {
    id: "resilience",
    name: "Resilience",
    displayName: "Resilience",
    category: "stress-management",
    isCore: false,
    description: "Demonstrated composure and effectiveness when facing pushback, rejection, or difficult stakeholder dynamics.",
    calculation: "Recovery responses / Setback moments (1-5 score)",
    sampleIndicators: [
      "Stays positive after rejection",
      "Reframes 'no' as an opportunity to learn",
      "Maintains professionalism under pressure",
      "Seeks alternative paths forward"
    ],
    keyTip: "When rejected, respond with 'I appreciate your candor. What would make this worth revisiting in the future?'",
    whatGoodLooksLike: "Rep handles a firm 'no' gracefully, thanks the HCP for their time, and asks what might change their perspective. Leaves the door open for future dialogue.",
    color: "hsl(0, 84%, 60%)"
  }
];

// EQ-i 2.0 Composite categories for grouping
export const eqCategories = {
  "self-perception": {
    name: "Self-Perception",
    description: "Understanding your inner self and confidence",
    metrics: ["confidence"]
  },
  "self-expression": {
    name: "Self-Expression", 
    description: "Expressing yourself and your ideas openly",
    metrics: ["clarity"]
  },
  "interpersonal": {
    name: "Interpersonal",
    description: "Building and maintaining relationships",
    metrics: ["empathy", "discovery", "active-listening"]
  },
  "decision-making": {
    name: "Decision Making",
    description: "Using emotions in problem-solving",
    metrics: ["compliance", "action-insight"]
  },
  "stress-management": {
    name: "Stress Management",
    description: "Coping with challenging situations",
    metrics: ["objection-handling", "adaptability", "resilience"]
  }
};

export const sampleSqlQueries = [
  {
    natural: "Show me all sales calls this month",
    sql: "SELECT * FROM sales_calls WHERE call_date >= DATE_TRUNC('month', CURRENT_DATE) ORDER BY call_date DESC;"
  },
  {
    natural: "Which products had the highest prescriptions last quarter?",
    sql: "SELECT product_name, SUM(prescription_count) as total_rx FROM prescriptions WHERE prescription_date >= DATE_TRUNC('quarter', CURRENT_DATE - INTERVAL '3 months') AND prescription_date < DATE_TRUNC('quarter', CURRENT_DATE) GROUP BY product_name ORDER BY total_rx DESC LIMIT 10;"
  },
  {
    natural: "Find physicians who haven't been contacted in 30 days",
    sql: "SELECT p.name, p.specialty, p.institution, MAX(c.contact_date) as last_contact FROM physicians p LEFT JOIN contacts c ON p.id = c.physician_id GROUP BY p.id, p.name, p.specialty, p.institution HAVING MAX(c.contact_date) < CURRENT_DATE - INTERVAL '30 days' OR MAX(c.contact_date) IS NULL;"
  },
  {
    natural: "What's my average samples per call by territory?",
    sql: "SELECT t.territory_name, AVG(sc.samples_distributed) as avg_samples FROM sales_calls sc JOIN territories t ON sc.territory_id = t.id GROUP BY t.territory_name ORDER BY avg_samples DESC;"
  },
  {
    natural: "Compare prescription trends for oncology vs cardiology",
    sql: "SELECT therapeutic_area, DATE_TRUNC('month', prescription_date) as month, COUNT(*) as rx_count FROM prescriptions WHERE therapeutic_area IN ('Oncology', 'Cardiology') AND prescription_date >= CURRENT_DATE - INTERVAL '12 months' GROUP BY therapeutic_area, month ORDER BY month, therapeutic_area;"
  }
];

// HCP Categories for dropdown selection
export const hcpCategories = [
  { id: "kol", name: "KOL / Thought Leader", description: "Key Opinion Leader with significant influence in their specialty" },
  { id: "prescriber", name: "Prescriber / Treater", description: "Active prescriber with regular patient volume" },
  { id: "non-prescribing", name: "Non-Prescribing Influencer", description: "Influences treatment decisions but doesn't directly prescribe" },
  { id: "low-engagement", name: "Low Engagement", description: "Limited interaction history or minimal prescribing activity" },
];

// Influence & Decision Drivers for AI Coach context
export const influenceDrivers = [
  { id: "evidence-based", name: "Evidence-Based", description: "Prioritizes clinical trial data and peer-reviewed research" },
  { id: "patient-centric", name: "Patient-Centric", description: "Focuses on patient outcomes, quality of life, and adherence" },
  { id: "risk-averse", name: "Risk-Averse", description: "Cautious about new treatments; values safety profile and long-term data" },
  { id: "guideline-anchored", name: "Guideline-Anchored", description: "Follows established guidelines and society recommendations closely" },
];

// Specialties filtered by Disease State
export const specialtiesByDiseaseState: Record<string, string[]> = {
  "hiv": ["Infectious Diseases", "Family Medicine", "Internal Medicine"],
  "prep": ["Infectious Diseases", "Family Medicine", "Internal Medicine"],
  "oncology": ["Hem/Onc", "Medical Oncology", "Surgical Oncology", "Radiation Oncology"],
  "cardiology": ["Cardiology", "Internal Medicine", "Family Medicine"],
  "neurology": ["Neurology", "Psychiatry", "Pain Medicine"],
  "infectious-disease": ["Infectious Diseases", "Internal Medicine", "Pulmonology"],
  "endocrinology": ["Endocrinology", "Internal Medicine", "Family Medicine"],
  "respiratory": ["Pulmonology", "Allergy/Immunology", "Internal Medicine"],
  "hepatology": ["Hepatology", "Gastroenterology", "Infectious Diseases"],
  "vaccines": ["Pediatrics", "Family Medicine", "Internal Medicine", "Infectious Diseases"],
  "general-medicine": ["Family Medicine", "Internal Medicine", "Pediatrics"],
};

// All unique specialties for when no disease state is selected
export const allSpecialties = [
  "Family Medicine",
  "Internal Medicine",
  "Infectious Diseases",
  "Hem/Onc",
  "Medical Oncology",
  "Cardiology",
  "Neurology",
  "Pediatrics",
  "Pulmonology",
  "Hepatology",
  "Gastroenterology",
  "Endocrinology",
  "Psychiatry",
  "Allergy/Immunology",
  "Pain Medicine",
  "Surgical Oncology",
  "Radiation Oncology",
];
