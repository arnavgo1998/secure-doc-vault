
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDocuments } from "@/contexts/DocumentContext";
import { useToast } from "@/hooks/use-toast";

interface DocumentEditorProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    id: string;
    insuranceType: string | null;
    provider: string | null;
    premium: string | null;
  } | null;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({ isOpen, onClose, document }) => {
  const { updateDocumentDetails } = useDocuments();
  const { toast } = useToast();
  
  const [insuranceType, setInsuranceType] = useState(document?.insuranceType || "");
  const [provider, setProvider] = useState(document?.provider || "");
  const [premium, setPremium] = useState(document?.premium || "");
  
  const handleSave = async () => {
    if (!document) return;
    
    try {
      await updateDocumentDetails(document.id, {
        insuranceType,
        provider,
        premium
      });
      
      toast({
        title: "Document updated",
        description: "Your document details have been saved",
      });
      
      onClose();
    } catch (error) {
      console.error(error);
      toast({
        title: "Update failed",
        description: "There was an error updating your document",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Document Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="insuranceType">Insurance Type</Label>
            <Input
              id="insuranceType"
              value={insuranceType}
              onChange={(e) => setInsuranceType(e.target.value)}
              placeholder="e.g., Health, Auto, Life"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <Input
              id="provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              placeholder="e.g., Blue Cross, State Farm"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="premium">Premium</Label>
            <Input
              id="premium"
              value={premium}
              onChange={(e) => setPremium(e.target.value)}
              placeholder="e.g., 150.00"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentEditor;
