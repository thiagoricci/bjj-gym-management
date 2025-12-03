import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Mail, MessageCircle, FileText, ExternalLink } from "lucide-react";

export default function HelpCenter() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Help Center</h1>
        <p className="text-muted-foreground mt-2">
          Guides, resources, and support for managing your academy.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Contact Support
            </CardTitle>
            <CardDescription>Need direct assistance?</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Our support team is available Mon-Fri, 9am-5pm EST to help with any technical issues.
            </p>
            <Button className="w-full" variant="outline" asChild>
              <a href="mailto:support@jiujitsumanager.com">
                <Mail className="mr-2 h-4 w-4" />
                Email Support
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Documentation
            </CardTitle>
            <CardDescription>Detailed feature guides</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Browse our comprehensive documentation for in-depth tutorials and feature explanations.
            </p>
            <Button className="w-full" variant="outline" asChild>
              <a href="/documentation" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Docs
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Community
            </CardTitle>
            <CardDescription>Connect with other owners</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Join our Discord community to share tips, ask questions, and network with other academy owners.
            </p>
            <Button className="w-full" variant="outline" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Understanding Your Dashboard</CardTitle>
              <CardDescription>
                A guide to the key metrics and charts on your main overview page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Key Metrics</h3>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li><strong>Total Students:</strong> The total count of active students in your academy.</li>
                  <li><strong>Active Attendance:</strong> Percentage of students who have attended at least one class in the last 30 days.</li>
                  <li><strong>Monthly Revenue:</strong> Estimated revenue based on active memberships.</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Charts</h3>
                <p className="text-muted-foreground">
                  The dashboard features visual charts for attendance trends over time and belt rank distribution. Use these to identify growth patterns and retention issues.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Managing Students</CardTitle>
              <CardDescription>
                How to add, edit, and track student progress.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Adding New Students</h3>
                <p className="text-muted-foreground">
                  Use the "Add Student" button in the sidebar or top navigation. You'll need to provide their basic contact info. You can assign a membership plan immediately or later.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Promotions</h3>
                <p className="text-muted-foreground">
                  To promote a student, go to their profile page. Click on the belt icon to update their rank or add stripes. The system tracks the date of each promotion.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Attendance</h3>
                <p className="text-muted-foreground">
                  Students can be checked in manually from the Attendance page, or the system can auto-detect classes based on the current time if your schedule is set up.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Stripe Integration & Payments</CardTitle>
              <CardDescription>
                Setting up and managing your financial operations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Connecting Stripe</h3>
                <p className="text-muted-foreground">
                  Navigate to Settings {'>'} Stripe Integration. Click "Connect Stripe" to link your existing Stripe account or create a new one. This is required to process payments.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Membership Plans</h3>
                <p className="text-muted-foreground">
                  Create different membership tiers (e.g., Unlimited, 2x/Week) in the Memberships section. These plans will be available to select when adding or editing students.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Handling Failed Payments</h3>
                <p className="text-muted-foreground">
                  Stripe automatically retries failed payments according to your Stripe account settings. You can view payment status in the student's profile under "Payment History".
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Account & Academy Settings</CardTitle>
              <CardDescription>
                Configuring your academy profile and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Academy Profile</h3>
                <p className="text-muted-foreground">
                  Update your academy name, address, and contact email in the Settings page. This information appears on invoices and emails sent to students.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Timezone</h3>
                <p className="text-muted-foreground">
                  Ensure your timezone is set correctly in Settings. This is critical for the class schedule and attendance tracking to function properly.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Security</h3>
                <p className="text-muted-foreground">
                  You can update your password and email address in the "Account Security" section. We recommend using a strong, unique password.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}