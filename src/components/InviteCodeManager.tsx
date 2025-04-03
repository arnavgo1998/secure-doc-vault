
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Share, Key } from "lucide-react";
import { useDocuments } from "@/contexts/DocumentContext";
import { useToast } from "@/hooks/use-toast";

const InviteCodeManager: React.FC = () => {
  const { inviteCode, generateInviteCode, redeemInviteCode } = useDocuments();
  const [newInviteCode, setNewInviteCode] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const { toast } = useToast();

  const handleGenerateInviteCode = async () => {
    try {
      setIsGenerating(true);
      await generateInviteCode();
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRedeemInviteCode = async () => {
    if (!newInviteCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter an invite code",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsRedeeming(true);
      await redeemInviteCode(newInviteCode.trim());
      setNewInviteCode("");
    } catch (error) {
      console.error(error);
    } finally {
      setIsRedeeming(false);
    }
  };

  const copyInviteCode = () => {
    if (!inviteCode) return;
    
    navigator.clipboard.writeText(inviteCode);
    toast({
      title: "Copied to clipboard",
      description: "Invite code copied",
    });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Your invite code */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Share className="h-4 w-4" />
            Share Your Documents
          </CardTitle>
          <CardDescription>
            Generate an invite code to share your documents with others
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {inviteCode ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="bg-accent p-3 rounded flex-1 font-mono text-center">
                    {inviteCode}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyInviteCode}
                  >
                    Copy
                  </Button>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleGenerateInviteCode}
                  disabled={isGenerating}
                >
                  {isGenerating ? "Generating..." : "Generate New Code"}
                </Button>
              </>
            ) : (
              <Button
                className="w-full"
                onClick={handleGenerateInviteCode}
                disabled={isGenerating}
              >
                {isGenerating ? "Generating..." : "Generate Invite Code"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Redeem invite code */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Key className="h-4 w-4" />
            Access Shared Documents
          </CardTitle>
          <CardDescription>
            Enter an invite code to view documents shared with you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Enter invite code"
                value={newInviteCode}
                onChange={(e) => setNewInviteCode(e.target.value)}
                maxLength={6}
                className="flex-1"
              />
              <Button
                onClick={handleRedeemInviteCode}
                disabled={isRedeeming || !newInviteCode.trim()}
              >
                {isRedeeming ? "Redeeming..." : "Redeem"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InviteCodeManager;
