import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, Calendar, User, Edit } from "lucide-react";
import { formatDate } from "@/lib/date";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface PersonalInformationCardProps {
  student: {
    id: string;
    email: string;
    phone: string;
    birth_date: string;
    name: string;
 };
  timezone?: string;
}

export default function PersonalInformationCard({ student, timezone }: PersonalInformationCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Personal Information
        </CardTitle>
        <Link to={`/student/${student.id}/edit`}>
          <Button variant="ghost" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail className="h-4 w-4" />
          <span>{student.email}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="h-4 w-4" />
          <span>{student.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Born {formatDate(student.birth_date, timezone)}</span>
        </div>
      </CardContent>
    </Card>
  );
}