// app/api/states/active/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { SSMClient, GetParametersCommand } from '@aws-sdk/client-ssm';

const REGION = process.env.AWS_REGION || 'us-west-2';
const ALL_STATES = ['CA', 'MT', 'IL', 'MO', 'OK', 'NY'];

const ssm = new SSMClient({
  region: REGION,
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        }
      : undefined,
});

export async function GET() {
  try {
    const Names = ALL_STATES.map((s) => `/green-pages/states/${s}/active`);
    const { Parameters = [] } = await ssm.send(
      new GetParametersCommand({ Names, WithDecryption: true })
    );

    const activeStates = ALL_STATES.filter((s) => {
      const p = Parameters.find((p) => p.Name === `/green-pages/states/${s}/active`);
      return p?.Value !== 'false'; // treat missing or anything else as active
    });

    return NextResponse.json(activeStates, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json(ALL_STATES, {
      headers: {
        'Cache-Control': 'no-store',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
      },
    });
  }
}
