
import React from "react";
import { File } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  ownerId: string;
  createdAt: string;
  url: string;
}

interface DocumentListProps {
  documents: Document[];
  emptyMessage: string;
  title: string;
}

const DocumentList: React.FC<DocumentListProps> = ({ documents, emptyMessage, title }) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-brand-dark">{title}</h2>
      
      {documents.length === 0 ? (
        <div className="text-center py-8 bg-accent/30 rounded-lg">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {documents.map(doc => (
            <Card key={doc.id} className="overflow-hidden group hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded">
                    <File className="h-6 w-6 text-primary" />
                  </div>
                  
                  <div className="flex-1 overflow-hidden">
                    <h3 className="font-medium text-sm sm:text-base truncate">{doc.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(doc.size)}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentList;
