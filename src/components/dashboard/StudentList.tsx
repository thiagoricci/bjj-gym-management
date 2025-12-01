import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BeltBadge, { BeltRank } from "@/components/BeltBadge";
import { formatDate } from "@/lib/date";
import { useAuth } from "@/contexts/AuthContext";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Student {
  id: string;
  name: string;
  belt: string;
  join_date: string;
  status: string;
  membership_status?: string;
}

interface StudentListProps {
  title: string;
  students: Student[];
  emptyMessage?: string;
  itemsPerPage?: number;
}

export default function StudentList({
  title,
  students,
  emptyMessage = "No students found",
  itemsPerPage = 5,
}: StudentListProps) {
  const { organization } = useAuth();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(students.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStudents = students.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {students.length === 0 ? (
            <p className="text-muted-foreground text-sm">{emptyMessage}</p>
          ) : (
            <>
              {currentStudents.map((student, index) => (
                <div
                  key={student.id || index}
                  className="flex items-center justify-between rounded-lg border border-border p-4 transition-all hover:border-primary/50 hover:shadow-md cursor-pointer"
                  onClick={() => navigate(`/student/${student.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold ${
                        student.status === 'trial'
                        ? 'bg-blue-100 text-blue-800'
                        : student.status === 'none' || !student.status
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {student.name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{student.name || "Unknown Student"}</p>
                      <p className="text-sm text-muted-foreground">
                        {student.status === 'trial' ? 'Started' : student.status === 'none' || !student.status ? 'Status: None' : 'Joined'} {formatDate(student.join_date, organization?.timezone)}
                      </p>
                    </div>
                  </div>
                  <BeltBadge rank={student.belt as BeltRank} />
                </div>
              ))}

              {totalPages > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => handlePageChange(currentPage - 1)}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          isActive={page === currentPage}
                          onClick={() => handlePageChange(page)}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => handlePageChange(currentPage + 1)}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}