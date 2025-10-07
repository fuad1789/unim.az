/**
 * Global Subject Mapping System
 * This system handles subject name variations across all universities and groups
 */

export interface SubjectMapping {
  canonicalName: string;
  variants: string[];
  aliases: string[];
  type?: "lecture" | "seminar" | "lab" | "practice";
}

export interface UniversitySubjectConfig {
  universityId: number;
  universityName: string;
  subjectMappings: SubjectMapping[];
}

/**
 * Global subject mappings that work across all universities
 * This is the single source of truth for subject name normalization
 */
export const GLOBAL_SUBJECT_MAPPINGS: SubjectMapping[] = [
  // Computer Engineering subjects
  {
    canonicalName: "Kompüter mühəndisliyinin əsasları",
    variants: [
      "Kompüter mühəndisliyinin əsasları",
      "Komp. müh. əsas.",
      "Kompüter mühəndisliyinin əsasları (mühazirə)",
      "Kompüter mühəndisliyinin əsasları (məşğələ)",
      "Kompüter mühəndisliyinin əsasları (lab.)",
      "Komp. müh. əsas. (müh)",
      "Komp. müh. əsas. (məş)",
      "Komp. müh. əsas. (lab)",
    ],
    aliases: ["komp müh əsas", "kompüter mühəndisliyinin əsasları"],
  },

  // Programming subjects
  {
    canonicalName: "Proqramlaşdırmanın əsasları",
    variants: [
      "Proqramlaşdırmanın əsasları",
      "Proqramlaş. əsas.",
      "Proqramlaşdırmanın əsasları (mühazirə)",
      "Proqramlaşdırmanın əsasları (məşğələ)",
      "Proqramlaşdırmanın əsasları (lab.)",
      "Proqramlaş. əsas. (müh)",
      "Proqramlaş. əsas. (məş)",
      "Proqramlaş. əsas. (lab)",
    ],
    aliases: ["proqramlaş əsas", "proqramlaşdırmanın əsasları"],
  },

  // Linear Algebra subjects
  {
    canonicalName: "Xətti cəbr və analitik həndəsə",
    variants: [
      "Xətti cəbr və analitik həndəsə",
      "Xətti cəbr və an. hən.",
      "Xətti cəbr və analitik həndəsə (mühazirə)",
      "Xətti cəbr və analitik həndəsə (məşğələ)",
      "Xətti cəbr və an. hən. (müh)",
      "Xətti cəbr və an. hən. (məş)",
    ],
    aliases: ["xətti cəbr və an hən", "xətti cəbr və analitik həndəsə"],
  },

  // Circuit Theory subjects
  {
    canonicalName: "Dövrələr nəzəriyyəsi",
    variants: [
      "Dövrələr nəzəriyyəsi",
      "Dövrələr nəzərioyyəsi",
      "Döv.nəz.",
      "Dövrələr nəzəriyyəsi (mühazirə)",
      "Dövrələr nəzəriyyəsi (məşğələ)",
      "Dövrələr nəzəriyyəsi (lab.)",
      "Döv. nəz. (müh)",
      "Döv. nəz. (məş)",
    ],
    aliases: ["döv nəz", "dövrələr nəzərioyyəsi", "dövrələr nəzəriyyəsi"],
  },

  // Azerbaijani Language subjects
  {
    canonicalName: "Azərbaycan dilində işgüzar və akademik kommunikasiya",
    variants: [
      "Azərbaycan dilində işgüzar və akademik kommunikasiya",
      "Az. dil. işg. və ak. kom.",
      "Azərbaycan dilində işgüzar və akademik kommunikasiya (mühazirə)",
      "Azərbaycan dilində işgüzar və akademik kommunikasiya (məşğələ)",
      "Az. dil. işg. və ak. kom. (müh)",
      "Az. dil. işg. və ak. kom. (məş)",
    ],
    aliases: [
      "az dil işg və ak kom",
      "azərbaycan dilində işgüzar və akademik kommunikasiya",
    ],
  },

  // Foreign Language subjects
  {
    canonicalName: "Xarici dil işgüzar və akademik kommunikasiya",
    variants: [
      "Xarici dil işgüzar və akademik kommunikasiya",
      "X/d işgüzar. və akad. kom.",
      "Xarici dil işgüzar və akademik kommunikasiya (mühazirə)",
      "Xarici dil işgüzar və akademik kommunikasiya (məşğələ)",
      "X/d işgüzar. və akad. kom. (müh)",
      "X/d işgüzar. və akad. kom. (məş)",
    ],
    aliases: [
      "x/d işgüzar və akad kom",
      "xarici dil işgüzar və akademik kommunikasiya",
    ],
  },

  // Measurement Technology subjects
  {
    canonicalName: "Ölçmə texnikasının əsasları",
    variants: [
      "Ölçmə texnikasının əsasları",
      "Ölçmə texnika. əsas.",
      "Ölçmə texnikasının əsasları (mühazirə)",
      "Ölçmə texnikasının əsasları (məşğələ)",
      "Ölçmə texnikasının əsasları (lab.)",
      "Ölçmə texnika. əsas. (müh)",
      "Ölçmə texnika. əsas. (məş)",
      "Ölçmə texnika. əsas. (lab)",
    ],
    aliases: ["ölçmə texnika əsas", "ölçmə texnikasının əsasları"],
  },

  // Data Structures subjects
  {
    canonicalName: "Verilənlər strukturu və alqoritmlər",
    variants: [
      "Verilənlər strukturu və alqoritmlər",
      "Verilən. struk. və alqoritm.",
      "Verilən. strukturu və alqor.",
      "Verilənlər strukturu və alqoritmlər (mühazirə)",
      "Verilənlər strukturu və alqoritmlər (məşğələ)",
      "Verilənlər strukturu və alqoritmlər (lab.)",
    ],
    aliases: [
      "verilən struk və alqoritm",
      "verilən strukturu və alqor",
      "verilənlər strukturu və alqoritmlər",
    ],
  },

  // Information Technology subjects
  {
    canonicalName: "İnformasiya texnologiyaları və proqramlaşdırma",
    variants: [
      "İnformasiya texnologiyaları və proqramlaşdırma",
      "İst. tex. və pr.",
      "İnformasiya texnologiyalarının əsasları",
      "İnformasiya texnolog. əsas.",
      "İnformasiya texnologiyaları və proqramlaşdırma (mühazirə)",
      "İnformasiya texnologiyaları və proqramlaşdırma (məşğələ)",
    ],
    aliases: [
      "ist tex və pr",
      "informasiya texnologiyaları və proqramlaşdırma",
      "informasiya texnolog əsas",
    ],
  },

  // Transportation subjects
  {
    canonicalName: "Nəqliyyat növü konstruksiya xüsusiyyətləri",
    variants: [
      "Nəqliyyat növü konstruksiya xüsusiyyətləri",
      "Nəql. növ. konstr. xüs.",
      "Nəqliyyat növü konstruksiya xüsusiyyətləri (mühazirə)",
      "Nəqliyyat növü konstruksiya xüsusiyyətləri (məşğələ)",
    ],
    aliases: [
      "nəql növ konstr xüs",
      "nəqliyyat növü konstruksiya xüsusiyyətləri",
    ],
  },

  // Automation subjects
  {
    canonicalName: "Avtomatlaşdırma texniki vasitələri",
    variants: [
      "Avtomatlaşdırma texniki vasitələri",
      "Avtomatlaş. texniki vasitələ.",
      "Avtomatlaşdırma texniki vasitələri (mühazirə)",
      "Avtomatlaşdırma texniki vasitələri (məşğələ)",
      "Avtomatlaşdırma texniki vasitələri (lab.)",
      "Avtomatlaş. texniki vasitələ. (müh)",
      "Avtomatlaş. texniki vasitələ. (məş)",
      "Avtomatlaş. texniki vasitələ. (lab)",
    ],
    aliases: [
      "avtomatlaş texniki vasitələ",
      "avtomatlaşdırma texniki vasitələri",
    ],
  },

  // Computer Architecture subjects
  {
    canonicalName: "Kompüter arxitekturası",
    variants: [
      "Kompüter arxitekturası",
      "K o m p ü t e r   a r x i t e k t u r a s ı", // Special case with spaces
      "Kompüter arxitekturası (mühazirə)",
      "Kompüter arxitekturası (məşğələ)",
      "Kompüter arxitekturası (lab.)",
    ],
    aliases: ["kompüter arxitekturası"],
  },

  // Multimedia Technology subjects
  {
    canonicalName: "Multimediya texnologiyaları",
    variants: [
      "Multimediya texnologiyaları",
      "Multimediya texnolog.",
      "Multimediya texnologiyaları (mühazirə)",
      "Multimediya texnologiyaları (məşğələ)",
      "Multimediya texnologiyaları (lab.)",
    ],
    aliases: ["multimediya texnolog", "multimediya texnologiyaları"],
  },

  // Electronics subjects
  {
    canonicalName: "Elektronikanın əsasları",
    variants: [
      "Elektronikanın əsasları",
      "Elektronika əsas.",
      "Elektronikanın əsasları (mühazirə)",
      "Elektronikanın əsasları (məşğələ)",
      "Elektronikanın əsasları (lab.)",
    ],
    aliases: ["elektronika əsas", "elektronikanın əsasları"],
  },

  // Operating Systems subjects
  {
    canonicalName: "Əməliyyat sistemləri",
    variants: [
      "Əməliyyat sistemləri",
      "Əməliyyat sist.",
      "Əməliyyat sistemləri (mühazirə)",
      "Əməliyyat sistemləri (məşğələ)",
      "Əməliyyat sistemləri (lab.)",
    ],
    aliases: ["əməliyyat sist", "əməliyyat sistemləri"],
  },

  // Differential Equations subjects
  {
    canonicalName: "Diferensial tənliklər",
    variants: [
      "Diferensial tənliklər",
      "D i f e r e n s i a l   t ə n l i k l ə rx", // Special case with spaces
      "Diferensial tənliklər (mühazirə)",
      "Diferensial tənliklər (məşğələ)",
    ],
    aliases: ["diferensial tənliklər"],
  },

  // Philosophy subjects
  {
    canonicalName: "Fəlsəfə",
    variants: ["Fəlsəfə", "Fəlsəfə (mühazirə)", "Fəlsəfə (məşğələ)"],
    aliases: ["fəlsəfə"],
  },

  // Applied Mathematics subjects
  {
    canonicalName: "Tətbiqi riyaziyyat",
    variants: [
      "Tətbiqi riyaziyyat",
      "Tətbiqi riyaz.",
      "Tətbiqi riyaziyyat (mühazirə)",
      "Tətbiqi riyaziyyat (məşğələ)",
    ],
    aliases: ["tətbiqi riyaz", "tətbiqi riyaziyyat"],
  },

  // Chemistry subjects
  {
    canonicalName: "Kimya",
    variants: ["Kimya", "Kimya (mühazirə)", "Kimya (məşğələ)", "Kimya (lab.)"],
    aliases: ["kimya"],
  },

  // Azerbaijan History subjects
  {
    canonicalName: "Azərbaycan tarixi",
    variants: [
      "Azərbaycan tarixi",
      "Az. tarixi",
      "Azərbaycan tarixi (mühazirə)",
      "Azərbaycan tarixi (məşğələ)",
    ],
    aliases: ["az tarixi", "azərbaycan tarixi"],
  },
];

/**
 * Normalize a subject name by removing type indicators and extra spaces
 */
export function normalizeSubjectName(subjectName: string): string {
  if (!subjectName) return "";

  return subjectName
    .trim()
    .toLowerCase()
    .replace(/\s*\([^)]*\)\s*/g, "") // Remove type indicators like (mühazirə), (məşğələ), etc.
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .replace(/\./g, "") // Remove dots
    .replace(/məş/g, "məşğələ")
    .replace(/müh/g, "mühazirə")
    .replace(/lab/g, "laboratoriya")
    .trim();
}

/**
 * Find the canonical subject name for a given subject variant
 */
export function findCanonicalSubjectName(subjectName: string): string | null {
  const normalized = normalizeSubjectName(subjectName);

  for (const mapping of GLOBAL_SUBJECT_MAPPINGS) {
    // Check if the normalized name matches any variant or alias
    const allVariants = [
      ...mapping.variants.map((v) => normalizeSubjectName(v)),
      ...mapping.aliases,
    ];

    if (allVariants.includes(normalized)) {
      return mapping.canonicalName;
    }

    // Check for partial matches (fuzzy matching)
    for (const variant of allVariants) {
      if (normalized.includes(variant) || variant.includes(normalized)) {
        return mapping.canonicalName;
      }
    }
  }

  return null;
}

/**
 * Get all variants for a canonical subject name
 */
export function getSubjectVariants(canonicalName: string): string[] {
  const mapping = GLOBAL_SUBJECT_MAPPINGS.find(
    (m) => m.canonicalName === canonicalName
  );
  return mapping ? mapping.variants : [];
}

/**
 * Check if two subject names refer to the same subject
 */
export function areSubjectsEquivalent(
  subject1: string,
  subject2: string
): boolean {
  const canonical1 = findCanonicalSubjectName(subject1);
  const canonical2 = findCanonicalSubjectName(subject2);

  if (!canonical1 || !canonical2) {
    return false;
  }

  return canonical1 === canonical2;
}

/**
 * Get all canonical subject names
 */
export function getAllCanonicalSubjects(): string[] {
  return GLOBAL_SUBJECT_MAPPINGS.map((mapping) => mapping.canonicalName);
}

/**
 * Add a new subject mapping (for future universities)
 */
export function addSubjectMapping(mapping: SubjectMapping): void {
  // Check if canonical name already exists
  const existingIndex = GLOBAL_SUBJECT_MAPPINGS.findIndex(
    (m) => m.canonicalName === mapping.canonicalName
  );

  if (existingIndex >= 0) {
    // Merge with existing mapping
    const existing = GLOBAL_SUBJECT_MAPPINGS[existingIndex];
    existing.variants = [
      ...new Set([...existing.variants, ...mapping.variants]),
    ];
    existing.aliases = [...new Set([...existing.aliases, ...mapping.aliases])];
  } else {
    // Add new mapping
    GLOBAL_SUBJECT_MAPPINGS.push(mapping);
  }
}

/**
 * University-specific configuration (for future use)
 */
export const UNIVERSITY_CONFIGS: UniversitySubjectConfig[] = [
  {
    universityId: 11, // Sumqayıt Dövlət Universiteti
    universityName: "Sumqayıt Dövlət Universiteti",
    subjectMappings: GLOBAL_SUBJECT_MAPPINGS, // Currently using global mappings
  },
  // Add more universities here as they are added
];

/**
 * Get subject mappings for a specific university
 */
export function getUniversitySubjectMappings(
  universityId: number
): SubjectMapping[] {
  const config = UNIVERSITY_CONFIGS.find(
    (c) => c.universityId === universityId
  );
  return config ? config.subjectMappings : GLOBAL_SUBJECT_MAPPINGS;
}
