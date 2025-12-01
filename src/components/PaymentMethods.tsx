import React, { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { MoreHorizontal, Trash2, Star } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  isDefault: boolean;
}

interface PaymentMethodsProps {
  paymentMethods: PaymentMethod[];
  onAddPaymentMethod: () => void;
  onDeletePaymentMethod: (paymentMethodId: string) => void;
  onSetDefaultPaymentMethod: (paymentMethodId: string) => void;
  isLoading?: boolean;
}

const PaymentMethods: React.FC<PaymentMethodsProps> = ({
  paymentMethods,
  onAddPaymentMethod,
  onDeletePaymentMethod,
  onSetDefaultPaymentMethod,
  isLoading = false,
}) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSetDefaultDialogOpen, setIsSetDefaultDialogOpen] = useState(false);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(
    null
  );

  const handleDeleteClick = (methodId: string) => {
    setSelectedMethodId(methodId);
    setIsDeleteDialogOpen(true);
  };

  const handleSetDefaultClick = (methodId: string) => {
    setSelectedMethodId(methodId);
    setIsSetDefaultDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedMethodId) {
      onDeletePaymentMethod(selectedMethodId);
    }
    setIsDeleteDialogOpen(false);
    setSelectedMethodId(null);
  };

  const confirmSetDefault = () => {
    if (selectedMethodId) {
      onSetDefaultPaymentMethod(selectedMethodId);
    }
    setIsSetDefaultDialogOpen(false);
    setSelectedMethodId(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Methods</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground">Loading payment methods...</p>
        ) : paymentMethods.length > 0 ? (
          <ul>
            {paymentMethods.map((method) => (
              <li
                key={method.id}
                className="flex justify-between items-center mb-2"
              >
                <div className="flex items-center">
                  <span>
                    {method.brand} ending in {method.last4}
                  </span>
                  {method.isDefault && (
                    <span className="ml-2 text-xs text-gray-500">(Default)</span>
                  )}
                </div>
                <div className="flex items-center">
                  <span>
                    Expires {method.exp_month}/{method.exp_year}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="ml-2">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() => handleSetDefaultClick(method.id)}
                      >
                        <Star className="mr-2 h-4 w-4" />
                        Set as Default
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(method.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No payment methods on file.</p>
        )}
        <Button onClick={onAddPaymentMethod} className="mt-4">
          Add New Payment Method
        </Button>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              payment method.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedMethodId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Set Default Confirmation Dialog */}
      <AlertDialog
        open={isSetDefaultDialogOpen}
        onOpenChange={setIsSetDefaultDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set as Default?</AlertDialogTitle>
            <AlertDialogDescription>
              This will set the selected payment method as the default for all
              future payments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedMethodId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmSetDefault}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default PaymentMethods;