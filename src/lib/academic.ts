export interface SectionOption {
  id: number;
  value: string;
  label: string;
  accountCount?: number;
}

export interface BranchOption {
  id: number;
  value: string;
  label: string;
  accountCount?: number;
  sections: SectionOption[];
}

export interface YearOption {
  id: number;
  value: string;
  label: string;
  accountCount?: number;
}

export interface CourseOption {
  id: number;
  value: string;
  label: string;
  accountCount?: number;
  branches: BranchOption[];
  years: YearOption[];
}

type AcademicIdentity = {
  course?: string | null;
  branch?: string | null;
  section?: string | null;
  year?: string | null;
};

export function formatAcademicValue(kind: "course" | "branch" | "section" | "year", value?: string | null) {
  if (!value) return "Not set";

  if (kind === "course") {
    if (value === "bsc") return "B.Sc.";
    if (value === "btech-eng") return "Engineering";
    return value.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  }

  if (kind === "year") return value;
  return value.toUpperCase();
}

export function formatAcademicSummary(identity: AcademicIdentity) {
  const parts = [
    identity.course ? formatAcademicValue("course", identity.course) : "",
    identity.branch ? formatAcademicValue("branch", identity.branch) : "",
    identity.section ? formatAcademicValue("section", identity.section) : "",
    identity.year ? formatAcademicValue("year", identity.year) : "",
  ].filter(Boolean);

  return parts.join(" • ");
}
