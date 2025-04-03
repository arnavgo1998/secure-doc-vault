
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Upload, Share2, X, Edit, Trash2, Eye } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

type Insurance = {
  id: string;
  name: string;
  type: string;
  policy_number: string;
  provider: string;
  premium: number;
  due_date: string;
  file_path: string;
  owner_id: string;
  owner_name?: string;
  created_at: string;
};

type Invitation = {
  id: string;
  code: string;
  owner_id: string;
  owner_name: string;
  created_at: string;
};

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("my-docs");
  const [myInsurances, setMyInsurances] = useState<Insurance[]>([]);
  const [sharedInsurances, setSharedInsurances] = useState<Insurance[]>([]);
  const [uploading, setUploading] = useState(false);
  const [myInviteCode, setMyInviteCode] = useState<string>("");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentInsurance, setCurrentInsurance] = useState<Insurance | null>(null);
  const [editForm, setEditForm] = useState({
    type: "",
    provider: "",
    premium: 0,
  });
  const [myShares, setMyShares] = useState<{userId: string, userName: string}[]>([]);

  useEffect(() => {
    if (user) {
      fetchMyInsurances();
      fetchSharedInsurances();
      fetchOrCreateInviteCode();
      fetchMyShares();
    }
  }, [user]);

  const fetchMyInsurances = async () => {
    try {
      const { data, error } = await supabase
        .from('insurances')
        .select('*')
        .eq('owner_id', user?.id);
      
      if (error) throw error;
      setMyInsurances(data || []);
    } catch (error: any) {
      console.error('Error fetching my insurances:', error.message);
    }
  };

  const fetchSharedInsurances = async () => {
    try {
      const { data, error } = await supabase
        .from('shared_insurances')
        .select(`
          insurances (
            id, name, type, policy_number, provider, premium, due_date, file_path, owner_id, created_at
          ),
          profiles!insurance_owner (
            full_name
          )
        `)
        .eq('viewer_id', user?.id);
      
      if (error) throw error;
      
      const formattedData = data?.map(item => ({
        ...item.insurances,
        owner_name: item.profiles?.full_name || 'Unknown'
      })) || [];
      
      setSharedInsurances(formattedData);
    } catch (error: any) {
      console.error('Error fetching shared insurances:', error.message);
    }
  };

  const fetchOrCreateInviteCode = async () => {
    try {
      // Check if user already has an invite code
      const { data, error } = await supabase
        .from('invite_codes')
        .select('code')
        .eq('owner_id', user?.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setMyInviteCode(data.code);
      } else {
        // Generate a new code if one doesn't exist
        const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const { error: insertError } = await supabase
          .from('invite_codes')
          .insert({
            owner_id: user?.id,
            code: newCode
          });
        
        if (insertError) throw insertError;
        setMyInviteCode(newCode);
      }
    } catch (error: any) {
      console.error('Error with invite code:', error.message);
    }
  };

  const fetchMyShares = async () => {
    try {
      const { data, error } = await supabase
        .from('shared_insurances')
        .select(`
          viewer_id,
          profiles!shared_insurance_viewer (
            full_name
          )
        `)
        .eq('owner_id', user?.id);
      
      if (error) throw error;
      
      const shares = data?.map(item => ({
        userId: item.viewer_id,
        userName: item.profiles?.full_name || 'Unknown User'
      })) || [];
      
      setMyShares(shares);
    } catch (error: any) {
      console.error('Error fetching shares:', error.message);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Only accept PDF files
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    
    try {
      // Upload file to storage
      const fileName = `${user?.id}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('insurance_documents')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      // Extract PDF data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('filePath', fileName);

      // Call your extract function
      const { data: extractData, error: extractError } = await supabase.functions.invoke('extract-pdf-data', {
        body: formData
      });

      if (extractError) throw extractError;
      
      const {
        type = 'General',
        policy_number = 'Unknown',
        provider = 'Unknown',
        premium = 0,
        due_date = null
      } = extractData || {};
      
      // Insert the document into the database
      const { error: insertError } = await supabase
        .from('insurances')
        .insert({
          owner_id: user?.id,
          name: `${type} Insurance`,
          type,
          policy_number,
          provider,
          premium,
          due_date,
          file_path: fileName
        });
      
      if (insertError) throw insertError;
      
      toast({
        title: "Upload successful",
        description: "Your insurance document has been uploaded"
      });
      
      // Refresh the list
      fetchMyInsurances();
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: error.message || "There was an error uploading your document",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleAddInviteCode = async () => {
    if (!inviteCode.trim()) {
      toast({
        title: "Invalid code",
        description: "Please enter a valid invite code",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Find the invite code
      const { data: inviteData, error: inviteError } = await supabase
        .from('invite_codes')
        .select('owner_id')
        .eq('code', inviteCode.trim())
        .single();
      
      if (inviteError) throw new Error("Invalid invite code");
      
      if (inviteData.owner_id === user?.id) {
        throw new Error("You cannot add your own invite code");
      }
      
      // Check if this share already exists
      const { data: existingShare, error: checkError } = await supabase
        .from('shared_insurances')
        .select('id')
        .eq('owner_id', inviteData.owner_id)
        .eq('viewer_id', user?.id)
        .single();
      
      if (!checkError && existingShare) {
        throw new Error("You already have access to this user's documents");
      }
      
      // Create the share relationship
      const { error: shareError } = await supabase
        .from('shared_insurances')
        .insert({
          owner_id: inviteData.owner_id,
          viewer_id: user?.id
        });
      
      if (shareError) throw shareError;
      
      toast({
        title: "Success",
        description: "You now have access to shared documents"
      });
      
      // Refresh the shared docs list
      fetchSharedInsurances();
      setInviteDialogOpen(false);
      setInviteCode("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add invite code",
        variant: "destructive"
      });
    }
  };

  const handleEditInsurance = (insurance: Insurance) => {
    setCurrentInsurance(insurance);
    setEditForm({
      type: insurance.type,
      provider: insurance.provider,
      premium: insurance.premium,
    });
    setEditDialogOpen(true);
  };

  const saveInsuranceEdit = async () => {
    if (!currentInsurance) return;
    
    try {
      const { error } = await supabase
        .from('insurances')
        .update({
          type: editForm.type,
          provider: editForm.provider,
          premium: editForm.premium,
          name: `${editForm.type} Insurance`, // Update name to match new type
        })
        .eq('id', currentInsurance.id);
      
      if (error) throw error;
      
      toast({
        title: "Successfully updated",
        description: "Your insurance details have been updated"
      });
      
      fetchMyInsurances();
      setEditDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update insurance details",
        variant: "destructive"
      });
    }
  };

  const removeAccess = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('shared_insurances')
        .delete()
        .eq('owner_id', user?.id)
        .eq('viewer_id', userId);
      
      if (error) throw error;
      
      toast({
        title: "Access removed",
        description: "User no longer has access to your documents"
      });
      
      fetchMyShares();
    } catch (error: any) {
      toast({
        title: "Failed to remove access",
        description: error.message || "An error occurred",
        variant: "destructive"
      });
    }
  };

  const downloadInsurance = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('insurance_documents')
        .download(filePath);
      
      if (error) throw error;
      
      // Create a download link and trigger it
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filePath.split('/').pop() || 'insurance_document.pdf';
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('Error downloading file:', error);
      toast({
        title: "Download failed",
        description: error.message || "Failed to download document",
        variant: "destructive"
      });
    }
  };

  const deleteInsurance = async (id: string, filePath: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    
    try {
      // Delete from database
      const { error: dbError } = await supabase
        .from('insurances')
        .delete()
        .eq('id', id);
      
      if (dbError) throw dbError;
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('insurance_documents')
        .remove([filePath]);
      
      if (storageError) {
        console.error('Warning: File deleted from database but not from storage:', storageError);
      }
      
      toast({
        title: "Document deleted",
        description: "Your insurance document has been deleted"
      });
      
      fetchMyInsurances();
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete document",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Insurance Dashboard</h1>
            <p className="text-gray-500">Manage your insurance documents</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-2">
            <Button onClick={signOut} variant="outline">Sign Out</Button>
            <div className="relative">
              <Input
                type="file"
                id="document-upload"
                className="hidden"
                accept=".pdf"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <Label htmlFor="document-upload" asChild>
                <Button className="w-full" disabled={uploading}>
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? "Uploading..." : "Upload Document"}
                </Button>
              </Label>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-docs">My Documents</TabsTrigger>
            <TabsTrigger value="shared-docs">Shared With Me</TabsTrigger>
          </TabsList>
          
          <TabsContent value="my-docs" className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">My Invite Code</h2>
                <div className="flex items-center gap-2 bg-gray-100 p-2 rounded">
                  <code className="font-mono">{myInviteCode}</code>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      navigator.clipboard.writeText(myInviteCode);
                      toast({
                        title: "Copied",
                        description: "Invite code copied to clipboard"
                      });
                    }}
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-4">
                <h2 className="text-lg font-medium">People with access to my documents</h2>
                {myShares.length === 0 ? (
                  <p className="text-gray-500">No one has access to your documents yet</p>
                ) : (
                  <div className="space-y-2">
                    {myShares.map(share => (
                      <div key={share.userId} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span>{share.userName}</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeAccess(share.userId)}
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-lg font-medium">My Insurance Documents</h2>
              {myInsurances.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-500">You haven't uploaded any insurance documents yet</p>
                    <Label htmlFor="document-upload" asChild>
                      <Button className="mt-4" variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Document
                      </Button>
                    </Label>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myInsurances.map(insurance => (
                    <Card key={insurance.id}>
                      <CardHeader>
                        <CardTitle>{insurance.name}</CardTitle>
                        <CardDescription>
                          Policy: {insurance.policy_number}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-sm font-medium">Provider</p>
                            <p className="text-sm">{insurance.provider}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Premium</p>
                            <p className="text-sm">${insurance.premium}</p>
                          </div>
                        </div>
                        {insurance.due_date && (
                          <div>
                            <p className="text-sm font-medium">Due Date</p>
                            <p className="text-sm">{new Date(insurance.due_date).toLocaleDateString()}</p>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="justify-between">
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEditInsurance(insurance)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => downloadInsurance(insurance.file_path)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => deleteInsurance(insurance.id, insurance.file_path)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="shared-docs" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">Documents Shared With Me</h2>
              <Button 
                onClick={() => setInviteDialogOpen(true)} 
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Invite Code
              </Button>
            </div>
            
            {sharedInsurances.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">No documents have been shared with you yet</p>
                  <Button 
                    onClick={() => setInviteDialogOpen(true)} 
                    className="mt-4"
                    variant="outline"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Invite Code
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sharedInsurances.map(insurance => (
                  <Card key={insurance.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{insurance.name}</CardTitle>
                          <CardDescription>
                            From: {insurance.owner_name}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-sm font-medium">Policy</p>
                          <p className="text-sm">{insurance.policy_number}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Provider</p>
                          <p className="text-sm">{insurance.provider}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-sm font-medium">Premium</p>
                          <p className="text-sm">${insurance.premium}</p>
                        </div>
                        {insurance.due_date && (
                          <div>
                            <p className="text-sm font-medium">Due Date</p>
                            <p className="text-sm">{new Date(insurance.due_date).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => downloadInsurance(insurance.file_path)}
                        className="w-full"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Document
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Invite Code Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Invite Code</DialogTitle>
            <DialogDescription>
              Enter an invite code to access shared insurance documents
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-code">Invite Code</Label>
              <Input
                id="invite-code"
                placeholder="Enter invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddInviteCode}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Insurance Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Insurance Details</DialogTitle>
            <DialogDescription>
              Update the details of your insurance document
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="insurance-type">Insurance Type</Label>
              <Input
                id="insurance-type"
                value={editForm.type}
                onChange={(e) => setEditForm({...editForm, type: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="insurance-provider">Provider</Label>
              <Input
                id="insurance-provider"
                value={editForm.provider}
                onChange={(e) => setEditForm({...editForm, provider: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="insurance-premium">Premium ($)</Label>
              <Input
                id="insurance-premium"
                type="number"
                value={editForm.premium}
                onChange={(e) => setEditForm({...editForm, premium: parseFloat(e.target.value) || 0})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveInsuranceEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
