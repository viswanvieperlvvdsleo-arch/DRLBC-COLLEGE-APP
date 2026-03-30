
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Upload, File, MoreVertical, Trash2, Share2, Loader2, Plus, Trash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
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
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useMainLayout } from "../layout";
import ShareDialog from "@/components/app/share-dialog";
import { formatAcademicSummary, formatAcademicValue } from "@/lib/academic";


type UploadCategory = "timetable" | "attendance" | "results" | "";

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  fileType?: string;
  isImage: boolean;
  category: UploadCategory;
  course: string;
  branch: string;
  year: string;
  section: string | null;
  uploaderId: string;
}

interface SectionOptionT {
  id: number;
  value: string;
  label: string;
  accountCount?: number;
}
interface BranchOptionT {
  id: number;
  value: string;
  label: string;
  accountCount?: number;
  sections: SectionOptionT[];
}
interface YearOptionT {
  id: number;
  value: string;
  label: string;
  accountCount?: number;
}
interface CourseOptionT {
  id: number;
  value: string;
  label: string;
  accountCount?: number;
  branches: BranchOptionT[];
  years: YearOptionT[];
}

export default function SchedulePage() {
  const { currentUser, chats, setChats } = useMainLayout();
  const normalizedRole = currentUser?.role?.toLowerCase?.() ?? "";
  const isStudent = normalizedRole === "student";
  // Filters
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [activeTab, setActiveTab] = useState<UploadCategory>("timetable");

  // Upload Dialog State
  const [isUploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // State for upload form inside dialog
  const [uploadCategory, setUploadCategory] = useState<UploadCategory>("");
  const [uploadCourse, setUploadCourse] = useState("");
  const [uploadBranch, setUploadBranch] = useState("");
  const [uploadSection, setUploadSection] = useState("");
  const [uploadYear, setUploadYear] = useState("");
  const [displayedFile, setDisplayedFile] = useState<UploadedFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [sharingFile, setSharingFile] = useState<UploadedFile | null>(null);

  // Options
  const [options, setOptions] = useState<CourseOptionT[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
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
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setUploadDialogOpen(true);
      // Reset form
      setUploadCategory("");
      setUploadCourse("");
      setUploadBranch("");
      setUploadSection("");
      setUploadYear("");
    }
  };

  const currentCourse = useMemo(() => options.find((c) => c.value === selectedCourse), [options, selectedCourse]);
  const currentBranch = useMemo(
    () => currentCourse?.branches.find((b) => b.value === selectedBranch),
    [currentCourse, selectedBranch]
  );
  const currentSections = currentBranch?.sections ?? [];
  const currentYears = currentCourse?.years ?? [];

  const uploadCourseObj = useMemo(() => options.find((c) => c.value === uploadCourse), [options, uploadCourse]);
  const uploadBranchObj = useMemo(
    () => uploadCourseObj?.branches.find((b) => b.value === uploadBranch),
    [uploadCourseObj, uploadBranch]
  );
  const uploadSections = uploadBranchObj?.sections ?? [];
  const uploadYears = uploadCourseObj?.years ?? [];
  const academicSummary = formatAcademicSummary(currentUser);
  const hasStudentAcademicProfile = Boolean(
    currentUser?.course && currentUser?.branch && currentUser?.section && currentUser?.year
  );

  const isFiltersReady = Boolean(selectedCourse && selectedBranch && selectedYear);

  // Option management helpers
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

  const fetchDisplayedFile = async () => {
    if (isStudent && !hasStudentAcademicProfile) {
      setDisplayedFile(null);
      return;
    }

    if (!selectedCourse || !selectedBranch || !selectedYear) {
      setDisplayedFile(null);
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        category: activeTab,
        userId: currentUser.id,
        course: selectedCourse,
        branch: selectedBranch,
        year: selectedYear,
      });
      if (selectedSection) params.set("section", selectedSection);
      const res = await fetch(`/api/schedule?${params.toString()}`);
      const data = (await res.json()) as { file?: UploadedFile | null; error?: string };
      if (!res.ok) throw new Error(data?.error || "Failed to load schedule");
      setDisplayedFile(data.file ?? null);
    } catch (err) {
      console.error("Failed to load schedule", err);
      toast({ variant: "destructive", title: "Load failed", description: "Could not load schedule data." });
      setDisplayedFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchOptions();
    const handleOptionsChanged = () => void fetchOptions();
    window.addEventListener("academic-options-changed", handleOptionsChanged);
    return () => window.removeEventListener("academic-options-changed", handleOptionsChanged);
  }, []);

  useEffect(() => {
    if (!isStudent || !currentUser) return;
    setSelectedCourse(currentUser.course ?? "");
    setSelectedBranch(currentUser.branch ?? "");
    setSelectedSection(currentUser.section ?? "");
    setSelectedYear(currentUser.year ?? "");
  }, [
    currentUser,
    currentUser?.branch,
    currentUser?.course,
    currentUser?.section,
    currentUser?.year,
    isStudent,
  ]);

  useEffect(() => {
    void fetchDisplayedFile();
  }, [activeTab, selectedCourse, selectedBranch, selectedYear, selectedSection]);

  const handleConfirmUpload = async () => {
    if (!selectedFile || !uploadCategory || !uploadCourse || !uploadBranch || !uploadYear) {
      toast({
        title: "Incomplete Information",
        description: "Please fill out all fields to upload the file.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    try {
      setIsUploading(true);
      const fd = new FormData();
      fd.append("file", selectedFile);
      fd.append("userId", currentUser.id);
      fd.append("category", uploadCategory);
      fd.append("course", uploadCourse);
      fd.append("branch", uploadBranch);
      fd.append("year", uploadYear);
      if (uploadSection) fd.append("section", uploadSection);

      const res = await fetch("/api/schedule", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json()) as { file?: UploadedFile; error?: string };
      if (!res.ok || !data?.file) {
        throw new Error(data?.error || "Upload failed");
      }

      if (
        uploadCategory === activeTab &&
        uploadCourse === selectedCourse &&
        uploadBranch === selectedBranch &&
        uploadYear === selectedYear &&
        uploadSection === selectedSection
      ) {
        setDisplayedFile(data.file);
      }

      toast({
        title: "Upload Successful",
        description: `Your file has been added to the ${uploadCategory} section.`,
        duration: 2000,
      });
    } catch (err) {
      console.error("Upload failed", err);
      toast({
        title: "Upload failed",
        description: "Could not upload the file.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsUploading(false);
      setUploadDialogOpen(false);
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }
  };

  const handleShareClick = (file: UploadedFile) => {
    setSharingFile(file);
  };

  const handleSendSchedule = async (file: UploadedFile, selectedChatIds: string[]) => {
    try {
      const scheduleText = `Schedule • ${file.category} • ${file.course} • ${file.branch} • ${file.year}`;
      const mediaItem = {
        type: file.fileType || (file.isImage ? "image/png" : "application/pdf"),
        url: file.url,
        fileName: file.name,
      };

      const results = await Promise.allSettled(
        selectedChatIds.map(async (chatId) => {
          const res = await fetch(`/api/chats/${encodeURIComponent(chatId)}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: currentUser.id,
              text: scheduleText,
              media: [mediaItem],
            }),
          });
          const data = (await res.json()) as { message?: any; error?: string };
          if (!res.ok || !data?.message) {
            throw new Error(data?.error || "Failed to share schedule");
          }
          return { chatId, message: data.message };
        })
      );

      const successes = results
        .filter((r): r is PromiseFulfilledResult<{ chatId: string; message: any }> => r.status === "fulfilled")
        .map((r) => r.value);

      if (successes.length === 0) {
        throw new Error("Could not share the schedule.");
      }

      setChats((prevChats) =>
        prevChats.map((chat) => {
          const match = successes.find((r) => r.chatId === chat.id);
          return match ? { ...chat, messages: [...chat.messages, match.message] } : chat;
        })
      );

      const failedCount = results.length - successes.length;
      setSharingFile(null);
      toast({
        title: "Schedule Shared!",
        description:
          failedCount > 0
            ? `Shared to ${successes.length} chats. ${failedCount} failed.`
            : "The schedule has been shared with your selected contacts.",
        duration: 3000,
      });
    } catch (err: any) {
      console.error("Share schedule error:", err);
      toast({
        title: "Could not share",
        description: String(err?.message || err),
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(
        `/api/schedule?id=${encodeURIComponent(id)}&userId=${encodeURIComponent(currentUser.id)}`,
        { method: "DELETE" }
      );
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Delete failed");
      }
      await fetchDisplayedFile();
    } catch (err) {
      console.error("Delete failed", err);
      toast({
        title: "Delete failed",
        description: "Could not delete the file.",
        variant: "destructive",
      });
    }
  };

  const Placeholder = () => (
    <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-center p-4 border-2 border-dashed rounded-lg mt-4">
      <p>
        {isLoading
          ? "Loading schedule..."
          : isStudent && !hasStudentAcademicProfile
            ? "Your academic profile is incomplete. Please contact a teacher."
            : isFiltersReady
              ? isStudent
                ? "No schedule file has been uploaded for your class yet."
                : "No file found for the selected criteria."
              : "Please select all filters or upload a file."}
      </p>
      {!isLoading && isFiltersReady && !isStudent && (
        <p className="text-sm">Upload a file to make it available here.</p>
      )}
    </div>
  );

  const DisplayedFileCard = ({ file }: { file: UploadedFile }) => (
    <Card key={file.id} className="group mt-4 animated-border-card">
      <CardContent className="p-0">
        <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
          {file.isImage ? (
            <Image src={file.url} alt={file.name} fill className="object-contain" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full bg-secondary p-4">
              <File className="h-16 w-16 text-muted-foreground" />
              <p className="mt-4 text-sm font-medium text-center">{file.name}</p>
            </div>
          )}
          
          <div className="absolute top-2 right-2">
              <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-background/50 hover:bg-background/80">
                  <MoreVertical className="h-4 w-4" />
                  </Button>
              </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleShareClick(file)}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </DropdownMenuItem>
                  {file.uploaderId === currentUser.id && (
                    <DropdownMenuItem
                    className="text-red-500"
                    onClick={() => handleDelete(file.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
              </DropdownMenuContent>
              </DropdownMenu>
          </div>
          
        </div>
      </CardContent>
    </Card>
  );

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  const isFaculty = normalizedRole !== "student";
  const studentInfoCard = (
    <div className="rounded-xl border bg-secondary/30 p-4 mt-4">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold">Your Academic Profile</p>
        <p className="text-sm text-muted-foreground">
          {academicSummary || "Academic profile pending"}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-4">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Course</Label>
          <div className="rounded-md border bg-background px-3 py-2 text-sm">
            {formatAcademicValue("course", selectedCourse)}
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Branch</Label>
          <div className="rounded-md border bg-background px-3 py-2 text-sm">
            {formatAcademicValue("branch", selectedBranch)}
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Section</Label>
          <div className="rounded-md border bg-background px-3 py-2 text-sm">
            {formatAcademicValue("section", selectedSection)}
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Year / Semester</Label>
          <div className="rounded-md border bg-background px-3 py-2 text-sm">
            {formatAcademicValue("year", selectedYear)}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="animated-border-card">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        accept="image/*,application/pdf"
      />
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>Schedules & Academics</CardTitle>
                <CardDescription>
                {isStudent
                  ? "Your class schedule, attendance, and results are shown here automatically."
                  : "View timetable, attendance, and results for your class."}
                </CardDescription>
            </div>
            {isFaculty && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setManageOpen(true)} disabled={optionsLoading}>
                  <Plus className="mr-2 h-4 w-4" /> Manage options
                </Button>
                <Button variant="glow" onClick={handleUploadClick}>
                  <Upload className="mr-2 h-4 w-4" /> Upload
                </Button>
              </div>
            )}
        </div>
        {isStudent ? (
          studentInfoCard
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
            <div className="animated-border-input">
              <Select
                onValueChange={(value) => {
                  setSelectedCourse(value);
                  setSelectedBranch('');
                  setSelectedSection('');
                  setSelectedYear('');
                }}
                value={selectedCourse}
              >
                <SelectTrigger>
                  <SelectValue placeholder={optionsLoading ? "Loading..." : "Course"} />
                </SelectTrigger>
                <SelectContent>
                  {options.map((c) => (
                    <SelectItem key={c.id} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="animated-border-input">
              <Select
                onValueChange={(value) => { setSelectedBranch(value); setSelectedSection(''); setSelectedYear(''); }}
                value={selectedBranch}
                disabled={!selectedCourse}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Branch" />
                </SelectTrigger>
                <SelectContent>
                  {(currentCourse?.branches ?? []).map(branch => (
                    <SelectItem key={branch.id} value={branch.value}>{branch.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="animated-border-input">
              <Select
                onValueChange={(value) => setSelectedSection(value)}
                value={selectedSection}
                disabled={!selectedBranch}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Section" />
                </SelectTrigger>
                <SelectContent>
                  {currentSections.map(sec => (
                    <SelectItem key={sec.id} value={sec.value}>{sec.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="animated-border-input">
              <Select onValueChange={setSelectedYear} value={selectedYear} disabled={!selectedCourse || !selectedBranch}>
                <SelectTrigger>
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {currentYears.map(year => (
                    <SelectItem key={year.id} value={year.value}>{year.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="timetable" onValueChange={(val) => setActiveTab(val as UploadCategory)}>
          <TabsList className="w-full">
            <TabsTrigger value="timetable" className="w-full">
              Timetable
            </TabsTrigger>
            <TabsTrigger value="attendance" className="w-full">
              Attendance
            </TabsTrigger>
            <TabsTrigger value="results" className="w-full">
              Exam Results
            </TabsTrigger>
          </TabsList>
          <TabsContent value="timetable">
            {displayedFile ? <DisplayedFileCard file={displayedFile} /> : <Placeholder />}
          </TabsContent>
          <TabsContent value="attendance">
            {displayedFile ? <DisplayedFileCard file={displayedFile} /> : <Placeholder />}
          </TabsContent>
          <TabsContent value="results">
            {displayedFile ? <DisplayedFileCard file={displayedFile} /> : <Placeholder />}
          </TabsContent>
        </Tabs>
      </CardContent>
      <Dialog open={isUploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent className="sm:max-w-md p-0 flex flex-col h-[80vh] max-h-[90vh] overflow-hidden">
              <DialogHeader className="p-6 pb-4 flex-shrink-0">
                  <DialogTitle>Upload File</DialogTitle>
                  <DialogDescription>
                      Categorize your file by selecting the correct options below.
                  </DialogDescription>
              </DialogHeader>
               <ScrollArea className="flex-1 overflow-y-auto px-6 pb-4">
                    <div className="space-y-4">
                        {previewUrl && (
                            <div className="relative aspect-video w-full overflow-hidden rounded-md border">
                                {selectedFile?.type.startsWith("image/") ? (
                                    <Image src={previewUrl} alt="File preview" fill className="object-contain" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full bg-secondary p-4">
                                        <File className="h-16 w-16 text-muted-foreground" />
                                        <p className="mt-4 text-sm font-medium text-center">{selectedFile?.name}</p>
                                    </div>
                                )}
                            </div>
                        )}
                        <div>
                            <Label>Category</Label>
                             <div className="animated-border-input">
                                <Select onValueChange={(val) => setUploadCategory(val as UploadCategory)} value={uploadCategory}>
                                    <SelectTrigger><SelectValue placeholder="Select a category..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="timetable">Timetable</SelectItem>
                                        <SelectItem value="attendance">Attendance</SelectItem>
                                        <SelectItem value="results">Results</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <Label>Course</Label>
                            <div className="animated-border-input">
                                <Select
                                  onValueChange={(val) => { setUploadCourse(val); setUploadBranch(''); setUploadSection(''); setUploadYear(''); }}
                                  value={uploadCourse}
                                >
                                  <SelectTrigger><SelectValue placeholder="Select a course..." /></SelectTrigger>
                                  <SelectContent>
                                    {options.map((c) => (
                                      <SelectItem key={c.id} value={c.value}>{c.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <Label>Branch</Label>
                            <div className="animated-border-input">
                                <Select
                                  onValueChange={(val) => { setUploadBranch(val); setUploadSection(''); setUploadYear(''); }}
                                  value={uploadBranch}
                                  disabled={!uploadCourse}
                                >
                                  <SelectTrigger><SelectValue placeholder="Select a branch..." /></SelectTrigger>
                                  <SelectContent>
                                    {(uploadCourseObj?.branches ?? []).map(branch => (
                                      <SelectItem key={branch.id} value={branch.value}>{branch.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <Label>Section</Label>
                            <div className="animated-border-input">
                                <Select onValueChange={setUploadSection} value={uploadSection} disabled={!uploadBranch}>
                                    <SelectTrigger><SelectValue placeholder="Select a section..." /></SelectTrigger>
                                    <SelectContent>
                                    {uploadSections.map(sec => (
                                        <SelectItem key={sec.id} value={sec.value}>{sec.label}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <Label>Year</Label>
                            <div className="animated-border-input">
                                <Select onValueChange={(val) => setUploadYear(val)} value={uploadYear} disabled={!uploadCourse}>
                                    <SelectTrigger><SelectValue placeholder="Select a year..." /></SelectTrigger>
                                    <SelectContent>
                                    {uploadYears.map(year => (
                                        <SelectItem key={year.id} value={year.value}>{year.label}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
               </ScrollArea>
              <DialogFooter className="px-6 py-4 border-t bg-background flex-shrink-0">
                  <Button variant="secondary" onClick={() => setUploadDialogOpen(false)} disabled={isUploading}>
                    Cancel
                  </Button>
                  <Button onClick={handleConfirmUpload} variant="glow" disabled={isUploading}>
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      "Confirm Upload"
                    )}
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      {/* Manage options dialog */}
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
                            className={`inline-flex items-center overflow-hidden rounded-md border bg-background ${
                              focusedBranchId === b.id ? "border-primary ring-1 ring-primary/30" : ""
                            }`}
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

      {sharingFile && (
        <ShareDialog
          content={sharingFile}
          chats={chats}
          currentUser={currentUser}
          onClose={() => setSharingFile(null)}
          onSend={(file, chatIds) => handleSendSchedule(file as UploadedFile, chatIds)}
          dialogTitle="Share Schedule"
          dialogDescription="Select contacts to share this schedule with."
        />
      )}
    </Card>
  );
}

