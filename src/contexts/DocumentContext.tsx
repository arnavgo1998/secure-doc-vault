
import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useToast } from "@/hooks/use-toast";
import { extractPdfInfo } from "@/utils/pdfParser";

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

interface InviteCode {
  code: string;
  ownerId: string;
}

interface SharedAccess {
  ownerId: string;
  userId: string;
}

interface DocumentContextType {
  documents: Document[];
  sharedDocuments: Document[];
  uploadDocument: (file: File) => Promise<void>;
  generateInviteCode: () => Promise<string>;
  redeemInviteCode: (code: string) => Promise<void>;
  inviteCode: string | null;
  revokeAccess: (userId: string) => Promise<void>;
  getSharedWithUsers: () => SharedAccess[];
  updateDocumentDetails: (documentId: string, details: {
    insuranceType?: string | null;
    provider?: string | null;
    premium?: string | null;
  }) => Promise<void>;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

// Mock database
let DOCUMENTS_DB: Document[] = [];
let INVITE_CODES: InviteCode[] = [];
let USER_INVITES: SharedAccess[] = [];

export const DocumentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, getUserById } = useAuth();
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

  const loadSharedDocuments = async () => {
    if (!user) return;
    
    // Get all inviter IDs for this user
    const inviterIds = USER_INVITES
      .filter((invite) => invite.userId === user.id)
      .map((invite) => invite.ownerId);
    
    // Get all documents from these inviters
    const shared = DOCUMENTS_DB.filter((doc) => 
      inviterIds.includes(doc.ownerId)
    );
    
    // Add owner name to shared documents
    const sharedWithOwners = await Promise.all(
      shared.map(async (doc) => {
        const ownerUser = getUserById(doc.ownerId);
        return {
          ...doc,
          ownerName: ownerUser ? ownerUser.name : "Unknown"
        };
      })
    );
    
    setSharedDocuments(sharedWithOwners);
  };

  const loadInviteCode = () => {
    if (!user) return;
    const userCode = INVITE_CODES.find((code) => code.ownerId === user.id);
    setInviteCode(userCode?.code || null);
  };

  const updateDocumentDetails = async (documentId: string, details: {
    insuranceType?: string | null;
    provider?: string | null;
    premium?: string | null;
  }) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to update documents",
        variant: "destructive",
      });
      return;
    }

    try {
      // Find document in database
      const docIndex = DOCUMENTS_DB.findIndex((doc) => doc.id === documentId);
      
      if (docIndex === -1) {
        throw new Error("Document not found");
      }
      
      // Update document
      DOCUMENTS_DB[docIndex] = {
        ...DOCUMENTS_DB[docIndex],
        ...details,
      };
      
      // Update local state
      setDocuments(documents.map((doc) => 
        doc.id === documentId 
          ? { ...doc, ...details } 
          : doc
      ));
      
      toast({
        title: "Document updated",
        description: "Your document details have been updated",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Update failed",
        description: "There was an error updating your document",
        variant: "destructive",
      });
      throw error;
    }
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
      // Show processing toast
      toast({
        title: "Processing document",
        description: "We're extracting information from your document...",
      });
      
      // Extract information from PDF if applicable
      let documentInfo = {
        insuranceType: null,
        policyNumber: null,
        provider: null,
        premium: null,
        dueDate: null,
      };
      
      if (file.type === "application/pdf") {
        documentInfo = await extractPdfInfo(file);
      }
      
      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Format document name based on insurance type
      const baseFileName = file.name;
      const insuranceType = documentInfo.insuranceType || "Unknown";
      const docName = `${insuranceType} Insurance`;
      
      // Create document object
      const newDocument: Document = {
        id: `doc-${Date.now()}`,
        name: docName,
        type: file.type,
        size: file.size,
        ownerId: user.id,
        createdAt: new Date().toISOString(),
        url: URL.createObjectURL(file),
        ...documentInfo
      };
      
      // Add to mock database
      DOCUMENTS_DB.push(newDocument);
      
      // Update state
      setDocuments([...documents, newDocument]);
      
      toast({
        title: "Upload successful",
        description: `${docName} has been uploaded`,
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
        (inv) => inv.userId === user.id && inv.ownerId === invite.ownerId
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
        ownerId: invite.ownerId,
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

  const revokeAccess = async (userId: string) => {
    if (!user) throw new Error("User not authenticated");
    
    try {
      // Filter out the access relationship
      USER_INVITES = USER_INVITES.filter(
        (invite) => !(invite.ownerId === user.id && invite.userId === userId)
      );
      
      toast({
        title: "Access revoked",
        description: "The user no longer has access to your documents",
      });
    } catch (error) {
      toast({
        title: "Error revoking access",
        description: "Please try again later",
        variant: "destructive",
      });
      console.error(error);
    }
  };
  
  const getSharedWithUsers = () => {
    if (!user) return [];
    
    return USER_INVITES.filter((invite) => invite.ownerId === user.id);
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
        revokeAccess,
        getSharedWithUsers,
        updateDocumentDetails,
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
