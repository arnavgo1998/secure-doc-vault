
import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  ownerId: string;
  createdAt: string;
  url: string;
}

interface InviteCode {
  code: string;
  ownerId: string;
}

interface DocumentContextType {
  documents: Document[];
  sharedDocuments: Document[];
  uploadDocument: (file: File) => Promise<void>;
  generateInviteCode: () => Promise<string>;
  redeemInviteCode: (code: string) => Promise<void>;
  inviteCode: string | null;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

// Mock database
let DOCUMENTS_DB: Document[] = [];
let INVITE_CODES: InviteCode[] = [];
let USER_INVITES: { userId: string; inviterId: string }[] = [];

export const DocumentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [sharedDocuments, setSharedDocuments] = useState<Document[]>([]);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  // Load documents when user changes
  useEffect(() => {
    if (user) {
      loadDocuments();
      loadSharedDocuments();
      loadInviteCode();
    } else {
      setDocuments([]);
      setSharedDocuments([]);
      setInviteCode(null);
    }
  }, [user]);

  const loadDocuments = () => {
    if (!user) return;
    const userDocs = DOCUMENTS_DB.filter((doc) => doc.ownerId === user.id);
    setDocuments(userDocs);
  };

  const loadSharedDocuments = () => {
    if (!user) return;
    
    // Get all inviter IDs for this user
    const inviterIds = USER_INVITES
      .filter((invite) => invite.userId === user.id)
      .map((invite) => invite.inviterId);
    
    // Get all documents from these inviters
    const shared = DOCUMENTS_DB.filter((doc) => 
      inviterIds.includes(doc.ownerId)
    );
    
    setSharedDocuments(shared);
  };

  const loadInviteCode = () => {
    if (!user) return;
    const userCode = INVITE_CODES.find((code) => code.ownerId === user.id);
    setInviteCode(userCode?.code || null);
  };

  const uploadDocument = async (file: File) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to upload documents",
        variant: "destructive",
      });
      return;
    }

    try {
      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Create document object
      const newDocument: Document = {
        id: `doc-${Date.now()}`,
        name: file.name,
        type: file.type,
        size: file.size,
        ownerId: user.id,
        createdAt: new Date().toISOString(),
        url: URL.createObjectURL(file),
      };
      
      // Add to mock database
      DOCUMENTS_DB.push(newDocument);
      
      // Update state
      setDocuments([...documents, newDocument]);
      
      toast({
        title: "Upload successful",
        description: `${file.name} has been uploaded`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your document",
        variant: "destructive",
      });
      console.error(error);
    }
  };

  const generateInviteCode = async () => {
    if (!user) throw new Error("User not authenticated");
    
    try {
      // Generate a random 6-character code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Check if user already has a code
      const existingCodeIndex = INVITE_CODES.findIndex(
        (invite) => invite.ownerId === user.id
      );
      
      if (existingCodeIndex >= 0) {
        // Update existing code
        INVITE_CODES[existingCodeIndex].code = code;
      } else {
        // Create new code
        INVITE_CODES.push({
          code,
          ownerId: user.id,
        });
      }
      
      setInviteCode(code);
      
      toast({
        title: "Invite code generated",
        description: `Your new invite code is: ${code}`,
      });
      
      return code;
    } catch (error) {
      toast({
        title: "Error generating invite code",
        description: "Please try again later",
        variant: "destructive",
      });
      console.error(error);
      throw error;
    }
  };

  const redeemInviteCode = async (code: string) => {
    if (!user) throw new Error("User not authenticated");
    
    try {
      // Find the invite code
      const invite = INVITE_CODES.find((invite) => invite.code === code);
      
      if (!invite) {
        toast({
          title: "Invalid invite code",
          description: "This invite code does not exist",
          variant: "destructive",
        });
        return;
      }
      
      if (invite.ownerId === user.id) {
        toast({
          title: "Invalid operation",
          description: "You cannot use your own invite code",
          variant: "destructive",
        });
        return;
      }
      
      // Check if already invited
      const alreadyInvited = USER_INVITES.some(
        (inv) => inv.userId === user.id && inv.inviterId === invite.ownerId
      );
      
      if (alreadyInvited) {
        toast({
          title: "Already connected",
          description: "You already have access to these documents",
          variant: "destructive",
        });
        return;
      }
      
      // Add to invited users
      USER_INVITES.push({
        userId: user.id,
        inviterId: invite.ownerId,
      });
      
      // Reload shared documents
      loadSharedDocuments();
      
      toast({
        title: "Invite code redeemed",
        description: "You now have access to shared documents",
      });
    } catch (error) {
      toast({
        title: "Error redeeming invite code",
        description: "Please try again later",
        variant: "destructive",
      });
      console.error(error);
    }
  };

  return (
    <DocumentContext.Provider
      value={{
        documents,
        sharedDocuments,
        uploadDocument,
        generateInviteCode,
        redeemInviteCode,
        inviteCode,
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocuments = () => {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error("useDocuments must be used within a DocumentProvider");
  }
  return context;
};
