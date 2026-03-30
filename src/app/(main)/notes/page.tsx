
"use client";

import { useState, useEffect, createRef, RefObject, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Upload, FileText, Download, Share2, MoreVertical, Trash2, HardDrive, Clock, Eye, Plus, Trash, X, SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { useMainLayout } from "../layout";
import type { Note, Chat } from "@/lib/mock-data";
import ShareDialog from "@/components/app/share-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { NoteCardSkeleton } from "@/components/app/skeletons";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { formatAcademicSummary, formatAcademicValue } from "@/lib/academic";

interface SectionOptionT { id: number; value: string; label: string; accountCount?: number; }
interface BranchOptionT { id: number; value: string; label: string; accountCount?: number; sections: SectionOptionT[]; }
interface YearOptionT { id: number; value: string; label: string; accountCount?: number; }
interface CourseOptionT { id: number; value: string; label: string; accountCount?: number; branches: BranchOptionT[]; years: YearOptionT[]; }
type NoteVisibility = "class_only" | "view_all";


function AddNoteDialog({
    onAddNote,
    subjectOptions,
    options,
}: {
    onAddNote: (note: Omit<Note, 'id' | 'authorId' | 'author' | 'date' | 'fileSize'> & { file: File; visibility: NoteVisibility }) => Promise<void>;
    subjectOptions: string[];
    options: CourseOptionT[];
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [course, setCourse] = useState('');
    const [branch, setBranch] = useState('');
    const [section, setSection] = useState('');
    const [year, setYear] = useState('');
    const [subject, setSubject] = useState('');
    const [visibility, setVisibility] = useState<NoteVisibility>("class_only");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const courseObj = useMemo(() => options.find((c) => c.value === course), [options, course]);
    const branchObj = useMemo(() => courseObj?.branches.find((b) => b.value === branch), [courseObj, branch]);
    const sectionOptions = branchObj?.sections ?? [];
    const yearOptions = courseObj?.years ?? [];

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!selectedFile || !title || !description || !course || !branch || !year || !subject) {
            toast({
                title: "Missing fields",
                description: "Please fill out all the fields and select a file.",
                variant: "destructive",
            });
            return;
        }

        if (visibility === "class_only" && !section) {
            toast({
                title: "Section required",
                description: "Choose a section for class-only notes.",
                variant: "destructive",
            });
            return;
        }

        try {
            setIsSubmitting(true);
            await onAddNote({
                title,
                description,
                course: course as Note['course'],
                branch,
                section,
                year,
                subject,
                visibility,
                file: selectedFile,
                fileName: selectedFile.name,
                fileUrl: URL.createObjectURL(selectedFile),
            });
        } finally {
            setIsSubmitting(false);
        }

        // Reset form
        setIsOpen(false);
        setTitle('');
        setDescription('');
        setCourse('');
        setBranch('');
        setSection('');
        setYear('');
        setSubject('');
        setVisibility("class_only");
        setSelectedFile(null);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                 <Button variant="glow" className="flex-shrink-0">
                    <Upload className="mr-2 h-4 w-4" /> Upload Note
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg p-0 flex flex-col h-[85vh] max-h-[85vh] overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
                    <DialogTitle>Upload a New Note</DialogTitle>
                    <DialogDescription>
                        Fill in the details below to share your note with others.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-4">
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>File</Label>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileSelect}
                            accept=".pdf,.txt,.html,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                        />
                         <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                                <FileText className="mr-2 h-4 w-4" />
                                Select File
                            </Button>
                            {selectedFile && <span className="text-sm text-muted-foreground">{selectedFile.name}</span>}
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <div className="animated-border-input">
                            <Input id="title" placeholder="e.g., Intro to Quantum Physics" value={title} onChange={e => setTitle(e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <div className="animated-border-input">
                            <Textarea id="description" placeholder="A brief summary of the note's content." value={description} onChange={e => setDescription(e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Visibility</Label>
                        <div className="animated-border-input">
                            <Select onValueChange={(value) => setVisibility(value as NoteVisibility)} value={visibility}>
                                <SelectTrigger><SelectValue placeholder="Visibility" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="class_only">Class only</SelectItem>
                                    <SelectItem value="view_all">View all</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {visibility === "class_only"
                                ? "Only this course, branch, section, and year will see the note."
                                : "Everyone can view this note in the library feed."}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label>Course</Label>
                            <div className="animated-border-input">
                                <Select onValueChange={(val) => { setCourse(val); setBranch(''); setSection(''); setYear(''); }} value={course}>
                                    <SelectTrigger><SelectValue placeholder="Course" /></SelectTrigger>
                                    <SelectContent>
                                        {options.map((c) => (
                                            <SelectItem key={c.id} value={c.value}>{c.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label>Branch</Label>
                             <div className="animated-border-input">
                                <Select onValueChange={(val) => { setBranch(val); setSection(''); setYear(''); }} value={branch} disabled={!course}>
                                    <SelectTrigger><SelectValue placeholder="Branch" /></SelectTrigger>
                                    <SelectContent>
                                        {(courseObj?.branches ?? []).map(branch => (
                                            <SelectItem key={branch.id} value={branch.value}>{branch.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Section</Label>
                            <div className="animated-border-input">
                                <Select onValueChange={setSection} value={section} disabled={!branch}>
                                    <SelectTrigger><SelectValue placeholder="Section" /></SelectTrigger>
                                    <SelectContent>
                                        {sectionOptions.map(sec => (
                                            <SelectItem key={sec.id} value={sec.value}>{sec.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Year</Label>
                            <div className="animated-border-input">
                                <Select onValueChange={(value) => setYear(value)} value={year} disabled={!course || !branch}>
                                    <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                                    <SelectContent>
                                        {yearOptions.map(y => (
                                            <SelectItem key={y.id} value={y.value}>{y.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Subject</Label>
                            <div className="animated-border-input">
                                <Input
                                    list="note-subject-options"
                                    placeholder="Subject"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    disabled={!year}
                                />
                                <datalist id="note-subject-options">
                                    {subjectOptions.map((option) => (
                                        <option key={option} value={option} />
                                    ))}
                                </datalist>
                            </div>
                        </div>
                    </div>
                </div>
                </div>
                <DialogFooter className="px-6 py-4 border-t bg-background flex-shrink-0">
                    <Button variant="secondary" onClick={() => setIsOpen(false)} disabled={isSubmitting}>Cancel</Button>
                    <Button variant="glow" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? "Uploading..." : "Upload Note"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [sharingNote, setSharingNote] = useState<Note | null>(null);
  const { chats, setChats, currentUser } = useMainLayout();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const normalizedRole = currentUser?.role?.toLowerCase?.() ?? "";
  const isStudent = normalizedRole === "student";
  const isFaculty = normalizedRole !== "student";
  const academicSummary = formatAcademicSummary(currentUser);
  const hasStudentAcademicProfile = Boolean(
    currentUser?.course && currentUser?.branch && currentUser?.section && currentUser?.year
  );

  // Filters
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const noteRefs = useRef<Record<number, RefObject<HTMLDivElement>>>({});

  useEffect(() => {
    notes.forEach((note) => {
      if (!noteRefs.current[note.id]) {
        noteRefs.current[note.id] = createRef<HTMLDivElement>();
      }
    });
  }, [notes]);

  useEffect(() => {
    const fetchNotes = async () => {
        if (!currentUser?.id) {
            setNotes([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            params.set("userId", currentUser.id);
            if (!isStudent && selectedCourse) params.set("course", selectedCourse);
            if (!isStudent && selectedBranch) params.set("branch", selectedBranch);
            if (!isStudent && selectedSection) params.set("section", selectedSection);
            if (!isStudent && selectedYear) params.set("year", selectedYear);
            if (selectedSubject) params.set("subject", selectedSubject);

            const res = await fetch(`/api/notes?${params.toString()}`);
            const data = (await res.json()) as { notes?: Note[]; error?: string };
            if (!res.ok || !data?.notes) {
                throw new Error(data?.error || "Failed to load notes");
            }
            setNotes(data.notes);
        } catch (err) {
            console.error("Load notes error:", err);
            toast({
                title: "Could not load notes",
                description: "Please try again in a moment.",
                variant: "destructive",
            });
            setNotes([]);
        } finally {
            setIsLoading(false);
        }
    };

    void fetchNotes();
  }, [currentUser?.id, isStudent, selectedCourse, selectedBranch, selectedSection, selectedYear, selectedSubject, toast]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#note-')) {
        const noteId = hash.replace('#note-', '');
        const noteRef = noteRefs.current[Number(noteId)];

        if (noteRef?.current) {
          setTimeout(() => {
            noteRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            noteRef.current?.classList.add('animate-highlight');
            setTimeout(() => {
              noteRef.current?.classList.remove('animate-highlight');
            }, 2000);
          }, 100);
        }
      }
    };

    handleHashChange();
    
    window.addEventListener('hashchange', handleHashChange);

    return () => {
        window.removeEventListener('hashchange', handleHashChange);
    };
  }, [noteRefs, notes]);

  const handleShareClick = (note: Note) => {
    setSharingNote(note);
  };
  
  const handleDownload = async (note: Note) => {
    try {
      const response = await fetch(note.fileUrl);
      if (!response.ok) throw new Error('Network response was not ok.');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Use note title for the download name
      const fileExtension = note.fileName.split('.').pop() || 'pdf';
      const cleanTitle = note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.download = `${cleanTitle}.${fileExtension}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({
        title: "Download Started",
        description: `Downloading "${note.title}".`,
      });
    } catch (error) {
      console.error("Download failed:", error);
      toast({
        title: "Download Failed",
        description: "Could not download the file.",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteNote = async (noteId: number) => {
    try {
      const res = await fetch(
        `/api/notes?id=${encodeURIComponent(String(noteId))}&userId=${encodeURIComponent(currentUser.id)}`,
        { method: "DELETE" }
      );
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Delete failed");
      }
      setNotes((prev) => prev.filter((note) => note.id !== noteId));
      toast({
        title: "Note Deleted",
        description: "The note has been successfully removed.",
      });
    } catch (err: any) {
      console.error("Delete note error:", err);
      toast({
        title: "Delete failed",
        description: String(err?.message || err),
        variant: "destructive",
      });
    }
  };

  const handleSendNote = async (note: Note, selectedChatIds: string[]) => {
    try {
      const results = await Promise.allSettled(
        selectedChatIds.map(async (chatId) => {
          const res = await fetch(`/api/chats/${encodeURIComponent(chatId)}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: currentUser.id, sharedNote: note }),
          });
          const data = (await res.json()) as { message?: any; error?: string };
          if (!res.ok || !data?.message) {
            throw new Error(data?.error || "Failed to share note");
          }
          return { chatId, message: data.message };
        })
      );

      const successes = results
        .filter((r): r is PromiseFulfilledResult<{ chatId: string; message: any }> => r.status === "fulfilled")
        .map((r) => r.value);

      if (successes.length === 0) {
        throw new Error("Could not share the note.");
      }

      setChats((prevChats: Chat[]) =>
        prevChats.map((chat) => {
          const match = successes.find((r) => r.chatId === chat.id);
          return match ? { ...chat, messages: [...chat.messages, match.message] } : chat;
        })
      );

      const failedCount = results.length - successes.length;
      setSharingNote(null);
      toast({
        title: "Note Sent!",
        description:
          failedCount > 0
            ? `Shared to ${successes.length} chats. ${failedCount} failed.`
            : "Your note has been shared with the selected contacts.",
        duration: 3000,
      });
    } catch (err: any) {
      console.error("Share note error:", err);
      toast({
        title: "Could not share",
        description: String(err?.message || err),
        variant: "destructive",
      });
    }
  };
  
  const handleAddNote = async (newNoteData: Omit<Note, 'id' | 'authorId' | 'author' | 'date' | 'fileSize'> & { file: File; visibility: NoteVisibility }) => {
    try {
      const fd = new FormData();
      fd.append("file", newNoteData.file);
      fd.append("userId", currentUser.id);
      fd.append("title", newNoteData.title);
      fd.append("description", newNoteData.description);
      fd.append("course", newNoteData.course);
      fd.append("branch", newNoteData.branch);
      if (newNoteData.section) fd.append("section", newNoteData.section);
      fd.append("year", newNoteData.year);
      fd.append("subject", newNoteData.subject);
      fd.append("visibility", newNoteData.visibility);

      const res = await fetch("/api/notes", { method: "POST", body: fd });
      const data = (await res.json()) as { note?: Note; error?: string };
      if (!res.ok || !data?.note) {
        throw new Error(data?.error || "Upload failed");
      }

      setNotes((prev) => [data.note, ...prev]);
      toast({
        title: "Note Uploaded!",
        description: "Your note has been successfully added.",
      });
    } catch (err: any) {
      console.error("Upload note error:", err);
      toast({
        title: "Upload failed",
        description: String(err?.message || err),
        variant: "destructive",
      });
      throw err;
    }
  };

  const clearFilters = () => {
    setSelectedCourse("");
    setSelectedBranch("");
    setSelectedSection("");
    setSelectedYear("");
    setSelectedSubject("");
  }

  const subjectOptions = useMemo(
    () =>
      Array.from(
        new Set(
          notes
            .filter((note) => selectedCourse ? note.course === selectedCourse : true)
            .filter((note) => selectedBranch ? note.branch === selectedBranch : true)
            .filter((note) => selectedSection ? note.section === selectedSection : true)
            .map((note) => note.subject)
        )
      ),
    [notes, selectedCourse, selectedBranch, selectedSection]
  );

  // Academic options (shared with schedule)
  const [options, setOptions] = useState<CourseOptionT[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [mobileFacultyFiltersOpen, setMobileFacultyFiltersOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({ value: "", label: "" });
  const [newBranch, setNewBranch] = useState({ courseValue: "", value: "", label: "" });
  const [newSection, setNewSection] = useState({ courseValue: "", branchValue: "", value: "", label: "" });
  const [newYear, setNewYear] = useState({ courseValue: "", value: "", label: "" });
  const [focusedBranchByCourse, setFocusedBranchByCourse] = useState<Record<number, number | null>>({});
  const [pendingDelete, setPendingDelete] = useState<{
    type: "course" | "branch" | "section" | "year";
    id: number;
    label: string;
    accountCount: number;
  } | null>(null);

  const currentCourse = useMemo(() => options.find((c) => c.value === selectedCourse), [options, selectedCourse]);
  const currentBranch = useMemo(() => currentCourse?.branches.find((b) => b.value === selectedBranch), [currentCourse, selectedBranch]);
  const currentSections = currentBranch?.sections ?? [];
  const currentYears = currentCourse?.years ?? [];
  const facultyFilterControls = (
    <>
      <div className="animated-border-input flex-1">
        <Select
          onValueChange={(value) => { setSelectedCourse(value); setSelectedBranch(''); setSelectedSection(''); setSelectedYear(''); setSelectedSubject(''); }}
          value={selectedCourse}
        >
          <SelectTrigger><SelectValue placeholder={optionsLoading ? "Loading..." : "Course"} /></SelectTrigger>
          <SelectContent>
            {options.map((c) => (
              <SelectItem key={c.id} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="animated-border-input flex-1">
        <Select
          onValueChange={(value) => { setSelectedBranch(value); setSelectedSection(''); setSelectedYear(''); setSelectedSubject(''); }}
          value={selectedBranch}
          disabled={!selectedCourse}
        >
          <SelectTrigger><SelectValue placeholder="Branch" /></SelectTrigger>
          <SelectContent>
            {(currentCourse?.branches ?? []).map(branch => (
              <SelectItem key={branch.id} value={branch.value}>{branch.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="animated-border-input flex-1">
        <Select
          onValueChange={(value) => setSelectedSection(value)}
          value={selectedSection}
          disabled={!selectedBranch}
        >
          <SelectTrigger><SelectValue placeholder="Section" /></SelectTrigger>
          <SelectContent>
            {currentSections.map(sec => (
              <SelectItem key={sec.id} value={sec.value}>{sec.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="animated-border-input flex-1">
        <Select
          onValueChange={(value) => { setSelectedYear(value); setSelectedSubject(''); }}
          value={selectedYear}
          disabled={!selectedCourse || !selectedBranch}
        >
          <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
          <SelectContent>
            {currentYears.map(year => (
              <SelectItem key={year.id} value={year.value}>{year.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="animated-border-input flex-1">
        <Select
          onValueChange={setSelectedSubject}
          value={selectedSubject}
          disabled={!selectedYear}
        >
          <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
          <SelectContent>
            {subjectOptions.map(subject => (
              <SelectItem key={subject} value={subject}>{subject}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );

  const fetchOptions = async () => {
    setOptionsLoading(true);
    try {
      const res = await fetch("/api/academic-options");
      const data = (await res.json()) as { courses: CourseOptionT[] };
      if (!res.ok) throw new Error("Failed to load options");
      setOptions(data.courses || []);
    } catch (err) {
      console.error("Load options failed", err);
      toast({ title: "Could not load options", variant: "destructive" });
    } finally {
      setOptionsLoading(false);
    }
  };

  const addOption = async (payload: any) => {
    const res = await fetch("/api/academic-options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, userId: currentUser.id }),
    });
    if (!res.ok) throw new Error((await res.json())?.error || "Add failed");
  };

  const deleteOption = async (type: string, id: number) => {
    const res = await fetch(`/api/academic-options?type=${type}&id=${id}&userId=${currentUser.id}`, { method: "DELETE" });
    if (!res.ok) throw new Error((await res.json())?.error || "Delete failed");
  };

  const handleAddCourse = async () => {
    if (!newCourse.value || !newCourse.label) return;
    await addOption({ type: "course", ...newCourse });
    setNewCourse({ value: "", label: "" });
    await fetchOptions();
    window.dispatchEvent(new Event("academic-options-changed"));
  };
  const handleAddBranch = async () => {
    if (!newBranch.courseValue || !newBranch.value || !newBranch.label) return;
    await addOption({ type: "branch", ...newBranch });
    setNewBranch({ courseValue: "", value: "", label: "" });
    await fetchOptions();
    window.dispatchEvent(new Event("academic-options-changed"));
  };
  const handleAddSection = async () => {
    if (!newSection.courseValue || !newSection.branchValue || !newSection.value || !newSection.label) return;
    await addOption({ type: "section", ...newSection });
    setNewSection({ courseValue: "", branchValue: "", value: "", label: "" });
    await fetchOptions();
    window.dispatchEvent(new Event("academic-options-changed"));
  };
  const handleAddYear = async () => {
    if (!newYear.courseValue || !newYear.value || !newYear.label) return;
    await addOption({ type: "year", ...newYear });
    setNewYear({ courseValue: "", value: "", label: "" });
    await fetchOptions();
    window.dispatchEvent(new Event("academic-options-changed"));
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    await deleteOption(pendingDelete.type, pendingDelete.id);
    setPendingDelete(null);
    await fetchOptions();
    window.dispatchEvent(new Event("academic-options-changed"));
  };

  useEffect(() => {
    void fetchOptions();
    const handleOptionsChanged = () => { void fetchOptions(); };
    window.addEventListener("academic-options-changed", handleOptionsChanged);
    return () => window.removeEventListener("academic-options-changed", handleOptionsChanged);
  }, []);

  const filteredNotes = notes.filter(note => {
    const searchTermMatch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            note.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            note.author.toLowerCase().includes(searchTerm.toLowerCase());
    
    return (
      searchTermMatch &&
      (!isStudent && selectedCourse ? note.course === selectedCourse : true) &&
      (!isStudent && selectedBranch ? note.branch === selectedBranch : true) &&
      (!isStudent && selectedSection ? note.section === selectedSection : true) &&
      (!isStudent && selectedYear ? note.year === selectedYear : true) &&
      (selectedSubject ? note.subject === selectedSubject : true)
    );
  });
  
  const isAnyFilterActive = isStudent
    ? Boolean(selectedSubject)
    : Boolean(selectedCourse || selectedBranch || selectedSection || selectedYear || selectedSubject);
  const studentInfoCard = (
    <div className="rounded-xl border bg-secondary/30 p-4">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold">Your Academic Profile</p>
        <p className="text-sm text-muted-foreground">
          {academicSummary || "Academic profile pending"}
        </p>
        <p className="text-xs text-muted-foreground">
          You will see notes for your class plus any notes marked view all.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-4">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Course</Label>
          <div className="rounded-md border bg-background px-3 py-2 text-sm">
            {formatAcademicValue("course", currentUser.course)}
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Branch</Label>
          <div className="rounded-md border bg-background px-3 py-2 text-sm">
            {formatAcademicValue("branch", currentUser.branch)}
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Section</Label>
          <div className="rounded-md border bg-background px-3 py-2 text-sm">
            {formatAcademicValue("section", currentUser.section)}
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Year / Semester</Label>
          <div className="rounded-md border bg-background px-3 py-2 text-sm">
            {formatAcademicValue("year", currentUser.year)}
          </div>
        </div>
      </div>
    </div>
  );

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notes Repository</h1>
          <p className="text-muted-foreground">
            {isStudent
              ? "Your class notes appear automatically, along with library notes shared with everyone."
              : "Find and share notes from across the college."}
          </p>
        </div>

        {isStudent && studentInfoCard}
        
        <div className="flex flex-col gap-2 w-full">
          <div className="relative flex-1 animated-border-input">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground z-10" />
            <Input 
                placeholder="Search by title, description, or author..." 
                className="pl-8" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {isStudent ? (
            <div className="flex flex-col md:flex-row gap-2">
              <div className="animated-border-input md:max-w-xs">
                <Select onValueChange={setSelectedSubject} value={selectedSubject}>
                  <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
                  <SelectContent>
                    {subjectOptions.map(subject => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                className="md:hidden justify-between"
                onClick={() => setMobileFacultyFiltersOpen((open) => !open)}
              >
                <span className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Note filters
                </span>
                {mobileFacultyFiltersOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>

              <div
                className={cn(
                  "gap-2",
                  mobileFacultyFiltersOpen ? "flex flex-col" : "hidden",
                  "md:flex md:flex-row"
                )}
              >
                {facultyFilterControls}
              </div>
            </>
          )}

          <div className="flex flex-col md:flex-row gap-2">
            <Button variant="outline" onClick={clearFilters} disabled={!isAnyFilterActive}>
              <X className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
            {isFaculty && (
              <Button variant="outline" onClick={() => setManageOpen(true)} disabled={optionsLoading}>
                <Plus className="mr-2 h-4 w-4" /> Manage options
              </Button>
            )}
            <div className="flex-1" />
            {isFaculty && (
              <AddNoteDialog onAddNote={handleAddNote} subjectOptions={subjectOptions} options={options} />
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => <NoteCardSkeleton key={index} />)
        ) : filteredNotes.length > 0 ? (
            filteredNotes.map((note) => {
            const isOwner = note.authorId === currentUser.id;
            const noteScope = formatAcademicSummary(note);
            return (
                <Card key={note.id} ref={noteRefs.current[note.id]} id={`note-${note.id}`} className="animated-border-card flex flex-col">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-secondary rounded-lg">
                            <FileText className="h-6 w-6 text-secondary-foreground" />
                            </div>
                            <div className="flex-1">
                            <CardTitle className="text-lg leading-snug">
                                {note.title}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                by {note.author}
                            </p>
                            <div className="pt-2 flex flex-wrap gap-2">
                              <Badge variant={note.visibility === "view_all" ? "secondary" : "outline"}>
                                {note.visibility === "view_all" ? "View all" : "Class only"}
                              </Badge>
                              {noteScope ? (
                                <Badge variant="outline" className="font-normal">
                                  {noteScope}
                                </Badge>
                              ) : null}
                            </div>
                            </div>
                        </div>
                        {isOwner && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 -mt-2 -mr-2">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem className="text-red-500" onClick={() => handleDeleteNote(note.id)}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                    <CardDescription>{note.description}</CardDescription>
                    <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
                    <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3"/>
                        <span>{formatDistanceToNow(new Date(note.date), { addSuffix: true })}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <HardDrive className="h-3 w-3" />
                        <span>{note.fileSize}</span>
                    </div>
                    </div>
                </CardContent>
                <CardFooter className="flex items-center gap-2">
                    <Button variant="glow" className="flex-1" asChild>
                        <a href={note.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                        </a>
                    </Button>
                    <Button variant="glow" className="flex-1" onClick={() => handleDownload(note)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                    </Button>
                    <Button variant="outline" size="icon" className="flex-shrink-0" onClick={() => handleShareClick(note)}>
                        <Share2 className="h-4 w-4" />
                    </Button>
                </CardFooter>
                </Card>
            )
            })
        ) : (
          <div className="col-span-full rounded-xl border border-dashed p-10 text-center text-muted-foreground">
            {isStudent && !hasStudentAcademicProfile
              ? "Your academic profile is incomplete. Ask a teacher to update it."
              : isStudent
                ? "No notes are available for your class yet. View-all library notes will also appear here."
                : "No notes match the selected filters yet."}
          </div>
        )}
      </div>
      {/* Manage options dialog (faculty) */}
      <Dialog
        open={manageOpen}
        onOpenChange={(open) => {
          setManageOpen(open);
          if (!open) {
            setFocusedBranchByCourse({});
            setPendingDelete(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Manage courses, branches, sections, years</DialogTitle>
            <DialogDescription>Only faculty can add or remove options.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-2">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>New course</Label>
                  <div className="flex gap-2">
                    <Input placeholder="value (e.g., mba)" value={newCourse.value} onChange={(e) => setNewCourse((v) => ({ ...v, value: e.target.value }))} />
                    <Input placeholder="label" value={newCourse.label} onChange={(e) => setNewCourse((v) => ({ ...v, label: e.target.value }))} />
                    <Button onClick={handleAddCourse}>Add</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>New year</Label>
                  <div className="flex gap-2 flex-wrap">
                    <Select value={newYear.courseValue} onValueChange={(val) => setNewYear((v) => ({ ...v, courseValue: val }))}>
                      <SelectTrigger className="w-32"><SelectValue placeholder="Course" /></SelectTrigger>
                      <SelectContent>
                        {options.map((c) => (
                          <SelectItem key={c.id} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input placeholder="value (e.g., 1-1)" value={newYear.value} onChange={(e) => setNewYear((v) => ({ ...v, value: e.target.value }))} />
                    <Input placeholder="label" value={newYear.label} onChange={(e) => setNewYear((v) => ({ ...v, label: e.target.value }))} />
                    <Button onClick={handleAddYear}>Add</Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>New branch</Label>
                  <div className="flex gap-2 flex-wrap">
                    <Select value={newBranch.courseValue} onValueChange={(val) => setNewBranch((v) => ({ ...v, courseValue: val }))}>
                      <SelectTrigger className="w-32"><SelectValue placeholder="Course" /></SelectTrigger>
                      <SelectContent>
                        {options.map((c) => (
                          <SelectItem key={c.id} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input placeholder="value (e.g., ai)" value={newBranch.value} onChange={(e) => setNewBranch((v) => ({ ...v, value: e.target.value }))} />
                    <Input placeholder="label" value={newBranch.label} onChange={(e) => setNewBranch((v) => ({ ...v, label: e.target.value }))} />
                    <Button onClick={handleAddBranch}>Add</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>New section</Label>
                  <div className="flex gap-2 flex-wrap">
                    <Select value={newSection.courseValue} onValueChange={(val) => setNewSection((v) => ({ ...v, courseValue: val, branchValue: "" }))}>
                      <SelectTrigger className="w-32"><SelectValue placeholder="Course" /></SelectTrigger>
                      <SelectContent>
                        {options.map((c) => (
                          <SelectItem key={c.id} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={newSection.branchValue} onValueChange={(val) => setNewSection((v) => ({ ...v, branchValue: val }))} disabled={!newSection.courseValue}>
                      <SelectTrigger className="w-32"><SelectValue placeholder="Branch" /></SelectTrigger>
                      <SelectContent>
                        {options.find((c) => c.value === newSection.courseValue)?.branches.map((b) => (
                          <SelectItem key={b.id} value={b.value}>{b.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input placeholder="value (e.g., cs6)" value={newSection.value} onChange={(e) => setNewSection((v) => ({ ...v, value: e.target.value }))} />
                    <Input placeholder="label" value={newSection.label} onChange={(e) => setNewSection((v) => ({ ...v, label: e.target.value }))} />
                    <Button onClick={handleAddSection}>Add</Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Existing options</Label>
                <div className="space-y-3">
                  {options.map((c) => {
                    const focusedBranchId = focusedBranchByCourse[c.id] ?? null;
                    const visibleBranches = focusedBranchId
                      ? c.branches.filter((branch) => branch.id === focusedBranchId)
                      : c.branches;
                    const visibleSections = visibleBranches.flatMap((branch) =>
                      branch.sections.map((section) => ({
                        ...section,
                        branchId: branch.id,
                        branchLabel: branch.label,
                      }))
                    );

                    return (
                    <div key={c.id} className="rounded-md border p-3 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-semibold">{c.label} ({c.value})</div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPendingDelete({ type: "course", id: c.id, label: c.label, accountCount: c.accountCount ?? 0 })}
                        >
                          <Trash className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                      <div className="text-sm text-muted-foreground">Branches</div>
                      <div className="flex flex-wrap gap-2">
                        {c.branches.map((b) => (
                          <div
                            key={b.id}
                            className={cn(
                              "inline-flex items-center overflow-hidden rounded-md border bg-background",
                              focusedBranchId === b.id && "border-primary ring-1 ring-primary/30"
                            )}
                          >
                            <button
                              type="button"
                              className="px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                              onClick={() =>
                                setFocusedBranchByCourse((prev) => ({
                                  ...prev,
                                  [c.id]: prev[c.id] === b.id ? null : b.id,
                                }))
                              }
                            >
                              {b.label}
                            </button>
                            <div className="h-4 w-px bg-border" />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-none text-red-500 hover:text-red-600"
                              onClick={() => setPendingDelete({ type: "branch", id: b.id, label: b.label, accountCount: b.accountCount ?? 0 })}
                            >
                              <Trash className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      {focusedBranchId && (
                        <p className="text-xs text-muted-foreground">
                          Showing sections for{" "}
                          <span className="font-medium text-foreground">
                            {visibleBranches[0]?.label}
                          </span>
                          . Click the branch again to show all sections.
                        </p>
                      )}
                      <div className="text-sm text-muted-foreground">Sections</div>
                      <div className="flex flex-wrap gap-2">
                        {visibleSections.map((s) => (
                          <div
                            key={`${s.branchId}-${s.id}`}
                            className="inline-flex items-center overflow-hidden rounded-md border bg-background"
                          >
                            <div className="px-3 py-2 text-sm">
                              {s.label} ({s.branchLabel})
                            </div>
                            <div className="h-4 w-px bg-border" />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-none text-red-500 hover:text-red-600"
                              onClick={() =>
                                setPendingDelete({
                                  type: "section",
                                  id: s.id,
                                  label: `${s.label} (${s.branchLabel})`,
                                  accountCount: s.accountCount ?? 0,
                                })
                              }
                            >
                              <Trash className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                        {!visibleSections.length && (
                          <p className="text-sm text-muted-foreground">No sections found for this branch yet.</p>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">Years</div>
                      <div className="flex flex-wrap gap-2">
                        {c.years.map((y) => (
                          <div
                            key={y.id}
                            className="inline-flex items-center overflow-hidden rounded-md border bg-background"
                          >
                            <div className="px-3 py-2 text-sm">{y.label}</div>
                            <div className="h-4 w-px bg-border" />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-none text-red-500 hover:text-red-600"
                              onClick={() => setPendingDelete({ type: "year", id: y.id, label: y.label, accountCount: y.accountCount ?? 0 })}
                            >
                              <Trash className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                    );
                  })}
                  {!options.length && (
                    <p className="text-sm text-muted-foreground">Loading or no options yet.</p>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setManageOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this option?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete ? (
                <>
                  You are about to permanently remove{" "}
                  <span className="font-medium text-foreground">{pendingDelete.label}</span>.
                  {" "}This option is currently linked to{" "}
                  <span className="font-medium text-foreground">
                    {pendingDelete.accountCount}
                  </span>{" "}
                  registered account{pendingDelete.accountCount === 1 ? "" : "s"}. This action
                  cannot be undone.
                </>
              ) : (
                "This action cannot be undone."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 text-white hover:bg-red-600"
              onClick={() => void handleConfirmDelete()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

       {sharingNote && (
         <ShareDialog
            content={sharingNote}
            chats={chats}
            currentUser={currentUser}
            onClose={() => setSharingNote(null)}
            onSend={handleSendNote}
            dialogTitle="Share Note"
            dialogDescription="Select the contacts you want to share this note with."
        />
      )}
    </div>
  );
}
