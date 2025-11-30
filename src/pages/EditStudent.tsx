import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Trash2 } from "lucide-react";
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

export default function EditStudent() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    birthDate: "",
    belt: "white",
    status: "trial",
    membershipStatus: "active",
    membershipPlanId: "",
  });

  const { data: student, isLoading: isLoadingStudent } = useQuery({
    queryKey: ["student", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const { data: membershipPlans } = useQuery({
    queryKey: ["membershipPlans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("membership_plans")
        .select("*")
        .order("price");
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name || "",
        email: student.email || "",
        phone: student.phone || "",
        birthDate: student.birth_date || "",
        belt: student.belt || "white",
        status: student.status || "trial",
        membershipStatus: student.membership_status || "active",
        membershipPlanId: student.membership_plan_id?.toString() || "",
      });
    }
  }, [student]);

  const updateStudentMutation = useMutation({
    mutationFn: async (updatedStudent: any) => {
      const { error } = await supabase
        .from("students")
        .update(updatedStudent)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student", id] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Student updated successfully!");
      navigate("/students");
    },
    onError: (error) => {
      toast.error(`Error updating student: ${error.message}`);
    },
  });

  const deleteStudentMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("students").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Student deleted successfully");
      navigate("/students");
    },
    onError: (error) => {
      toast.error(`Error deleting student: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error("Please fill in all required fields");
      return;
    }

    const studentData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      birth_date: formData.birthDate || null,
      belt: formData.belt,
      status: formData.status,
      membership_status: formData.status === 'student' ? formData.membershipStatus : null,
      membership_plan_id: formData.status === 'student' && formData.membershipPlanId ? parseInt(formData.membershipPlanId) : null,
    };

    updateStudentMutation.mutate(studentData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoadingStudent) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Edit Student</h2>
          <p className="text-muted-foreground">Update student information</p>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setIsDeleteDialogOpen(true)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Student
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="Enter student's full name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="student@email.com"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+55 11 98765-4321"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate">Birth Date</Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => handleChange("birthDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="belt">Current Belt</Label>
              <Select value={formData.belt} onValueChange={(value) => handleChange("belt", value)}>
                <SelectTrigger id="belt">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="white">White Belt</SelectItem>
                  <SelectItem value="blue">Blue Belt</SelectItem>
                  <SelectItem value="purple">Purple Belt</SelectItem>
                  <SelectItem value="brown">Brown Belt</SelectItem>
                  <SelectItem value="black">Black Belt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.status === "student" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="membershipPlan">Membership Plan</Label>
                  <Select
                    value={formData.membershipPlanId}
                    onValueChange={(value) => handleChange("membershipPlanId", value)}
                  >
                    <SelectTrigger id="membershipPlan">
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {membershipPlans?.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id.toString()}>
                          {plan.name} - {plan.price === "0" || plan.price === "0.00" ? "Free" : plan.price}/{plan.period}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="membershipStatus">Membership Status</Label>
                  <Select value={formData.membershipStatus} onValueChange={(value) => handleChange("membershipStatus", value)}>
                    <SelectTrigger id="membershipStatus">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="frozen">Frozen</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1">
                Save Changes
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/students")}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the student
              and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteStudentMutation.mutate()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}