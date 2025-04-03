
import React from "react";
import AppHeader from "@/components/AppHeader";
import DocumentUploader from "@/components/DocumentUploader";
import DocumentList from "@/components/DocumentList";
import InviteCodeManager from "@/components/InviteCodeManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDocuments } from "@/contexts/DocumentContext";

const DashboardPage: React.FC = () => {
  const { documents, sharedDocuments } = useDocuments();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      
      <main className="flex-1 mobile-container py-6">
        <h1 className="text-2xl font-bold mb-6">Document Dashboard</h1>
        
        <Tabs defaultValue="documents" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="documents">My Documents</TabsTrigger>
            <TabsTrigger value="shared">Shared With Me</TabsTrigger>
          </TabsList>
          
          <TabsContent value="documents" className="space-y-6">
            <DocumentUploader />
            
            <DocumentList
              documents={documents}
              emptyMessage="You haven't uploaded any documents yet"
              title="Your Insurance Documents"
            />
            
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Sharing Options</h2>
              <InviteCodeManager />
            </div>
          </TabsContent>
          
          <TabsContent value="shared" className="space-y-6">
            <DocumentList
              documents={sharedDocuments}
              emptyMessage="No documents have been shared with you yet"
              title="Documents Shared With You"
              isShared={true}
            />
            
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Access Shared Documents</h2>
              <InviteCodeManager />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default DashboardPage;
