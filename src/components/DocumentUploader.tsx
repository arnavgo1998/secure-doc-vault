
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload } from "lucide-react";
import { useDocuments } from "@/contexts/DocumentContext";
import { useToast } from "@/hooks/use-toast";

const DocumentUploader: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadDocument } = useDocuments();
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
    
    await handleFileUpload(e.dataTransfer.files[0]);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    await handleFileUpload(e.target.files[0]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileUpload = async (file: File) => {
    // Check file type
    const allowedTypes = [
      "application/pdf", 
      "image/jpeg", 
      "image/png", 
      "image/jpg",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF, image, or document file",
        variant: "destructive",
      });
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 5MB",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsUploading(true);
      await uploadDocument(file);
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card 
      className={`border-2 border-dashed transition-all ${
        isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/20"
      }`}
    >
      <CardContent className="p-0">
        <div
          className="flex flex-col items-center justify-center p-6 text-center cursor-pointer"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          />
          
          <div className="bg-accent/50 p-3 rounded-full mb-3">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          
          <h3 className="text-lg font-medium mb-1">Upload Insurance Document</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Drag and drop or click to select
          </p>
          <Button 
            variant="default" 
            size="sm"
            className="text-xs"
            disabled={isUploading}
          >
            {isUploading ? "Uploading..." : "Select File"}
          </Button>
          <p className="text-xs text-muted-foreground mt-3">
            Supports PDF, JPEG, PNG, DOC (up to 5MB)
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentUploader;
