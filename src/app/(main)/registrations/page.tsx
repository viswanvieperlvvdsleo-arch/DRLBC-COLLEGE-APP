

"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useMainLayout } from "../layout";
import { allUsers } from "@/lib/mock-data";
import type { Message } from "@/lib/mock-data";
import { formatDistanceToNow } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";

interface Application {
  id: string;
  name: string;
  mobile: string;
  group: string;
  applicantId?: string;
  course?: string;
  age?: string;
  status: "PENDING" | "APPROVED" | "DENIED";
  submittedAt: string;
}

const initialApplications: Application[] = [];

const groupOptions = [
    { value: "nss", label: "NSS (National Service Scheme)", chatId: "group-nss" },
    { value: "ncc", label: "NCC (National Cadet Corps)", chatId: "group-ncc" },
  { value: "sports-basketball", label: "Sports - Basketball", chatId: null },
  { value: "sports-cricket", label: "Sports - Cricket", chatId: null },
]

type NccForm = {
  fullName: string;
  nationality: string;
  dob: string;
  fatherName: string;
  motherName: string;
  address: string;
  mobile: string;
  email: string;
  bloodGroup: string;
  sex: string;
  nearestRailway: string;
  nearestPolice: string;
  education: string;
  idMarks: string;
  convictions: string;
  schoolCollege: string;
  willingEnroll: string;
  unitToEnroll: string;
  enrolledEarlier: string;
  dismissedDetails: string;
  nextOfKin: string;
  bankerIfsc: string;
  bankAcct: string;
  aadhar: string;
  pan: string;
  place: string;
  declarationDate: string;
};

export default function RegistrationsPage() {
  const [applications, setApplications] = useState<Application[]>(initialApplications);
  const { toast } = useToast();
  const { currentUser, setChats } = useMainLayout();
  const role = (currentUser?.role || "").toString().toLowerCase();
  const canReview =
    !!currentUser?.notifyNss ||
    !!currentUser?.notifyNcc ||
    role === "teacher" ||
    role === "admin";

  const loadApplications = async () => {
    try {
      const res = await fetch("/api/registrations", { cache: "no-store" });
      if (!res.ok) throw new Error("load failed");
      const data = await res.json();
      const mapped: Application[] = (data.registrations || []).map((r: any) => ({
        id: r.id,
        name: r.fullName || r.applicantUsername || "—",
        mobile: r.mobile || "—",
        group: r.group || "NSS",
        applicantId: r.applicantId,
        status: (r.status || "PENDING") as Application["status"],
        submittedAt: r.createdAt || new Date().toISOString(),
      }));
      setApplications(mapped);
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn’t load applications" });
    }
  };

  useEffect(() => {
    loadApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // State for the application form
  const [nssName, setNssName] = useState("");
  const [nssNationality, setNssNationality] = useState("");
  const [nssDob, setNssDob] = useState("");
  const [nssFather, setNssFather] = useState("");
  const [nssMother, setNssMother] = useState("");
  const [nssAddress, setNssAddress] = useState("");
  const [nssMobile, setNssMobile] = useState("");
  const [nssCourse, setNssCourse] = useState("");
  const [nssAge, setNssAge] = useState("");
  const [nssEmail, setNssEmail] = useState("");
  const [nssBlood, setNssBlood] = useState("");
  const [nssSex, setNssSex] = useState("");
  const [nssPhoto, setNssPhoto] = useState<string | null>(null);

  const [nccForm, setNccForm] = useState<NccForm>({
    fullName: "",
    nationality: "",
    dob: "",
    fatherName: "",
    motherName: "",
    address: "",
    mobile: "",
    email: "",
    bloodGroup: "",
    sex: "",
    nearestRailway: "",
    nearestPolice: "",
    education: "",
    idMarks: "",
    convictions: "",
    schoolCollege: "",
    willingEnroll: "Yes",
    unitToEnroll: "",
    enrolledEarlier: "",
    dismissedDetails: "",
    nextOfKin: "",
    bankerIfsc: "",
    bankAcct: "",
    aadhar: "",
    pan: "",
    place: "",
    declarationDate: "",
  });
  const [nccPhoto, setNccPhoto] = useState<string | null>(null);

  const handleNccSubmit = async () => {
    if (
      !nccForm.fullName ||
      !nccForm.nationality ||
      !nccForm.dob ||
      !nccForm.fatherName ||
      !nccForm.motherName ||
      !nccForm.address ||
      !nccForm.mobile ||
      !nccForm.email ||
      !nccForm.bloodGroup ||
      !nccForm.sex
    ) {
      toast({
        title: "Missing Information",
        description: "Please complete all NCC enrolment fields before submitting.",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicantId: currentUser.id,
          applicantUsername: currentUser.username || currentUser.name,
          fullName: nccForm.fullName,
          mobile: nccForm.mobile,
          group: "NCC",
        }),
      });
      if (!res.ok) throw new Error("submit failed");
      await loadApplications();
      toast({ title: "NCC enrolment submitted" });
    } catch (err) {
      toast({ variant: "destructive", title: "Submit failed" });
    }
  };

  const handleApplication = async (applicationId: string, newStatus: "Approved" | "Denied") => {
    const app = applications.find(a => a.id === applicationId);
    if (!app) return;

    try {
      const res = await fetch("/api/registrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: applicationId, status: newStatus.toUpperCase(), reviewerId: currentUser.id }),
      });
      if (!res.ok) throw new Error("patch failed");
      await loadApplications();
    } catch (err) {
      toast({ variant: "destructive", title: "Update failed" });
      return;
    }

    if (app.applicantId) {
      try {
        await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: app.applicantId,
            title: newStatus === "Approved" ? "Application approved" : "Application denied",
            description:
              newStatus === "Approved"
                ? `Your ${app.group} application has been approved.`
                : `Your ${app.group} application has been denied.`,
            link: "/registrations",
            actorName: currentUser?.name || "System",
            type: "NOTICE",
          }),
        });
      } catch (err) {
        console.error("notify failed", err);
      }
    }

    if (newStatus === "Approved") {
      const groupOption = groupOptions.find(g => g.label.includes(app.group));
      const student = allUsers.find(u => u.id === app.studentId || u.name === app.name);

      if (groupOption && groupOption.chatId && student) {
        
        const systemMessage: Message = {
            id: `sys-${Date.now()}`,
            text: `You added ${student.name}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            senderId: currentUser.id, // Or a special system ID
            isSystem: true,
        };
        
        setChats(prevChats => prevChats.map(chat => {
          if (chat.id === groupOption.chatId) {
            const userExists = chat.users.some(u => u.id === student.id);
            const updatedUsers = userExists ? chat.users : [...chat.users, student];
            return { 
                ...chat, 
                users: updatedUsers,
                messages: [...chat.messages, systemMessage] 
            };
          }
          return chat;
        }));
         toast({
            title: `Application Approved`,
            description: `${student.name} has been added to the ${groupOption.label} chat.`,
        });
      } else {
         toast({
            title: `Application Approved`,
            description: `The application for ${app.name} has been approved.`,
        });
      }
    } else {
        toast({
            title: `Application Denied`,
            description: `The application for ${app.name} has been denied.`,
        });
    }
  };
  
  const handleApply = async () => {
    if (!nssName || !nssNationality || !nssDob || !nssFather || !nssMother || !nssAddress || !nssMobile || !nssEmail || !nssBlood || !nssSex) {
      toast({
        title: "Missing Information",
        description: "Please complete all NSS enrolment fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicantId: currentUser.id,
          applicantUsername: currentUser.username || currentUser.name,
          fullName: nssName,
          mobile: nssMobile,
          group: "NSS",
        }),
      });
      if (!res.ok) throw new Error("submit failed");
      await loadApplications();
      toast({ title: "NSS enrolment submitted" });
    } catch (err) {
      toast({ variant: "destructive", title: "Submit failed" });
      return;
    }

    setNssName("");
    setNssNationality("");
    setNssDob("");
    setNssFather("");
    setNssMother("");
    setNssAddress("");
    setNssMobile("");
    setNssCourse("");
    setNssAge("");
    setNssEmail("");
    setNssBlood("");
    setNssSex("");
  };

  const updateNccField = (key: keyof NccForm, value: string) => {
    setNccForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleNssDownload = () => {
    if (!nssName || !nssNationality || !nssDob || !nssFather || !nssMother || !nssAddress || !nssMobile || !nssEmail || !nssBlood || !nssSex) {
      toast({ variant: "destructive", title: "Missing Information", description: "Complete all NSS fields before downloading." });
      return;
    }

    const css = `
      <style>
        * { box-sizing: border-box; font-family: Arial, sans-serif; }
        body { margin: 24px; }
        h1 { text-align: center; margin-bottom: 8px; text-transform: uppercase; }
        .section { margin-bottom: 14px; }
        .label { font-weight: bold; display: inline-block; min-width: 210px; vertical-align: top; }
        .value { display: inline-block; width: calc(100% - 220px); }
        .line { margin: 4px 0; }
        .photo { position: absolute; top: 110px; right: 24px; width: 110px; height: 140px; object-fit: cover; border: 1px solid #000; }
      </style>
    `;

    const field = (label: string, val: string) =>
      `<div class="line"><span class="label">${label}</span><span class="value">${val || "____________________"}</span></div>`;

    const html = `
      <html>
        <head><title>NSS Enrolment</title>${css}</head>
        <body>
          ${nssPhoto ? `<img src="${nssPhoto}" class="photo" alt="Photo" />` : ""}
          <h1>National Service Scheme Unit dr. lankapalli bullayya college</h1>
          <div class="section">
            ${field("Full Name (Block Letters)", nssName)}
            ${field("Nationality", nssNationality)}
            ${field("Date of Birth (DD/MM/YYYY)", nssDob)}
            ${field("Father's / Guardian's Name", nssFather)}
            ${field("Mother's Name", nssMother)}
            ${field("Residential Address", nssAddress)}
            ${field("Mobile No.", nssMobile)}
            ${field("Email", nssEmail)}
            ${field("Blood Group", nssBlood)}
            ${field("Sex", nssSex)}
          </div>
        </body>
      </html>
    `;

    const win = window.open("", "_blank");
    if (!win) {
      toast({ variant: "destructive", title: "Popup blocked", description: "Allow popups to download the PDF." });
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  const handleNccDownload = () => {
    const css = `
      <style>
        * { box-sizing: border-box; font-family: Arial, sans-serif; }
        body { margin: 24px; }
        h1 { text-align: center; margin-bottom: 8px; }
        h2 { margin: 12px 0 6px; }
        .section { margin-bottom: 16px; }
        .label { font-weight: bold; display: inline-block; min-width: 220px; vertical-align: top; }
        .value { display: inline-block; width: calc(100% - 230px); }
        .line { margin: 4px 0; }
        .small { font-size: 12px; }
        .signature { margin-top: 24px; }
        .signature-line { display: inline-block; min-width: 200px; border-bottom: 1px solid #000; }
        .photo { position: absolute; top: 64px; right: 24px; width: 110px; height: 140px; object-fit: cover; border: 1px solid #000; }
      </style>
    `;

    const field = (label: string, val: string) =>
      `<div class="line"><span class="label">${label}</span><span class="value">${val || "____________________"}</span></div>`;

    const html = `
      <html>
        <head><title>NCC Enrolment Form</title>${css}</head>
        <body>
          ${nccPhoto ? `<img src="${nccPhoto}" class="photo" alt="Photo" />` : ""}
          <h1>FORM 1 APPENDIX 'A' (Revised 2013)</h1>
          <div class="small" style="text-align:center;">National Cadet Corps Senior Division/Wing Enrolment Form (See Rules 7 and 11 of NCC Act, 1948)</div>

          <div class="section">
            <h2>Page 1</h2>
            ${field("Full Name", nccForm.fullName)}
            ${field("Nationality & Date of Birth (DD/MM/YYYY)", `${nccForm.nationality} ${nccForm.dob}`.trim())}
            ${field("Father's / Guardian's Name", nccForm.fatherName)}
            ${field("Mother's Name", nccForm.motherName)}
            ${field("Residential Address", nccForm.address)}
            ${field("Mobile No.", nccForm.mobile)}
            ${field("E-mail ID", nccForm.email)}
            ${field("Blood Group", nccForm.bloodGroup)}
            ${field("Sex", nccForm.sex)}
            ${field("Nearest Railway Station", nccForm.nearestRailway)}
            ${field("Nearest Police Station", nccForm.nearestPolice)}
            ${field("Educational Qualifications & Marks (%)", nccForm.education)}
            ${field("Identification Marks (2)", nccForm.idMarks)}
            ${field("Convicted by court? Details", nccForm.convictions)}
            ${field("School/College and Stream", nccForm.schoolCollege)}
          </div>

          <div class="section">
            <h2>Page 2</h2>
            ${field("Willing to be enrolled under NCC Act 1948", nccForm.willingEnroll)}
            ${field("NCC Unit to be enrolled in", nccForm.unitToEnroll)}
            ${field("Previously enrolled in NCC? Enrolment No.", nccForm.enrolledEarlier)}
            ${field("Dismissed from NCC/TA/Armed Forces? Details", nccForm.dismissedDetails)}
            ${field("Next of Kin (address + relationship + phone)", nccForm.nextOfKin)}
            ${field("Banker IFSC Code", nccForm.bankerIfsc)}
            ${field("Bank Account No.", nccForm.bankAcct)}
            ${field("Aadhar/UID No.", nccForm.aadhar)}
            ${field("PAN Card No.", nccForm.pan)}
            ${field("Place / Date", `${nccForm.place} / ${nccForm.declarationDate}`.trim())}
            <div class="signature">Signature of Applicant: ____________________</div>
          </div>

          <div class="section">
            <h2>Declarations</h2>
            <p class="small">I solemnly declare that the answers given are true and that no part is false, and that I am willing to fulfil the engagement made.</p>
            <p class="small">I further promise that after enrolment, I will have no claim on authorities for any compensation in the event of injury during NCC activities.</p>
            <p class="small">I understand I have no service liability.</p>
            <div class="line">Place: ${nccForm.place || "__________"} &nbsp;&nbsp; Date: ${nccForm.declarationDate || "__________"}</div>
            <div class="signature">Signature of Applicant: ____________________</div>
            <div class="signature">Signature of Parent/Guardian: ____________________</div>
          </div>

          <div class="section">
            <h2>Medical Officer Certificate</h2>
            ${field("Fit/Unfit for enrolment", "")}
            <div class="signature">Signature & Designation (Medical Officer): ____________________</div>
          </div>

          <div class="section">
            <h2>Indemnity Bond (Summary)</h2>
            <p class="small">Applicant agrees not to claim against Government or NCC authorities for loss/injury/death during NCC events and indemnifies Government against third-party claims.</p>
            <div class="signature">Signature of Applicant: ____________________</div>
            <div class="signature">Signature of Parent/Guardian: ____________________</div>
          </div>

          <div class="section">
            <h2>NCC Cadets Welfare Society</h2>
            ${field("Cadet Name", nccForm.fullName)}
            ${field("Father/Mother/Guardian Occupation & Income", "")}
            ${field("Nominee(s) and share of assistance", "")}
            <p class="small">Membership valid while enrolled as cadet. Subscription Rs. 4/-.</p>
          </div>
        </body>
      </html>
    `;

    const win = window.open("", "_blank");
    if (!win) {
      toast({ variant: "destructive", title: "Popup blocked", description: "Allow popups to download the PDF." });
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <Tabs defaultValue="apply" className="w-full">
      <TabsList className="grid w-full grid-cols-3 max-w-3xl mx-auto">
        <TabsTrigger value="apply">NSS Enrolment</TabsTrigger>
        <TabsTrigger value="ncc">NCC Enrolment</TabsTrigger>
        <TabsTrigger value="review">Review Applications</TabsTrigger>
      </TabsList>
      <TabsContent value="apply">
        <Card className="max-w-2xl mx-auto mt-6 animated-border-card">
          <CardHeader>
            <CardTitle>NSS Enrolment Form</CardTitle>
            <CardDescription>Fill all fields exactly as required.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Upload Passport Photo</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => setNssPhoto(reader.result as string);
                    reader.readAsDataURL(file);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Full Name (Block Letters)</Label>
                <Input value={nssName} onChange={(e) => setNssName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Nationality</Label>
                <Input value={nssNationality} onChange={(e) => setNssNationality(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>DOB (DD/MM/YYYY)</Label>
                <Input value={nssDob} onChange={(e) => setNssDob(e.target.value)} placeholder="DD/MM/YYYY" />
              </div>
              <div className="space-y-2">
                <Label>Father's / Guardian's Name</Label>
                <Input value={nssFather} onChange={(e) => setNssFather(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Mother's Name</Label>
                <Input value={nssMother} onChange={(e) => setNssMother(e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Residential Address</Label>
                <Textarea
                  value={nssAddress}
                  onChange={(e) => setNssAddress(e.target.value)}
                  placeholder="Landmark, Village, Tehsil/Taluk, District, Post Office, City, State, Pin Code"
                />
              </div>
              <div className="space-y-2">
                <Label>Mobile No.</Label>
                <Input value={nssMobile} onChange={(e) => setNssMobile(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Course / Stream</Label>
                <Input value={nssCourse} onChange={(e) => setNssCourse(e.target.value)} placeholder="e.g., B.Sc Computer Science" />
              </div>
              <div className="space-y-2">
                <Label>Age</Label>
                <Input value={nssAge} onChange={(e) => setNssAge(e.target.value)} placeholder="e.g., 20" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={nssEmail} onChange={(e) => setNssEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Blood Group</Label>
                <Input value={nssBlood} onChange={(e) => setNssBlood(e.target.value)} />
              </div>
            <div className="space-y-2">
              <Label>Sex</Label>
              <Input value={nssSex} onChange={(e) => setNssSex(e.target.value)} placeholder="Male / Female / Other" />
            </div>
          </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="glow" onClick={handleNssDownload}>Download A4 PDF</Button>
              <Button variant="secondary" onClick={handleApply}>Submit NSS Application</Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="ncc">
        <Card className="max-w-4xl mx-auto mt-6 animated-border-card">
          <CardHeader>
            <CardTitle>NCC Enrolment (SD/SW)</CardTitle>
            <CardDescription>Complete all fields as per NCC Form 1 Appendix ‘A’. Use the download button to get an A4 PDF.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={nccForm.fullName} onChange={(e) => updateNccField("fullName", e.target.value)} placeholder="In block letters" />
              </div>
              <div className="space-y-2">
                <Label>Upload Passport Photo</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => setNccPhoto(reader.result as string);
                    reader.readAsDataURL(file);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Nationality & DOB (DD/MM/YYYY)</Label>
                <Input value={nccForm.nationality} onChange={(e) => updateNccField("nationality", e.target.value)} placeholder="Nationality" className="mb-2" />
                <Input value={nccForm.dob} onChange={(e) => updateNccField("dob", e.target.value)} placeholder="DD/MM/YYYY" />
              </div>
              <div className="space-y-2">
                <Label>Father's / Guardian's Name</Label>
                <Input value={nccForm.fatherName} onChange={(e) => updateNccField("fatherName", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Mother's Name</Label>
                <Input value={nccForm.motherName} onChange={(e) => updateNccField("motherName", e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Residential Address</Label>
                <Textarea value={nccForm.address} onChange={(e) => updateNccField("address", e.target.value)} placeholder="Landmark, Village, Tehsil/Taluk, District, Post Office, City, State, Pin Code" />
              </div>
              <div className="space-y-2">
                <Label>Mobile No.</Label>
                <Input value={nccForm.mobile} onChange={(e) => updateNccField("mobile", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={nccForm.email} onChange={(e) => updateNccField("email", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Blood Group</Label>
                <Input value={nccForm.bloodGroup} onChange={(e) => updateNccField("bloodGroup", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Sex</Label>
                <Input value={nccForm.sex} onChange={(e) => updateNccField("sex", e.target.value)} placeholder="Male / Female / Other" />
              </div>
              <div className="space-y-2">
                <Label>Nearest Railway Station</Label>
                <Input value={nccForm.nearestRailway} onChange={(e) => updateNccField("nearestRailway", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Nearest Police Station</Label>
                <Input value={nccForm.nearestPolice} onChange={(e) => updateNccField("nearestPolice", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Educational Qualifications & Marks (%)</Label>
                <Textarea value={nccForm.education} onChange={(e) => updateNccField("education", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Identification Marks (at least two)</Label>
                <Textarea value={nccForm.idMarks} onChange={(e) => updateNccField("idMarks", e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Convicted by a criminal court? (Details, attach docs)</Label>
                <Textarea value={nccForm.convictions} onChange={(e) => updateNccField("convictions", e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>School/College and Stream</Label>
                <Input value={nccForm.schoolCollege} onChange={(e) => updateNccField("schoolCollege", e.target.value)} />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Willing to be enrolled under NCC Act 1948</Label>
                <Input value={nccForm.willingEnroll} onChange={(e) => updateNccField("willingEnroll", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>NCC Unit to be enrolled in</Label>
                <Input value={nccForm.unitToEnroll} onChange={(e) => updateNccField("unitToEnroll", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Previously enrolled in NCC? Enrolment No.</Label>
                <Input value={nccForm.enrolledEarlier} onChange={(e) => updateNccField("enrolledEarlier", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Dismissed from NCC/TA/Armed Forces? Details</Label>
                <Textarea value={nccForm.dismissedDetails} onChange={(e) => updateNccField("dismissedDetails", e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Next of Kin (address, relationship, phone)</Label>
                <Textarea value={nccForm.nextOfKin} onChange={(e) => updateNccField("nextOfKin", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Banker IFSC</Label>
                <Input value={nccForm.bankerIfsc} onChange={(e) => updateNccField("bankerIfsc", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Bank Account No.</Label>
                <Input value={nccForm.bankAcct} onChange={(e) => updateNccField("bankAcct", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Aadhar/UID No.</Label>
                <Input value={nccForm.aadhar} onChange={(e) => updateNccField("aadhar", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>PAN Card No.</Label>
                <Input value={nccForm.pan} onChange={(e) => updateNccField("pan", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Place</Label>
                <Input value={nccForm.place} onChange={(e) => updateNccField("place", e.target.value)} />
              </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input value={nccForm.declarationDate} onChange={(e) => updateNccField("declarationDate", e.target.value)} placeholder="DD/MM/YYYY" />
            </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="glow" onClick={handleNccDownload}>Download A4 PDF</Button>
              <Button variant="secondary" onClick={handleNccSubmit}>Submit NCC Application</Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="review">
        {!canReview ? (
          <div className="mt-6 text-center text-muted-foreground">
            You do not have permission to view review applications.
          </div>
        ) : (
        <Card className="mt-6 animated-border-card">
          <CardHeader>
            <CardTitle>Student Applications</CardTitle>
            <CardDescription>
              Review and approve or deny applications from students.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.filter((app) => app.status === "PENDING").length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No pending applications.
                    </TableCell>
                  </TableRow>
                )}
                {applications
                  .filter((app) => app.status === "PENDING")
                  .map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{app.mobile || "—"}</span>
                          {app.mobile && (
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => navigator.clipboard.writeText(app.mobile)}
                            >
                              Copy
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{app.group}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">PENDING</Badge>
                          {app.submittedAt && (
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(app.submittedAt), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-green-600 hover:bg-green-100/50 hover:text-green-700 border-green-600/50"
                          onClick={() => handleApplication(app.id, "Approved")}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-red-600 hover:bg-red-100/50 hover:text-red-700 border-red-600/50"
                          onClick={() => handleApplication(app.id, "Denied")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}
