'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, UserPlus, MessageSquare, Eye, Share2, GraduationCap, Loader2, TrendingUp, Trash2, Plus, Trash, SlidersHorizontal } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMainLayout } from '../layout';
import { UserCardSkeleton } from '@/components/app/skeletons';
import type { User } from '@/lib/mock-data';
import { CourseOption, formatAcademicSummary } from '@/lib/academic';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type AcademicStudent = {
  id: string;
  username: string;
  email: string;
  course?: string | null;
  branch?: string | null;
  section?: string | null;
  year?: string | null;
};

export default function DirectoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { currentUser } = useMainLayout();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const normalizedRole = currentUser?.role?.toLowerCase?.() ?? '';
  const isFaculty = normalizedRole !== 'student';

  const [options, setOptions] = useState<CourseOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterCourse, setFilterCourse] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [newCourse, setNewCourse] = useState({ value: '', label: '' });
  const [newBranch, setNewBranch] = useState({ courseValue: '', value: '', label: '' });
  const [newSection, setNewSection] = useState({ courseValue: '', branchValue: '', value: '', label: '' });
  const [newYear, setNewYear] = useState({ courseValue: '', value: '', label: '' });
  const [focusedBranchByCourse, setFocusedBranchByCourse] = useState<Record<number, number | null>>({});
  const [pendingDelete, setPendingDelete] = useState<{
    type: 'course' | 'branch' | 'section' | 'year';
    id: number;
    label: string;
    accountCount: number;
  } | null>(null);

  const [academicControlOpen, setAcademicControlOpen] = useState(false);
  const [confirmAcademicUpdateOpen, setConfirmAcademicUpdateOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [previewStudents, setPreviewStudents] = useState<AcademicStudent[]>([]);
  const [previewCount, setPreviewCount] = useState(0);
  const [studentPromoteOpen, setStudentPromoteOpen] = useState(false);
  const [studentDeleteOpen, setStudentDeleteOpen] = useState(false);
  const [individualPromoteLoading, setIndividualPromoteLoading] = useState(false);
  const [studentDeleteLoading, setStudentDeleteLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);

  const [sourceCourse, setSourceCourse] = useState('');
  const [sourceBranch, setSourceBranch] = useState('');
  const [sourceSection, setSourceSection] = useState('');
  const [sourceYear, setSourceYear] = useState('');

  const [targetCourse, setTargetCourse] = useState('');
  const [targetBranch, setTargetBranch] = useState('');
  const [targetSection, setTargetSection] = useState('');
  const [targetYear, setTargetYear] = useState('');
  const [studentTargetCourse, setStudentTargetCourse] = useState('');
  const [studentTargetBranch, setStudentTargetBranch] = useState('');
  const [studentTargetSection, setStudentTargetSection] = useState('');
  const [studentTargetYear, setStudentTargetYear] = useState('');

  const currentUserId = currentUser?.id ?? '';

  const fetchUsers = async () => {
    if (!currentUserId) return;

    try {
      const res = await fetch(`/api/users?excludeId=${encodeURIComponent(currentUserId)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Internal server error');

      const mapped: User[] = (data?.users || []).map((u: any) => ({
        id: u.id,
        name: u.username,
        avatar: u.avatarUrl || '/avatar-placeholder.png',
        email: u.email,
        role: u.role,
        department:
          u.role === 'Student'
            ? formatAcademicSummary(u) || 'Academic profile pending'
            : 'General',
        bio: u.bio ?? '',
        course: u.course ?? undefined,
        branch: u.branch ?? undefined,
        section: u.section ?? undefined,
        year: u.year ?? undefined,
      }));

      setUsers(mapped);
    } catch (err) {
      console.error('Directory fetch error:', err);
      toast({
        title: 'Could not load directory',
        description: 'Please refresh the page.',
        variant: 'destructive',
      });
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOptions = async () => {
    if (!isFaculty) return;

    setOptionsLoading(true);
    try {
      const res = await fetch('/api/academic-options');
      const data = (await res.json()) as { courses?: CourseOption[]; error?: string };
      if (!res.ok) throw new Error(data?.error || 'Failed to load academic options');
      setOptions(data.courses || []);
    } catch (err) {
      console.error('Academic options fetch error:', err);
      toast({
        title: 'Could not load academic options',
        description: 'Please refresh and try again.',
        variant: 'destructive',
      });
      setOptions([]);
    } finally {
      setOptionsLoading(false);
    }
  };

  const addOption = async (payload: Record<string, string>) => {
    if (!currentUserId) return;

    const res = await fetch('/api/academic-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, userId: currentUserId }),
    });

    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    if (!res.ok) throw new Error(data?.error || 'Failed to add option');
  };

  const deleteOption = async (type: string, id: number) => {
    if (!currentUserId) return;

    const res = await fetch(
      `/api/academic-options?type=${encodeURIComponent(type)}&id=${id}&userId=${encodeURIComponent(currentUserId)}`,
      { method: 'DELETE' }
    );

    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    if (!res.ok) throw new Error(data?.error || 'Failed to delete option');
  };

  useEffect(() => {
    if (!currentUserId) return;
    setIsLoading(true);
    void fetchUsers();
  }, [currentUserId]);

  useEffect(() => {
    if (!isFaculty) return;
    void fetchOptions();
    const handleOptionsChanged = () => void fetchOptions();
    window.addEventListener('academic-options-changed', handleOptionsChanged);
    return () => window.removeEventListener('academic-options-changed', handleOptionsChanged);
  }, [isFaculty]);

  const handleAddCourse = async () => {
    if (!newCourse.value || !newCourse.label) return;
    await addOption({ type: 'course', ...newCourse });
    setNewCourse({ value: '', label: '' });
    await fetchOptions();
    window.dispatchEvent(new Event('academic-options-changed'));
  };

  const handleAddBranch = async () => {
    if (!newBranch.courseValue || !newBranch.value || !newBranch.label) return;
    await addOption({ type: 'branch', ...newBranch });
    setNewBranch({ courseValue: '', value: '', label: '' });
    await fetchOptions();
    window.dispatchEvent(new Event('academic-options-changed'));
  };

  const handleAddSection = async () => {
    if (!newSection.courseValue || !newSection.branchValue || !newSection.value || !newSection.label) return;
    await addOption({ type: 'section', ...newSection });
    setNewSection({ courseValue: '', branchValue: '', value: '', label: '' });
    await fetchOptions();
    window.dispatchEvent(new Event('academic-options-changed'));
  };

  const handleAddYear = async () => {
    if (!newYear.courseValue || !newYear.value || !newYear.label) return;
    await addOption({ type: 'year', ...newYear });
    setNewYear({ courseValue: '', value: '', label: '' });
    await fetchOptions();
    window.dispatchEvent(new Event('academic-options-changed'));
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    await deleteOption(pendingDelete.type, pendingDelete.id);
    setPendingDelete(null);
    await fetchOptions();
    window.dispatchEvent(new Event('academic-options-changed'));
  };

  const handleAddFriend = (name: string) => {
    toast({
      title: 'Request Sent',
      description: `Your friend request to ${name} has been sent.`,
    });
  };

  const resetAcademicControl = () => {
    setSourceCourse('');
    setSourceBranch('');
    setSourceSection('');
    setSourceYear('');
    setTargetCourse('');
    setTargetBranch('');
    setTargetSection('');
    setTargetYear('');
    setPreviewStudents([]);
    setPreviewCount(0);
    setPreviewLoading(false);
    setApplyLoading(false);
    setConfirmAcademicUpdateOpen(false);
  };

  const openStudentPromoteDialog = (member: User) => {
    setSelectedStudent(member);
    setStudentTargetCourse(member.course ?? '');
    setStudentTargetBranch(member.branch ?? '');
    setStudentTargetSection(member.section ?? '');
    setStudentTargetYear(member.year ?? '');
    setStudentPromoteOpen(true);
  };

  const openStudentDeleteDialog = (member: User) => {
    setSelectedStudent(member);
    setStudentDeleteOpen(true);
  };

  const closeStudentDialogs = () => {
    setStudentPromoteOpen(false);
    setStudentDeleteOpen(false);
    setSelectedStudent(null);
    setStudentTargetCourse('');
    setStudentTargetBranch('');
    setStudentTargetSection('');
    setStudentTargetYear('');
    setIndividualPromoteLoading(false);
    setStudentDeleteLoading(false);
  };

  const sourceCourseObj = useMemo(
    () => options.find((course) => course.value === sourceCourse),
    [options, sourceCourse]
  );
  const sourceBranchObj = useMemo(
    () => sourceCourseObj?.branches.find((branch) => branch.value === sourceBranch),
    [sourceCourseObj, sourceBranch]
  );
  const sourceSectionOptions = sourceBranchObj?.sections ?? [];
  const sourceYearOptions = sourceCourseObj?.years ?? [];

  const effectiveTargetCourse = targetCourse || sourceCourse;
  const effectiveTargetBranch = targetBranch || (!targetCourse ? sourceBranch : '');
  const targetCourseObj = useMemo(
    () => options.find((course) => course.value === effectiveTargetCourse),
    [options, effectiveTargetCourse]
  );
  const targetBranchObj = useMemo(
    () => targetCourseObj?.branches.find((branch) => branch.value === effectiveTargetBranch),
    [targetCourseObj, effectiveTargetBranch]
  );
  const targetSectionOptions = targetBranchObj?.sections ?? [];
  const targetYearOptions = targetCourseObj?.years ?? [];

  const sourceSummary = formatAcademicSummary({
    course: sourceCourse,
    branch: sourceBranch,
    section: sourceSection,
    year: sourceYear,
  });
  const targetSummary = formatAcademicSummary({
    course: targetCourse || sourceCourse,
    branch: targetBranch || sourceBranch,
    section: targetSection || sourceSection,
    year: targetYear || sourceYear,
  });

  const hasCompleteSource = Boolean(sourceCourse && sourceBranch && sourceSection && sourceYear);
  const hasTargetChange = Boolean(targetCourse || targetBranch || targetSection || targetYear);
  const selectedStudentSummary = selectedStudent
    ? formatAcademicSummary({
        course: selectedStudent.course,
        branch: selectedStudent.branch,
        section: selectedStudent.section,
        year: selectedStudent.year,
      }) || 'Academic profile pending'
    : '';
  const selectedStudentTargetSummary = formatAcademicSummary({
    course: studentTargetCourse,
    branch: studentTargetBranch,
    section: studentTargetSection,
    year: studentTargetYear,
  });
  const hasCompleteStudentTarget = Boolean(
    studentTargetCourse && studentTargetBranch && studentTargetSection && studentTargetYear
  );
  const hasIndividualTargetChange = Boolean(
    selectedStudent &&
      (
        (selectedStudent.course ?? '') !== studentTargetCourse ||
        (selectedStudent.branch ?? '') !== studentTargetBranch ||
        (selectedStudent.section ?? '') !== studentTargetSection ||
        (selectedStudent.year ?? '') !== studentTargetYear
      )
  );

  const studentTargetCourseObj = useMemo(
    () => options.find((course) => course.value === studentTargetCourse),
    [options, studentTargetCourse]
  );
  const studentTargetBranchObj = useMemo(
    () => studentTargetCourseObj?.branches.find((branch) => branch.value === studentTargetBranch),
    [studentTargetCourseObj, studentTargetBranch]
  );
  const studentTargetSectionOptions = studentTargetBranchObj?.sections ?? [];
  const studentTargetYearOptions = studentTargetCourseObj?.years ?? [];
  const sortedCourseOptions = useMemo(
    () => [...options].sort((a, b) => a.label.localeCompare(b.label)),
    [options]
  );
  const filterCourseObj = useMemo(
    () => options.find((course) => course.value === filterCourse),
    [options, filterCourse]
  );
  const sortedFilterBranchOptions = useMemo(
    () => [...(filterCourseObj?.branches ?? [])].sort((a, b) => a.label.localeCompare(b.label)),
    [filterCourseObj]
  );
  const filterBranchObj = useMemo(
    () => filterCourseObj?.branches.find((branch) => branch.value === filterBranch),
    [filterCourseObj, filterBranch]
  );
  const sortedFilterSectionOptions = useMemo(
    () => [...(filterBranchObj?.sections ?? [])].sort((a, b) => a.label.localeCompare(b.label)),
    [filterBranchObj]
  );
  const sortedFilterYearOptions = useMemo(
    () => [...(filterCourseObj?.years ?? [])].sort((a, b) => a.label.localeCompare(b.label)),
    [filterCourseObj]
  );

  const clearAcademicFilters = () => {
    setFilterCourse('');
    setFilterBranch('');
    setFilterSection('');
    setFilterYear('');
  };

  const closeAcademicFilters = () => {
    setFilterOpen(false);
    clearAcademicFilters();
  };

  useEffect(() => {
    setPreviewStudents([]);
    setPreviewCount(0);
  }, [sourceCourse, sourceBranch, sourceSection, sourceYear]);

  const previewBatch = async () => {
    if (!currentUserId || !hasCompleteSource) {
      toast({
        title: 'Source batch incomplete',
        description: 'Choose course, branch, section, and year first.',
        variant: 'destructive',
      });
      return;
    }

    setPreviewLoading(true);
    try {
      const params = new URLSearchParams({
        userId: currentUserId,
        course: sourceCourse,
        branch: sourceBranch,
        section: sourceSection,
        year: sourceYear,
      });

      const res = await fetch(`/api/users/academic-control?${params.toString()}`);
      const data = (await res.json()) as {
        count?: number;
        students?: AcademicStudent[];
        error?: string;
      };

      if (!res.ok) throw new Error(data?.error || 'Failed to preview students');

      setPreviewStudents(data.students || []);
      setPreviewCount(data.count || 0);

      toast({
        title: 'Preview ready',
        description:
          (data.count || 0) > 0
            ? `Found ${data.count} student${data.count === 1 ? '' : 's'} in the selected batch.`
            : 'No students matched the selected batch.',
      });
    } catch (err: any) {
      console.error('Academic preview error:', err);
      toast({
        title: 'Could not preview batch',
        description: String(err?.message || err),
        variant: 'destructive',
      });
      setPreviewStudents([]);
      setPreviewCount(0);
    } finally {
      setPreviewLoading(false);
    }
  };

  const applyAcademicUpdate = async () => {
    if (!currentUserId || !hasCompleteSource || !hasTargetChange) return;

    setApplyLoading(true);
    try {
      const res = await fetch('/api/users/academic-control', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          source: {
            course: sourceCourse,
            branch: sourceBranch,
            section: sourceSection,
            year: sourceYear,
          },
          target: {
            course: targetCourse,
            branch: targetBranch,
            section: targetSection,
            year: targetYear,
          },
        }),
      });

      const data = (await res.json()) as { updatedCount?: number; error?: string };
      if (!res.ok) throw new Error(data?.error || 'Failed to update students');

      toast({
        title: 'Academic update applied',
        description: `Updated ${data.updatedCount || 0} student account${data.updatedCount === 1 ? '' : 's'}.`,
      });

      setConfirmAcademicUpdateOpen(false);
      setAcademicControlOpen(false);
      resetAcademicControl();
      setIsLoading(true);
      await fetchUsers();
      await fetchOptions();
      window.dispatchEvent(new Event('academic-options-changed'));
    } catch (err: any) {
      console.error('Academic update error:', err);
      toast({
        title: 'Update failed',
        description: String(err?.message || err),
        variant: 'destructive',
      });
    } finally {
      setApplyLoading(false);
    }
  };

  const applyIndividualPromotion = async () => {
    if (!currentUserId || !selectedStudent?.id || !hasCompleteStudentTarget || !hasIndividualTargetChange) return;

    setIndividualPromoteLoading(true);
    try {
      const res = await fetch('/api/users/academic-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          targetStudentId: selectedStudent.id,
          target: {
            course: studentTargetCourse,
            branch: studentTargetBranch,
            section: studentTargetSection,
            year: studentTargetYear,
          },
        }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data?.error || 'Failed to send the promotion update');

      toast({
        title: 'Promotion update sent',
        description: `${selectedStudent.name} will see the new batch the next time they log in.`,
      });

      closeStudentDialogs();
      setIsLoading(true);
      await fetchUsers();
      await fetchOptions();
      window.dispatchEvent(new Event('academic-options-changed'));
    } catch (err: any) {
      console.error('Individual promotion error:', err);
      toast({
        title: 'Promotion failed',
        description: String(err?.message || err),
        variant: 'destructive',
      });
    } finally {
      setIndividualPromoteLoading(false);
    }
  };

  const deleteStudentAccount = async () => {
    if (!currentUserId || !selectedStudent?.id) return;

    setStudentDeleteLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          targetUserId: selectedStudent.id,
        }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data?.error || 'Failed to delete the student account');

      toast({
        title: 'Student deleted',
        description: `${selectedStudent.name}'s account was removed from the database. Their direct chats stay visible for 24 days, then auto-delete.`,
      });

      closeStudentDialogs();
      setIsLoading(true);
      await fetchUsers();
      await fetchOptions();
      window.dispatchEvent(new Event('academic-options-changed'));
    } catch (err: any) {
      console.error('Student delete error:', err);
      toast({
        title: 'Delete failed',
        description: String(err?.message || err),
        variant: 'destructive',
      });
    } finally {
      setStudentDeleteLoading(false);
    }
  };

  const students = users.filter((u) => u.role === 'Student');
  const faculty = users.filter((u) => u.role !== 'Student');

  const filteredFaculty = faculty.filter(
    (f) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.department && f.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const filteredStudents = students
    .filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.department && student.department.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;
      if (!filterCourse && !filterBranch && !filterSection && !filterYear) return true;
      if (filterCourse && (student.course ?? '') !== filterCourse) return false;
      if (filterBranch && (student.branch ?? '') !== filterBranch) return false;
      if (filterSection && (student.section ?? '') !== filterSection) return false;
      if (filterYear && (student.year ?? '') !== filterYear) return false;
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const UserCard = ({
    member,
  }: {
    member: User;
  }) => (
    <Card key={member.id} className="animated-border-card flex flex-col">
      <CardHeader className="items-center text-center">
        <Avatar className="h-20 w-20">
          <AvatarImage src={member.avatar} alt={member.name} />
          <AvatarFallback>{member.name.substring(0, 2)}</AvatarFallback>
        </Avatar>
        <CardTitle>{member.name}</CardTitle>
        <CardDescription>
          {member.role === 'Student' ? member.department : `${member.role}, ${member.department}`}
        </CardDescription>
      </CardHeader>
      <CardFooter className="mt-auto flex flex-col gap-2 p-2 pt-0">
        <div className="grid grid-cols-4 gap-2 w-full">
          <Button
            variant="secondary"
            size="icon"
            className="animated-border-card"
            onClick={() => handleAddFriend(member.name)}
          >
            <UserPlus className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="icon" className="animated-border-card" asChild>
            <Link href={`/chat?userId=${member.id}`}>
              <MessageSquare className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="secondary" size="icon" className="animated-border-card" asChild>
            <Link href={`/profile/${member.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="animated-border-card"
            onClick={() => toast({ title: 'Share Feature', description: 'This will open a share dialog.' })}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        {isFaculty && member.role === 'Student' && (
          <div className="grid grid-cols-2 gap-2 w-full">
            <Button variant="outline" onClick={() => openStudentPromoteDialog(member)} disabled={optionsLoading}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Promote
            </Button>
            <Button variant="destructive" onClick={() => openStudentDeleteDialog(member)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );

  const renderSkeletons = (count: number) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <UserCardSkeleton key={index} />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <Tabs defaultValue="students" className="w-full flex flex-col flex-1">
        <div className="flex-shrink-0 sticky top-0 z-10 bg-secondary/30 backdrop-blur-sm pt-4 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Directory</h1>
              <p className="text-muted-foreground">
                Find students and faculty members across the campus.
              </p>
            </div>
            <div className="flex w-full md:w-auto items-center gap-2">
              <div className="relative w-full md:w-80 animated-border-input">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                <Input
                  placeholder="Search by name or department..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {isFaculty && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (filterOpen) {
                        closeAcademicFilters();
                        return;
                      }
                      setFilterOpen(true);
                    }}
                    disabled={optionsLoading}
                  >
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    {filterOpen ? 'Close filter' : 'Filter'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setManageOpen(true)}
                    disabled={optionsLoading}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Manage options
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setAcademicControlOpen(true)}
                    disabled={optionsLoading}
                  >
                    <GraduationCap className="mr-2 h-4 w-4" />
                    Academic Control
                  </Button>
                </>
              )}
            </div>
          </div>
          {isFaculty && filterOpen && (
            <div className="px-4">
              <div className="rounded-xl border bg-background/95 p-4 shadow-sm">
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="font-semibold">Filter students</p>
                    <p className="text-sm text-muted-foreground">
                      Select only the academic fields you need. Unselected lower fields will not block results.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="space-y-2">
                      <Label>Course</Label>
                      <div className="animated-border-input">
                        <Select
                          value={filterCourse}
                          onValueChange={(value) => {
                            setFilterCourse(value);
                            setFilterBranch('');
                            setFilterSection('');
                            setFilterYear('');
                          }}
                        >
                          <SelectTrigger><SelectValue placeholder="All courses" /></SelectTrigger>
                          <SelectContent>
                            {sortedCourseOptions.map((course) => (
                              <SelectItem key={course.id} value={course.value}>
                                {course.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Branch</Label>
                      <div className="animated-border-input">
                        <Select
                          value={filterBranch}
                          onValueChange={(value) => {
                            setFilterBranch(value);
                            setFilterSection('');
                          }}
                          disabled={!filterCourse}
                        >
                          <SelectTrigger><SelectValue placeholder="All branches" /></SelectTrigger>
                          <SelectContent>
                            {sortedFilterBranchOptions.map((branch) => (
                              <SelectItem key={branch.id} value={branch.value}>
                                {branch.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Section</Label>
                      <div className="animated-border-input">
                        <Select
                          value={filterSection}
                          onValueChange={setFilterSection}
                          disabled={!filterBranch}
                        >
                          <SelectTrigger><SelectValue placeholder="All sections" /></SelectTrigger>
                          <SelectContent>
                            {sortedFilterSectionOptions.map((section) => (
                              <SelectItem key={section.id} value={section.value}>
                                {section.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Year / Semester</Label>
                      <div className="animated-border-input">
                        <Select
                          value={filterYear}
                          onValueChange={setFilterYear}
                          disabled={!filterCourse}
                        >
                          <SelectTrigger><SelectValue placeholder="All years" /></SelectTrigger>
                          <SelectContent>
                            {sortedFilterYearOptions.map((year) => (
                              <SelectItem key={year.id} value={year.value}>
                                {year.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-between gap-3 text-sm text-muted-foreground">
                    <p>
                      Showing{' '}
                      <span className="font-medium text-foreground">{filteredStudents.length}</span>{' '}
                      student account{filteredStudents.length === 1 ? '' : 's'}.
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={clearAcademicFilters}>
                        Clear filters
                      </Button>
                      <Button variant="secondary" size="sm" onClick={closeAcademicFilters}>
                        Close filter
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <TabsList className="grid w-full grid-cols-2 max-w-lg mx-auto">
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="faculty">Faculty</TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 lg:p-6">
            <TabsContent value="students">
              {isLoading ? (
                renderSkeletons(8)
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredStudents.map((member) => (
                    <UserCard key={member.id} member={member} />
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="faculty">
              {isLoading ? (
                renderSkeletons(4)
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredFaculty.map((member) => (
                    <UserCard key={member.id} member={member} />
                  ))}
                </div>
              )}
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>

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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>New course</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="value (e.g., mba)"
                      value={newCourse.value}
                      onChange={(e) => setNewCourse((prev) => ({ ...prev, value: e.target.value }))}
                    />
                    <Input
                      placeholder="label"
                      value={newCourse.label}
                      onChange={(e) => setNewCourse((prev) => ({ ...prev, label: e.target.value }))}
                    />
                    <Button onClick={() => void handleAddCourse()}>Add</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>New year</Label>
                  <div className="flex flex-wrap gap-2">
                    <Select
                      value={newYear.courseValue}
                      onValueChange={(value) => setNewYear((prev) => ({ ...prev, courseValue: value }))}
                    >
                      <SelectTrigger className="w-32"><SelectValue placeholder="Course" /></SelectTrigger>
                      <SelectContent>
                        {options.map((course) => (
                          <SelectItem key={course.id} value={course.value}>
                            {course.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="value (e.g., 1-1)"
                      value={newYear.value}
                      onChange={(e) => setNewYear((prev) => ({ ...prev, value: e.target.value }))}
                    />
                    <Input
                      placeholder="label"
                      value={newYear.label}
                      onChange={(e) => setNewYear((prev) => ({ ...prev, label: e.target.value }))}
                    />
                    <Button onClick={() => void handleAddYear()}>Add</Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>New branch</Label>
                  <div className="flex flex-wrap gap-2">
                    <Select
                      value={newBranch.courseValue}
                      onValueChange={(value) => setNewBranch((prev) => ({ ...prev, courseValue: value }))}
                    >
                      <SelectTrigger className="w-32"><SelectValue placeholder="Course" /></SelectTrigger>
                      <SelectContent>
                        {options.map((course) => (
                          <SelectItem key={course.id} value={course.value}>
                            {course.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="value (e.g., ai)"
                      value={newBranch.value}
                      onChange={(e) => setNewBranch((prev) => ({ ...prev, value: e.target.value }))}
                    />
                    <Input
                      placeholder="label"
                      value={newBranch.label}
                      onChange={(e) => setNewBranch((prev) => ({ ...prev, label: e.target.value }))}
                    />
                    <Button onClick={() => void handleAddBranch()}>Add</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>New section</Label>
                  <div className="flex flex-wrap gap-2">
                    <Select
                      value={newSection.courseValue}
                      onValueChange={(value) =>
                        setNewSection((prev) => ({ ...prev, courseValue: value, branchValue: '' }))
                      }
                    >
                      <SelectTrigger className="w-32"><SelectValue placeholder="Course" /></SelectTrigger>
                      <SelectContent>
                        {options.map((course) => (
                          <SelectItem key={course.id} value={course.value}>
                            {course.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={newSection.branchValue}
                      onValueChange={(value) => setNewSection((prev) => ({ ...prev, branchValue: value }))}
                      disabled={!newSection.courseValue}
                    >
                      <SelectTrigger className="w-32"><SelectValue placeholder="Branch" /></SelectTrigger>
                      <SelectContent>
                        {options.find((course) => course.value === newSection.courseValue)?.branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.value}>
                            {branch.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="value (e.g., cs6)"
                      value={newSection.value}
                      onChange={(e) => setNewSection((prev) => ({ ...prev, value: e.target.value }))}
                    />
                    <Input
                      placeholder="label"
                      value={newSection.label}
                      onChange={(e) => setNewSection((prev) => ({ ...prev, label: e.target.value }))}
                    />
                    <Button onClick={() => void handleAddSection()}>Add</Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Existing options</Label>
                <div className="space-y-3">
                  {options.map((course) => {
                    const focusedBranchId = focusedBranchByCourse[course.id] ?? null;
                    const visibleBranches = focusedBranchId
                      ? course.branches.filter((branch) => branch.id === focusedBranchId)
                      : course.branches;
                    const visibleSections = visibleBranches.flatMap((branch) =>
                      branch.sections.map((section) => ({
                        ...section,
                        branchId: branch.id,
                        branchLabel: branch.label,
                      }))
                    );

                    return (
                      <div key={course.id} className="space-y-3 rounded-md border p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-semibold">{course.label} ({course.value})</div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setPendingDelete({
                                type: 'course',
                                id: course.id,
                                label: course.label,
                                accountCount: course.accountCount ?? 0,
                              })
                            }
                          >
                            <Trash className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                        <div className="text-sm text-muted-foreground">Branches</div>
                        <div className="flex flex-wrap gap-2">
                          {course.branches.map((branch) => (
                            <div
                              key={branch.id}
                              className={`inline-flex items-center overflow-hidden rounded-md border bg-background ${
                                focusedBranchId === branch.id ? 'border-primary ring-1 ring-primary/30' : ''
                              }`}
                            >
                              <button
                                type="button"
                                className="px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                                onClick={() =>
                                  setFocusedBranchByCourse((prev) => ({
                                    ...prev,
                                    [course.id]: prev[course.id] === branch.id ? null : branch.id,
                                  }))
                                }
                              >
                                {branch.label}
                              </button>
                              <div className="h-4 w-px bg-border" />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-none text-red-500 hover:text-red-600"
                                onClick={() =>
                                  setPendingDelete({
                                    type: 'branch',
                                    id: branch.id,
                                    label: branch.label,
                                    accountCount: branch.accountCount ?? 0,
                                  })
                                }
                              >
                                <Trash className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        {focusedBranchId && (
                          <p className="text-xs text-muted-foreground">
                            Showing sections for{' '}
                            <span className="font-medium text-foreground">
                              {visibleBranches[0]?.label}
                            </span>
                            . Click the branch again to show all sections.
                          </p>
                        )}
                        <div className="text-sm text-muted-foreground">Sections</div>
                        <div className="flex flex-wrap gap-2">
                          {visibleSections.map((section) => (
                            <div
                              key={`${section.branchId}-${section.id}`}
                              className="inline-flex items-center overflow-hidden rounded-md border bg-background"
                            >
                              <div className="px-3 py-2 text-sm">
                                {section.label} ({section.branchLabel})
                              </div>
                              <div className="h-4 w-px bg-border" />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-none text-red-500 hover:text-red-600"
                                onClick={() =>
                                  setPendingDelete({
                                    type: 'section',
                                    id: section.id,
                                    label: `${section.label} (${section.branchLabel})`,
                                    accountCount: section.accountCount ?? 0,
                                  })
                                }
                              >
                                <Trash className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                          {!visibleSections.length && (
                            <p className="text-sm text-muted-foreground">
                              No sections found for this branch yet.
                            </p>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">Years</div>
                        <div className="flex flex-wrap gap-2">
                          {course.years.map((year) => (
                            <div
                              key={year.id}
                              className="inline-flex items-center overflow-hidden rounded-md border bg-background"
                            >
                              <div className="px-3 py-2 text-sm">{year.label}</div>
                              <div className="h-4 w-px bg-border" />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-none text-red-500 hover:text-red-600"
                                onClick={() =>
                                  setPendingDelete({
                                    type: 'year',
                                    id: year.id,
                                    label: year.label,
                                    accountCount: year.accountCount ?? 0,
                                  })
                                }
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
                  You are about to permanently remove{' '}
                  <span className="font-medium text-foreground">{pendingDelete.label}</span>. This option is currently linked to{' '}
                  <span className="font-medium text-foreground">{pendingDelete.accountCount}</span>{' '}
                  registered account{pendingDelete.accountCount === 1 ? '' : 's'}. This action cannot be undone.
                </>
              ) : (
                'This action cannot be undone.'
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

      <Dialog
        open={academicControlOpen}
        onOpenChange={(open) => {
          setAcademicControlOpen(open);
          if (!open) resetAcademicControl();
        }}
      >
        <DialogContent className="max-w-4xl p-0 flex flex-col h-[85vh] max-h-[85vh] overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
            <DialogTitle>Academic Control</DialogTitle>
            <DialogDescription>
              Preview a class batch, then move all matched students to a new section, semester, branch, or course.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
            <div className="space-y-6">
              <div className="rounded-xl border p-4 space-y-4">
                <div>
                  <p className="font-semibold">From batch</p>
                  <p className="text-sm text-muted-foreground">
                    Choose the student batch you want to update.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Course</Label>
                    <div className="animated-border-input">
                      <Select
                        onValueChange={(value) => {
                          setSourceCourse(value);
                          setSourceBranch('');
                          setSourceSection('');
                          setSourceYear('');
                          setTargetCourse('');
                          setTargetBranch('');
                          setTargetSection('');
                          setTargetYear('');
                        }}
                        value={sourceCourse}
                      >
                        <SelectTrigger><SelectValue placeholder="Course" /></SelectTrigger>
                        <SelectContent>
                          {options.map((course) => (
                            <SelectItem key={course.id} value={course.value}>
                              {course.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Branch</Label>
                    <div className="animated-border-input">
                      <Select
                        onValueChange={(value) => {
                          setSourceBranch(value);
                          setSourceSection('');
                          setSourceYear('');
                          setTargetBranch('');
                          setTargetSection('');
                          setTargetYear('');
                        }}
                        value={sourceBranch}
                        disabled={!sourceCourse}
                      >
                        <SelectTrigger><SelectValue placeholder="Branch" /></SelectTrigger>
                        <SelectContent>
                          {(sourceCourseObj?.branches ?? []).map((branch) => (
                            <SelectItem key={branch.id} value={branch.value}>
                              {branch.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Section</Label>
                    <div className="animated-border-input">
                      <Select
                        onValueChange={setSourceSection}
                        value={sourceSection}
                        disabled={!sourceBranch}
                      >
                        <SelectTrigger><SelectValue placeholder="Section" /></SelectTrigger>
                        <SelectContent>
                          {sourceSectionOptions.map((section) => (
                            <SelectItem key={section.id} value={section.value}>
                              {section.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Year / Semester</Label>
                    <div className="animated-border-input">
                      <Select
                        onValueChange={setSourceYear}
                        value={sourceYear}
                        disabled={!sourceCourse || !sourceBranch}
                      >
                        <SelectTrigger><SelectValue placeholder="Year / Semester" /></SelectTrigger>
                        <SelectContent>
                          {sourceYearOptions.map((year) => (
                            <SelectItem key={year.id} value={year.value}>
                              {year.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg bg-secondary/30 px-4 py-3 text-sm text-muted-foreground">
                  {sourceSummary || 'No source batch selected yet.'}
                </div>
                <Button variant="outline" onClick={previewBatch} disabled={!hasCompleteSource || previewLoading}>
                  {previewLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Previewing...
                    </>
                  ) : (
                    'Preview Students'
                  )}
                </Button>

                <div className="rounded-lg border bg-background">
                  <div className="border-b px-4 py-3">
                    <p className="font-medium">Matched Students</p>
                    <p className="text-sm text-muted-foreground">
                      {previewCount > 0
                        ? `${previewCount} student${previewCount === 1 ? '' : 's'} found in this batch.`
                        : 'Run preview to see all student accounts in this batch.'}
                    </p>
                  </div>
                  <ScrollArea className="h-48">
                    <div className="divide-y">
                      {previewStudents.length > 0 ? (
                        previewStudents.map((student) => (
                          <div key={student.id} className="px-4 py-3">
                            <p className="font-medium">{student.username}</p>
                            <p className="text-sm text-muted-foreground">{student.email}</p>
                            <p className="text-xs text-muted-foreground pt-1">
                              {formatAcademicSummary(student) || 'Academic profile pending'}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                          No preview data yet.
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              <div className="rounded-xl border p-4 space-y-4">
                <div>
                  <p className="font-semibold">Move matched students to</p>
                  <p className="text-sm text-muted-foreground">
                    Leave a field unchanged if you want to keep that value from the source batch.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>New course</Label>
                    <div className="animated-border-input">
                      <Select
                        onValueChange={(value) => {
                          setTargetCourse(value);
                          setTargetBranch('');
                          setTargetSection('');
                          setTargetYear('');
                        }}
                        value={targetCourse}
                      >
                        <SelectTrigger><SelectValue placeholder="Keep current course" /></SelectTrigger>
                        <SelectContent>
                          {options.map((course) => (
                            <SelectItem key={course.id} value={course.value}>
                              {course.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>New branch</Label>
                    <div className="animated-border-input">
                      <Select
                        onValueChange={(value) => {
                          setTargetBranch(value);
                          setTargetSection('');
                        }}
                        value={targetBranch}
                        disabled={!effectiveTargetCourse}
                      >
                        <SelectTrigger><SelectValue placeholder="Keep current branch" /></SelectTrigger>
                        <SelectContent>
                          {(targetCourseObj?.branches ?? []).map((branch) => (
                            <SelectItem key={branch.id} value={branch.value}>
                              {branch.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>New section</Label>
                    <div className="animated-border-input">
                      <Select
                        onValueChange={setTargetSection}
                        value={targetSection}
                        disabled={!effectiveTargetBranch}
                      >
                        <SelectTrigger><SelectValue placeholder="Keep current section" /></SelectTrigger>
                        <SelectContent>
                          {targetSectionOptions.map((section) => (
                            <SelectItem key={section.id} value={section.value}>
                              {section.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>New year / Semester</Label>
                    <div className="animated-border-input">
                      <Select
                        onValueChange={setTargetYear}
                        value={targetYear}
                        disabled={!effectiveTargetCourse}
                      >
                        <SelectTrigger><SelectValue placeholder="Keep current year / semester" /></SelectTrigger>
                        <SelectContent>
                          {targetYearOptions.map((year) => (
                            <SelectItem key={year.id} value={year.value}>
                              {year.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg bg-secondary/30 px-4 py-3 text-sm text-muted-foreground">
                  {targetSummary || 'The selected students will stay in their current academic batch.'}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t bg-background flex-shrink-0">
            <Button variant="secondary" onClick={() => setAcademicControlOpen(false)}>
              Close
            </Button>
            <Button
              variant="glow"
              disabled={!hasTargetChange || previewCount === 0 || applyLoading}
              onClick={() => setConfirmAcademicUpdateOpen(true)}
            >
              Apply Academic Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmAcademicUpdateOpen} onOpenChange={setConfirmAcademicUpdateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply academic batch update?</AlertDialogTitle>
            <AlertDialogDescription>
              {previewCount > 0
                ? `This will move ${previewCount} student${previewCount === 1 ? '' : 's'} from "${sourceSummary}" to "${targetSummary}".`
                : 'No students are selected for update.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={applyLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={applyAcademicUpdate} disabled={applyLoading || previewCount === 0}>
              {applyLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Applying...
                </>
              ) : (
                'Confirm Update'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={studentPromoteOpen}
        onOpenChange={(open) => {
          setStudentPromoteOpen(open);
          if (!open) closeStudentDialogs();
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Promote Student</DialogTitle>
            <DialogDescription>
              Send an academic update to this student account. Their old batch will keep working until they accept it.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border bg-secondary/30 p-4">
              <p className="font-medium">{selectedStudent?.name || 'Student'}</p>
              <p className="text-sm text-muted-foreground pt-1">{selectedStudent?.email}</p>
              <p className="text-sm text-muted-foreground pt-2">{selectedStudentSummary}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>New course</Label>
                <div className="animated-border-input">
                  <Select
                    value={studentTargetCourse}
                    onValueChange={(value) => {
                      setStudentTargetCourse(value);
                      setStudentTargetBranch('');
                      setStudentTargetSection('');
                      setStudentTargetYear('');
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Course" /></SelectTrigger>
                    <SelectContent>
                      {options.map((course) => (
                        <SelectItem key={course.id} value={course.value}>
                          {course.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>New branch</Label>
                <div className="animated-border-input">
                  <Select
                    value={studentTargetBranch}
                    onValueChange={(value) => {
                      setStudentTargetBranch(value);
                      setStudentTargetSection('');
                    }}
                    disabled={!studentTargetCourse}
                  >
                    <SelectTrigger><SelectValue placeholder="Branch" /></SelectTrigger>
                    <SelectContent>
                      {studentTargetCourseObj?.branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.value}>
                          {branch.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>New section</Label>
                <div className="animated-border-input">
                  <Select
                    value={studentTargetSection}
                    onValueChange={setStudentTargetSection}
                    disabled={!studentTargetBranch}
                  >
                    <SelectTrigger><SelectValue placeholder="Section" /></SelectTrigger>
                    <SelectContent>
                      {studentTargetSectionOptions.map((section) => (
                        <SelectItem key={section.id} value={section.value}>
                          {section.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>New year / semester</Label>
                <div className="animated-border-input">
                  <Select
                    value={studentTargetYear}
                    onValueChange={setStudentTargetYear}
                    disabled={!studentTargetCourse}
                  >
                    <SelectTrigger><SelectValue placeholder="Year / semester" /></SelectTrigger>
                    <SelectContent>
                      {studentTargetYearOptions.map((year) => (
                        <SelectItem key={year.id} value={year.value}>
                          {year.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-secondary/30 p-4 text-sm text-muted-foreground">
              {selectedStudentTargetSummary || 'Select the target academic batch for this student.'}
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={closeStudentDialogs} disabled={individualPromoteLoading}>
              Cancel
            </Button>
            <Button
              variant="glow"
              onClick={applyIndividualPromotion}
              disabled={!hasCompleteStudentTarget || !hasIndividualTargetChange || individualPromoteLoading}
            >
              {individualPromoteLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Promotion Update'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={studentDeleteOpen}
        onOpenChange={(open) => {
          setStudentDeleteOpen(open);
          if (!open) closeStudentDialogs();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete student account?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedStudent
                ? `This will permanently delete ${selectedStudent.name}'s account from the database. Their direct chats will stay read-only for 24 days so others can save important notes or files before those chats are removed too.`
                : 'This will permanently delete the selected student account from the database and keep direct chats for only 24 more days.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={studentDeleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteStudentAccount} disabled={studentDeleteLoading}>
              {studentDeleteLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Student'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
