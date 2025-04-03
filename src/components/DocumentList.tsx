
import React, { useState } from "react";
import { File, ChevronDown, ChevronUp, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDocuments } from "@/contexts/DocumentContext";
import { useAuth } from "@/contexts/AuthContext";

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  ownerId: string;
  ownerName?: string;
  createdAt: string;
  url: string;
  insuranceType: string | null;
  policyNumber: string | null;
  provider: string | null;
  premium: string | null;
  dueDate: string | null;
}

interface DocumentListProps {
  documents: Document[];
  emptyMessage: string;
  title: string;
  isShared?: boolean;
}

const DocumentList: React.FC<DocumentListProps> = ({ 
  documents, 
  emptyMessage, 
  title, 
  isShared = false 
}) => {
  const { user } = useAuth();
  const { revokeAccess, getSharedWithUsers } = useDocuments();
  const [expandedDocs, setExpandedDocs] = useState<string[]>([]);
  const [showAccessManager, setShowAccessManager] = useState(false);
  
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };
  
  const toggleDocExpand = (docId: string) => {
    if (expandedDocs.includes(docId)) {
      setExpandedDocs(expandedDocs.filter(id => id !== docId));
    } else {
      setExpandedDocs([...expandedDocs, docId]);
    }
  };
  
  const sharedUsers = getSharedWithUsers();
  
  const handleRevokeAccess = async (userId: string) => {
    await revokeAccess(userId);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-brand-dark">{title}</h2>
        
        {!isShared && documents.length > 0 && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowAccessManager(!showAccessManager)}
          >
            {showAccessManager ? "Hide Access Manager" : "Manage Access"}
          </Button>
        )}
      </div>
      
      {/* Access Manager */}
      {showAccessManager && !isShared && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <h3 className="font-medium mb-2">Users with access to your documents</h3>
            {sharedUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You haven't shared your documents with anyone yet
              </p>
            ) : (
              <div className="space-y-2">
                {sharedUsers.map((sharedUser) => {
                  const userDetails = user && user.id === sharedUser.userId 
                    ? user 
                    : { name: "Unknown User", email: "Unknown" };
                  
                  return (
                    <div key={sharedUser.userId} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <div>
                        <p className="font-medium">{userDetails.name}</p>
                        <p className="text-xs text-muted-foreground">{userDetails.email}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleRevokeAccess(sharedUser.userId)}
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {documents.length === 0 ? (
        <div className="text-center py-8 bg-accent/30 rounded-lg">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {documents.map(doc => {
            const isExpanded = expandedDocs.includes(doc.id);
            
            return (
              <Card 
                key={doc.id} 
                className="overflow-hidden group hover:border-primary/50 transition-colors"
              >
                <CardContent className="p-0">
                  <div 
                    className="flex items-center gap-3 p-4 cursor-pointer"
                    onClick={() => toggleDocExpand(doc.id)}
                  >
                    <div className="bg-primary/10 p-2 rounded">
                      <File className="h-6 w-6 text-primary" />
                    </div>
                    
                    <div className="flex-1 overflow-hidden">
                      <h3 className="font-medium text-sm sm:text-base truncate">{doc.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(doc.size)}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}</span>
                        {isShared && doc.ownerName && (
                          <>
                            <span>•</span>
                            <span>Shared by {doc.ownerName}</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <Button variant="ghost" size="icon" onClick={(e) => {
                      e.stopPropagation();
                      toggleDocExpand(doc.id);
                    }}>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  {isExpanded && (
                    <div className="p-4 pt-0 border-t">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          {doc.insuranceType && (
                            <div>
                              <p className="text-xs text-muted-foreground">Insurance Type</p>
                              <p className="font-medium">
                                <Badge>{doc.insuranceType}</Badge>
                              </p>
                            </div>
                          )}
                          
                          {doc.policyNumber && (
                            <div>
                              <p className="text-xs text-muted-foreground">Policy Number</p>
                              <p className="font-medium">{doc.policyNumber}</p>
                            </div>
                          )}
                          
                          {doc.provider && (
                            <div>
                              <p className="text-xs text-muted-foreground">Provider</p>
                              <p className="font-medium">{doc.provider}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          {doc.premium && (
                            <div>
                              <p className="text-xs text-muted-foreground">Premium</p>
                              <p className="font-medium">${doc.premium}</p>
                            </div>
                          )}
                          
                          {doc.dueDate && (
                            <div>
                              <p className="text-xs text-muted-foreground">Due Date</p>
                              <p className="font-medium">{doc.dueDate}</p>
                            </div>
                          )}
                          
                          <div className="pt-2">
                            <Button 
                              size="sm" 
                              className="w-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(doc.url, '_blank');
                              }}
                            >
                              View Document
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DocumentList;
