import { NextRequest, NextResponse } from 'next/server';

// Simple schema for Google Sheets data
interface SheetProperty {
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  owner_name?: string;
  foreclosure?: string;
  pre_foreclosure?: string;
  tax_delinquent?: string;
  vacant?: string;
  bankruptcy?: string;
  absentee_owner?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('📊 Google Sheets Webhook Received:', JSON.stringify(body, null, 2));

    // Handle both single property and array of properties
    const properties = Array.isArray(body) ? body : [body];
    const results = [];

    for (const prop of properties) {
      // Calculate score based on indicators
      let score = 30; // Base score

      // Parse string boolean values
      if (prop.foreclosure === 'yes') score += 25;
      if (prop.pre_foreclosure === 'yes') score += 20;
      if (prop.tax_delinquent === 'yes') score += 15;
      if (prop.vacant === 'yes') score += 10;
      if (prop.bankruptcy === 'yes') score += 8;
      if (prop.absentee_owner === 'yes') score += 5;

      const result = {
        address: prop.address || 'Unknown Address',
        score,
        highScore: score >= 80
      };

      results.push(result);

      // Log high-scoring properties
      if (score >= 80) {
        console.log(`🔥 HIGH-SCORE PROPERTY: ${prop.address} (Score: ${score})`);
        console.log(`   City: ${prop.city}, State: ${prop.state}`);
        console.log(`   Owner: ${prop.owner_name}`);
        console.log(`   Indicators:`);
        if (prop.foreclosure === 'yes') console.log('   - Foreclosure');
        if (prop.pre_foreclosure === 'yes') console.log('   - Pre-foreclosure');
        if (prop.tax_delinquent === 'yes') console.log('   - Tax Delinquent');
        if (prop.vacant === 'yes') console.log('   - Vacant');
        if (prop.bankruptcy === 'yes') console.log('   - Bankruptcy');
        if (prop.absentee_owner === 'yes') console.log('   - Absentee Owner');

        // Here you would trigger Slack alerts
        // For now, just log that we would send an alert
        console.log(`   📱 Would send Slack alert for score ${score}+`);
      }
    }

    // Return summary
    const response = {
      success: true,
      processed: properties.length,
      highScoreCount: results.filter(r => r.highScore).length,
      results: results
    };

    console.log('✅ Sheets webhook processed successfully:', response);

    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error('❌ Sheets webhook error:', error);
    return NextResponse.json(
      {
        error: 'Processing failed',
        message: error.message,
        details: error.stack
      },
      { status: 500 }
    );
  }
}

// GET endpoint for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ready',
    endpoint: '/api/webhooks/sheets',
    method: 'POST',
    expects: 'Array of property objects from Google Sheets',
    example: {
      address: '123 Main St',
      city: 'Miami',
      state: 'FL',
      zip: '33139',
      owner_name: 'John Doe',
      foreclosure: 'yes',
      pre_foreclosure: 'no',
      tax_delinquent: 'yes',
      vacant: 'no',
      bankruptcy: 'no',
      absentee_owner: 'yes'
    }
  });
}