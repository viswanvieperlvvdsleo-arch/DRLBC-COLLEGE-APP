
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building, MapPin, ExternalLink, PlusCircle, MoreVertical, Trash2, Search, Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useMainLayout } from "../layout";
import { InternshipCardSkeleton } from "@/components/app/skeletons";
import { formatDistanceToNow } from "date-fns";
import type { Internship } from "@/lib/mock-data";


function AddInternshipDialog({
  onAddInternship,
  currentUser,
}: {
  onAddInternship: (internship: Omit<Internship, 'id' | 'uploaderId' | 'postedAt'>) => Promise<void>;
  currentUser: any;
}) {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!title || !company || !location || !description || !url) {
      toast({
        title: "Missing fields",
        description: "Please complete all fields before posting.",
        variant: "destructive",
      });
      return;
    }
    try {
      setIsSubmitting(true);
      const newInternship = { title, company, location, description, url };
      await onAddInternship(newInternship);
      // Reset form and close dialog
      setTitle('');
      setCompany('');
      setLocation('');
      setDescription('');
      setUrl('');
      setIsOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="glow">
          <PlusCircle className="mr-2 h-4 w-4" /> Post an Internship
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Post a New Internship</DialogTitle>
          <DialogDescription>
            Fill in the details below. This will be visible to all students.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">Title</Label>
            <div className="animated-border-input col-span-3">
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="company" className="text-right">Company</Label>
            <div className="animated-border-input col-span-3">
                <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="location" className="text-right">Location</Label>
            <div className="animated-border-input col-span-3">
                <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Description</Label>
            <div className="animated-border-input col-span-3">
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="url" className="text-right">Apply Link</Label>
            <div className="animated-border-input col-span-3">
                <Input id="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/apply" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} variant="glow" disabled={isSubmitting}>
            {isSubmitting ? "Posting..." : "Post Internship"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function InternshipPage() {
  const { currentUser } = useMainLayout();
  const [internships, setInternships] = useState<Internship[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInternships = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchTerm.trim()) params.set("search", searchTerm.trim());
        const res = await fetch(`/api/internships?${params.toString()}`);
        const data = (await res.json()) as { internships?: Internship[]; error?: string };
        if (!res.ok || !data?.internships) {
          throw new Error(data?.error || "Failed to load internships");
        }
        setInternships(data.internships);
      } catch (err) {
        console.error("Load internships error:", err);
        toast({
          title: "Could not load internships",
          description: "Please try again in a moment.",
          variant: "destructive",
        });
        setInternships([]);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchInternships();
  }, [searchTerm, toast]);

  const handleAddInternship = async (newInternshipData: Omit<Internship, 'id' | 'uploaderId' | 'postedAt'>) => {
    try {
      const res = await fetch("/api/internships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newInternshipData, userId: currentUser.id }),
      });
      const data = (await res.json()) as { internship?: Internship; error?: string };
      if (!res.ok || !data?.internship) {
        throw new Error(data?.error || "Failed to post internship");
      }
      setInternships((prev) => [data.internship, ...prev]);
      toast({
        title: "Internship Posted",
        description: "The posting is now visible to students.",
      });
    } catch (err: any) {
      console.error("Post internship error:", err);
      toast({
        title: "Post failed",
        description: String(err?.message || err),
        variant: "destructive",
      });
      throw err;
    }
  };
  
  const handleDeleteInternship = async (id: string) => {
    try {
      const res = await fetch(
        `/api/internships?id=${encodeURIComponent(id)}&userId=${encodeURIComponent(currentUser.id)}`,
        { method: "DELETE" }
      );
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Delete failed");
      }
      setInternships((prev) => prev.filter((internship) => internship.id !== id));
      toast({
        title: "Internship Deleted",
        description: "The internship posting has been removed.",
      });
    } catch (err: any) {
      console.error("Delete internship error:", err);
      toast({
        title: "Delete failed",
        description: String(err?.message || err),
        variant: "destructive",
      });
    }
  }
  
  const filteredInternships = internships.filter(internship =>
    internship.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    internship.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    internship.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    internship.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Internship Opportunities</h1>
          <p className="text-muted-foreground">
            Find your next professional experience. Posted by faculty.
          </p>
        </div>
        <div className="flex w-full md:w-auto items-center gap-2">
            <div className="relative w-full md:w-64 animated-border-input">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                <Input
                    placeholder="Search internships..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            {currentUser.role !== 'Student' && <AddInternshipDialog onAddInternship={handleAddInternship} currentUser={currentUser} />}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => <InternshipCardSkeleton key={index} />)
        ) : (
            filteredInternships.map((internship, index) => {
                const isOwner = internship.uploaderId === currentUser.id;
                return (
                <Card key={internship.id} className="animated-border-card flex flex-col">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                            <CardTitle>{internship.title}</CardTitle>
                            <div className="flex flex-col gap-1 text-sm text-muted-foreground pt-1">
                                <div className="flex items-center">
                                    <Building className="h-4 w-4 mr-1.5" />
                                    {internship.company}
                                </div>
                                <div className="flex items-center">
                                    <MapPin className="h-4 w-4 mr-1.5" />
                                    {internship.location}
                                </div>
                                <div className="flex items-center">
                                    <Clock className="h-4 w-4 mr-1.5" />
                                    {formatDistanceToNow(new Date(internship.postedAt), { addSuffix: true })}
                                </div>
                            </div>
                            </div>
                            {isOwner && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem className="text-red-500" onClick={() => handleDeleteInternship(internship.id)}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                    <CardDescription>{internship.description}</CardDescription>
                    </CardContent>
                    <CardFooter>
                    <Button variant="glow" className="w-full" asChild>
                        <a href={internship.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View & Apply
                        </a>
                    </Button>
                    </CardFooter>
                </Card>
                )
            })
        )}
      </div>
    </div>
  );
}
