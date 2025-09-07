import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate required fields
    const { name, email, phone, companySize, monthlyDeals, biggestBlocker, utmSource, utmMedium, utmCampaign } = body;
    
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Prepare lead data
    const leadData = {
      name,
      email,
      phone: phone || '',
      companySize: companySize || '',
      monthlyDeals: monthlyDeals || 0,
      biggestBlocker: biggestBlocker || '',
      utmSource: utmSource || '',
      utmMedium: utmMedium || '',
      utmCampaign: utmCampaign || '',
      timestamp: new Date().toISOString(),
      source: 'FlipOps Website'
    };

    // Send to CRM webhook if configured
    const crmWebhookUrl = process.env.NEXT_PUBLIC_CRM_WEBHOOK_URL;
    if (crmWebhookUrl && crmWebhookUrl !== 'https://your-crm-endpoint.com/webhook') {
      try {
        await fetch(crmWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(leadData),
        });
      } catch (error) {
        console.error('Failed to send to CRM:', error);
        // Continue even if CRM fails
      }
    }

    // Send email notification via Resend (if API key is configured)
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey && resendApiKey !== 're_your_api_key') {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(resendApiKey);
        
        await resend.emails.send({
          from: 'FlipOps <notifications@flipops.io>',
          to: 'hello@flipops.io',
          subject: `New Lead: ${name}`,
          html: `
            <h2>New Lead from FlipOps Website</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
            <p><strong>Company Size:</strong> ${companySize || 'Not provided'}</p>
            <p><strong>Monthly Deals:</strong> ${monthlyDeals || 'Not provided'}</p>
            <p><strong>Biggest Blocker:</strong> ${biggestBlocker || 'Not provided'}</p>
            <hr/>
            <p><small>UTM Source: ${utmSource || 'Direct'}</small></p>
            <p><small>UTM Medium: ${utmMedium || 'None'}</small></p>
            <p><small>UTM Campaign: ${utmCampaign || 'None'}</small></p>
          `,
        });
      } catch (error) {
        console.error('Failed to send email:', error);
        // Continue even if email fails
      }
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Thank you! We\'ll be in touch within 24 hours.' 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Lead capture error:', error);
    return NextResponse.json(
      { error: 'Failed to process lead' },
      { status: 500 }
    );
  }
}