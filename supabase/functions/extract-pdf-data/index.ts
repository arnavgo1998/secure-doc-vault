
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the formData
    const formData = await req.formData();
    const file = formData.get('file');
    
    if (!file || !(file instanceof File)) {
      throw new Error("No file provided or invalid file");
    }

    // Currently, we're simulating PDF extraction since we can't use PDF parsing libraries directly
    // In a real implementation, you would use a PDF library to extract the text
    // and then apply NLP/regex to identify the relevant information
    
    // Simulate extraction with random data - in a real implementation this would be replaced
    // with actual extraction logic
    const insuranceTypes = ["Health", "Auto", "Life", "Property", "General"];
    const providers = ["AllState", "State Farm", "Liberty Mutual", "Progressive", "Geico", "BlueCross"];
    
    const extractedData = {
      type: insuranceTypes[Math.floor(Math.random() * insuranceTypes.length)],
      policy_number: `POL-${Math.floor(Math.random() * 1000000)}`,
      provider: providers[Math.floor(Math.random() * providers.length)],
      premium: Math.floor(Math.random() * 1000) + 100,
      due_date: new Date(Date.now() + Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };

    console.log("Extracted data:", extractedData);
    
    return new Response(
      JSON.stringify(extractedData),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error("Error in PDF extraction:", error.message);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
